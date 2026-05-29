// Aetheria Daily Art Generator for GitHub Actions (Node.js)
// This script runs on the cloud, calls the Hugging Face API, saves the image,
// appends the new record to mock-data.js, and pushes a Telegram alert.

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read Environment Variables
const HF_API_KEY = process.env.HF_API_KEY;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!HF_API_KEY) {
  console.error("Error: Missing HF_API_KEY environment variable.");
  process.exit(1);
}

// Generate YYYY-MM-DD strings
const d = new Date();
const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateFormatted = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });

// Default Prompt configs (used in cloud generation)
const DEFAULT_THEME = "A futuristic glass greenhouse floating in deep space, glowing cosmic stars, botanical fantasy";
const STYLES = ["Studio Ghibli", "Cyberpunk Watercolor", "Cosmic Surrealism"];
const PALETTES = ["Neon / High Contrast", "Vibrant / Warm", "Pastel / Cosmic"];

// Synthesize prompt (Cloud version)
function synthesizePrompt() {
  const chosenStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
  const chosenPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  return `${DEFAULT_THEME}, rendered in ${chosenStyle} style, with a ${chosenPalette} color palette, whimsical, detailed, 8k resolution`;
}

const prompt = synthesizePrompt();
const selectedStyle = STYLES[0];
const selectedPalette = PALETTES[0];

console.log(`Today's Synthesized Prompt: "${prompt}"`);

// Helper sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to make HTTPS requests to Hugging Face with Retry & Cold Start handling
async function callHuggingFace(prompt, retries = 5, delay = 8000) {
  const model = "stabilityai/stable-diffusion-xl-base-1.0";
  const postData = JSON.stringify({ inputs: prompt });

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Contacting Hugging Face endpoint (Attempt ${i + 1}/${retries})...`);
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'router.huggingface.co',
          port: 443,
          path: `/hf-inference/models/${model}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let resData = '';
          
          if (res.statusCode === 503) {
            // Model is loading, read the body to see how long to wait
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
              try {
                const parsed = JSON.parse(resData);
                resolve({ loading: true, estimated_time: parsed.estimated_time || 20 });
              } catch (e) {
                resolve({ loading: true, estimated_time: 20 });
              }
            });
            return;
          }

          if (res.statusCode !== 200) {
            res.on('data', chunk => resData += chunk);
            res.on('end', () => reject(new Error(`API Error (${res.statusCode}): ${resData}`)));
            return;
          }

          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve({ loading: false, buffer: Buffer.concat(chunks) }));
        });

        // Timeout request after 15 seconds to prevent hanging
        req.setTimeout(15000, () => {
          req.destroy(new Error("Request Timeout"));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
      });

      if (result.loading) {
        const waitTime = Math.min(Math.max(Math.ceil(result.estimated_time), 10), 30);
        console.log(`Model is currently loading on Hugging Face. Waiting for ${waitTime}s before retrying...`);
        await sleep(waitTime * 1000);
      } else {
        return result.buffer;
      }

    } catch (err) {
      console.warn(`Attempt ${i + 1} encountered an error: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      
      const currentDelay = delay * Math.pow(1.5, i); // Exponential backoff
      console.log(`Network or server fault. Retrying in ${currentDelay / 1000}s...`);
      await sleep(currentDelay);
    }
  }
  throw new Error("Max retries reached. Hugging Face model failed to load.");
}

// Helper to send Telegram message
function sendTelegramMessage(imagePath, title, promptText) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.log("Telegram credentials missing. Skipping Telegram notification.");
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: `🎨 *Aetheria Daily Art Journal* 🎨\n\nYour artwork for today has materialized on the cloud!\n\n*Title:* ${title}\n*Style:* ${selectedStyle}\n*Prompt:* _${promptText}_\n\nCommit Hash: [View on GitHub Pages]`,
      parse_mode: 'Markdown'
    });
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TG_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function sendDiscordNotification(imageBuffer, title, promptText) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log("Discord Webhook URL missing. Skipping Discord notification.");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const boundary = '----AetheriaBoundary' + Math.random().toString(36).substring(2);
    
    const payloadJson = JSON.stringify({
      content: "🎨 **Aetheria Daily Art Journal** 🎨\nYour daily masterpiece has materialized!",
      embeds: [{
        title: title,
        description: `**Style**: ${selectedStyle}\n**Palette**: ${selectedPalette}\n\n**Prompt**:\n*${promptText}*`,
        color: 8542437, // Royal Purple (#8257E5)
        image: {
          url: "attachment://artwork.png"
        },
        timestamp: new Date().toISOString()
      }]
    });

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n${payloadJson}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files[0]"; filename="artwork.png"\r\nContent-Type: image/png\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];

    const body = Buffer.concat(parts);

    const urlObj = new URL(DISCORD_WEBHOOK_URL);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("Discord Webhook notification sent successfully.");
        } else {
          console.warn(`Discord Webhook failed (${res.statusCode}): ${resData}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error("Discord Webhook request error:", e);
      resolve(); // Don't crash workflow if notification fails
    });

    req.write(body);
    req.end();
  });
}

async function run() {
  try {
    console.log("Connecting to Hugging Face...");
    const buffer = await callHuggingFace(prompt);
    
    // Ensure directory exists
    const gensDir = path.join(__dirname, 'assets', 'generations');
    if (!fs.existsSync(gensDir)) {
      fs.mkdirSync(gensDir, { recursive: true });
    }
    
    const filename = `daily_${todayStr}.png`;
    const localPath = path.join(gensDir, filename);
    const relativePath = `assets/generations/${filename}`;
    
    fs.writeFileSync(localPath, buffer);
    console.log(`Image saved successfully to: ${localPath}`);
    
    // Update mock-data.js so the web app history displays it
    const mockDataPath = path.join(__dirname, 'mock-data.js');
    let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
    
    const title = `Cosmic Growth #${todayStr.split('-').slice(1).join('')}`;
    
    const newEntry = {
      id: `gen-${todayStr}`,
      date: todayStr,
      title: title,
      prompt: prompt,
      imagePath: relativePath,
      style: selectedStyle,
      palette: selectedPalette,
      dateFormatted: dateFormatted
    };
    
    // Insert new entry into window.MOCK_DATA array
    const arrayMatch = mockDataContent.match(/window\.MOCK_DATA\s*=\s*\[([\s\S]*?)\];/);
    if (arrayMatch) {
      const itemsString = arrayMatch[1];
      const entryString = `\n  ${JSON.stringify(newEntry, null, 4).replace(/\n/g, '\n  ')},`;
      const updatedItems = entryString + itemsString;
      mockDataContent = mockDataContent.replace(arrayMatch[0], `window.MOCK_DATA = [${updatedItems}];`);
      fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
      console.log("mock-data.js history registry updated successfully.");
    } else {
      console.warn("Could not parse window.MOCK_DATA in mock-data.js to append entry.");
    }
    
    // Send Notifications (Telegram & Discord)
    console.log("Sending Telegram push alerts...");
    await sendTelegramMessage(relativePath, title, prompt);
    
    console.log("Sending Discord push alerts...");
    await sendDiscordNotification(buffer, title, prompt);
    
    console.log("Process complete!");
    
  } catch (err) {
    console.error("Execution failed:", err);
    process.exit(1);
  }
}

run();
