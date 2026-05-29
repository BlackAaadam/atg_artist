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
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN;

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

// Helper to make HTTPS requests to Hugging Face
function callHuggingFace(prompt) {
  return new Promise((resolve, reject) => {
    const model = "stabilityai/stable-diffusion-xl-base-1.0";
    const postData = JSON.stringify({ inputs: prompt });
    
    const options = {
      hostname: 'api-inference.huggingface.co',
      port: 443,
      path: `/models/${model}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', chunk => errData += chunk);
        res.on('end', () => reject(new Error(`API Error (${res.statusCode}): ${errData}`)));
        return;
      }
      
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
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

function sendLineNotification(imageBuffer, title, promptText) {
  if (!LINE_NOTIFY_TOKEN) {
    console.log("LINE Notify token missing. Skipping LINE notification.");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const boundary = '----AetheriaBoundary' + Math.random().toString(36).substring(2);
    const messageText = `\n🎨 Aetheria Art Journal 🎨\n\nToday's daily artwork has materialized!\n\nTitle: ${title}\nStyle: ${selectedStyle}\nPrompt: ${promptText}`;

    // Construct multipart form data body manually
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\n${messageText}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="imageFile"; filename="artwork.png"\r\nContent-Type: image/png\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];

    const body = Buffer.concat(parts);

    const options = {
      hostname: 'notify-api.line.me',
      port: 443,
      path: '/api/notify',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log("LINE Notify notification sent successfully.");
        } else {
          console.warn(`LINE Notify failed (${res.statusCode}): ${resData}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error("LINE Notify request error:", e);
      resolve(); // Don't crash the script if notifications fail
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
    
    // Send Notifications (Telegram & LINE)
    console.log("Sending Telegram push alerts...");
    await sendTelegramMessage(relativePath, title, prompt);
    
    console.log("Sending LINE Notify push alerts...");
    await sendLineNotification(buffer, title, prompt);
    
    console.log("Process complete!");
    
  } catch (err) {
    console.error("Execution failed:", err);
    process.exit(1);
  }
}

run();
