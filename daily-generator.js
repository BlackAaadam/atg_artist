// Aetheria Daily Art Generator for GitHub Actions (Node.js)
// This script runs on the cloud, calls the Hugging Face API, saves the image,
// appends the new record to mock-data.js, and pushes a Telegram/Discord alert.

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

// Load Configuration File (if it exists)
let config = {
  activeProjects: ["ui_ux", "line_sticker", "aesthetic_landscape", "abstract_illustration", "quote_card_background"],
  notifyTime: "08:00"
};

const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...loadedConfig };
    console.log("Loaded custom configurations:", config);
  } catch (err) {
    console.warn("Failed to load config.json, using defaults:", err.message);
  }
}

// Sub-Projects metadata
const SUB_PROJECTS = [
  { id: "ui_ux", name: "UI/UX Design" },
  { id: "line_sticker", name: "LINE Sticker" },
  { id: "aesthetic_landscape", name: "Aesthetic & Landscape" },
  { id: "abstract_illustration", name: "Abstract Illustration" },
  { id: "quote_card_background", name: "Quote Card Background" }
];

const DEFAULT_PROJECT_PREFS = {
  ui_ux: {
    theme: "A modern smart home mobile app dashboard interface design, sleek minimalist dashboard, user interface, dark mode",
    activeStyles: ["Line Art Illustration"],
    activePalettes: ["Neon / High Contrast"],
    tags: ["ui ux", "figma mockup", "user interface", "clean layout", "minimalist", "vector geometry", "glowing elements"]
  },
  line_sticker: {
    theme: "A cute little red panda displaying a happy excited expression, chibi character, white background, sticker border",
    activeStyles: ["Studio Ghibli", "Line Art Illustration"],
    activePalettes: ["Vibrant / Warm"],
    tags: ["sticker", "emoji", "bold outlines", "isolated character", "cute chibi", "flat colors", "cartoon style"]
  },
  aesthetic_landscape: {
    theme: "A quiet foggy lake in the mountains at sunrise, pine trees silhouette, hipster aesthetic style photo, vintage warm filter",
    activeStyles: ["Oil Impressionism", "Cosmic Surrealism"],
    activePalettes: ["Pastel / Cosmic"],
    tags: ["hipster style", "aesthetic photography", "analogue film grain", "warm nostalgic tones", "vsco look", "minimalist nature", "soft lighting"]
  },
  abstract_illustration: {
    theme: "A dreamlike cosmic landscape with floating crystals and geometric portals, pastel clouds",
    activeStyles: ["Cosmic Surrealism", "Cyberpunk Watercolor"],
    activePalettes: ["Pastel / Cosmic"],
    tags: ["surreal illustration", "abstract portal", "dreamscape", "geometric shapes", "cosmic energy", "digital painting"]
  },
  quote_card_background: {
    theme: "An artistic minimalist abstract background for a quote card, textured canvas, subtle gradient color flow, copy space, elegant composition",
    activeStyles: ["Oil Impressionism", "Cyberpunk Watercolor"],
    activePalettes: ["Pastel / Cosmic"],
    tags: ["quote background", "abstract canvas", "copy space", "minimalist art", "textured background", "soft pastel gradient", "artistic wallpaper"]
  }
};

// Synthesize prompt (Cloud version)
function synthesizePrompt(prefs) {
  const chosenStyle = prefs.activeStyles[Math.floor(Math.random() * prefs.activeStyles.length)] || "Digital Art";
  const chosenPalette = prefs.activePalettes && prefs.activePalettes.length > 0
    ? prefs.activePalettes[Math.floor(Math.random() * prefs.activePalettes.length)]
    : (prefs.activePalette || "Vibrant Colors");
  const tagsStr = prefs.tags && prefs.tags.length > 0 ? prefs.tags.join(", ") : "";
  
  let parts = [
    prefs.theme,
    `rendered in ${chosenStyle} style`,
    `with a ${chosenPalette} color palette`
  ];
  if (tagsStr) parts.push(tagsStr);
  
  return {
    prompt: parts.join(", ").replace(/\s+/g, ' ').trim(),
    style: chosenStyle,
    palette: chosenPalette
  };
}

// Helper sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to make HTTPS requests to Hugging Face with Retry & Cold Start handling
async function callHuggingFace(promptText, retries = 5, delay = 8000) {
  const model = "black-forest-labs/FLUX.1-schnell";
  const postData = JSON.stringify({ inputs: promptText });

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

// Helper to send Telegram message with photo attachment
function sendTelegramMessage(imageBuffer, title, promptText, projectName, styleName, paletteName) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.log("Telegram credentials missing. Skipping Telegram notification.");
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const boundary = '----TelegramBoundary' + Math.random().toString(36).substring(2);
    const captionText = `🎨 *Aetheria Daily Art Journal* 🎨\n\nYour artwork for today has materialized!\n\n*Project:* ${projectName}\n*Title:* ${title}\n*Style:* ${styleName}\n*Palette:* ${paletteName}\n*Prompt:* _${promptText}_`;

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${TG_CHAT_ID}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${captionText}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="artwork.png"\r\nContent-Type: image/png\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];

    const body = Buffer.concat(parts);

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TG_BOT_TOKEN}/sendPhoto`,
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
        if (res.statusCode === 200) {
          console.log("Telegram photo sent successfully.");
        } else {
          console.warn(`Telegram sendPhoto failed (${res.statusCode}): ${resData}`);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error("Telegram request error:", e);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

function sendDiscordNotification(imageBuffer, title, promptText, projectName, styleName, paletteName) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log("Discord Webhook URL missing. Skipping Discord notification.");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const boundary = '----AetheriaBoundary' + Math.random().toString(36).substring(2);
    
    const payloadJson = JSON.stringify({
      content: `🎨 **Aetheria Daily Art Journal** 🎨\nYour daily masterpiece for **${projectName}** has materialized!`,
      embeds: [{
        title: title,
        description: `**Project**: ${projectName}\n**Style**: ${styleName}\n**Palette**: ${paletteName}\n\n**Prompt**:\n*${promptText}*`,
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
    const activeProjectsToRun = SUB_PROJECTS.filter(p => config.activeProjects.includes(p.id));
    if (activeProjectsToRun.length === 0) {
      console.log("No active projects found in configurations. Skipping daily generation.");
      return;
    }
    
    console.log(`Generating artwork for ${activeProjectsToRun.length} active projects: ${activeProjectsToRun.map(p => p.name).join(", ")}`);
    
    // Ensure generations directory exists
    const gensDir = path.join(__dirname, 'assets', 'generations');
    if (!fs.existsSync(gensDir)) {
      fs.mkdirSync(gensDir, { recursive: true });
    }
    
    const errors = [];
    
    for (const project of activeProjectsToRun) {
      try {
        console.log(`\n========================================`);
        console.log(`Running Generation for Project: ${project.name}`);
        console.log(`========================================`);
        
        const prefs = (config.projectPrefs && config.projectPrefs[project.id]) 
          ? config.projectPrefs[project.id] 
          : DEFAULT_PROJECT_PREFS[project.id];
        const { prompt, style, palette } = synthesizePrompt(prefs);
        console.log(`Synthesized Prompt: "${prompt}"`);
        
        console.log("Connecting to Hugging Face...");
        const buffer = await callHuggingFace(prompt);
        
        // Save the image with project suffix to prevent collision
        const filename = `daily_${project.id}_${todayStr}.png`;
        const localPath = path.join(gensDir, filename);
        const relativePath = `assets/generations/${filename}`;
        
        fs.writeFileSync(localPath, buffer);
        console.log(`Image saved successfully to: ${localPath}`);
        
        // Update mock-data.js so the web app history displays it
        const mockDataPath = path.join(__dirname, 'mock-data.js');
        let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
        
        const projectNumHash = todayStr.split('-').slice(1).join('');
        const title = `${project.name} #${projectNumHash}`;
        
        const newEntry = {
          id: `gen-${project.id}-${todayStr}`,
          project: project.id,
          date: todayStr,
          title: title,
          prompt: prompt,
          imagePath: relativePath,
          style: style,
          palette: palette,
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
          console.log(`mock-data.js history registry updated successfully for ${project.name}.`);
        } else {
          console.warn(`Could not parse window.MOCK_DATA in mock-data.js to append entry for ${project.name}.`);
        }
        
        // Send Notifications (Telegram & Discord)
        console.log(`Sending Telegram push alerts for ${project.name}...`);
        await sendTelegramMessage(buffer, title, prompt, project.name, style, palette);
        
        console.log(`Sending Discord push alerts for ${project.name}...`);
        await sendDiscordNotification(buffer, title, prompt, project.name, style, palette);
        
        console.log(`Successfully completed generation for ${project.name}.`);
        
        // Wait 3 seconds between runs to prevent API spamming / rate limits
        await sleep(3000);
        
      } catch (projectErr) {
        console.error(`Generation failed for project ${project.name}:`, projectErr);
        errors.push({ project: project.name, error: projectErr.message });
      }
    }
    
    if (errors.length > 0) {
      console.error(`\nCompleted with ${errors.length} errors:`, errors);
      if (errors.length === activeProjectsToRun.length) {
        // If ALL active projects failed, exit with code 1
        process.exit(1);
      }
    } else {
      console.log("\nAll daily generations completed successfully!");
    }
    
  } catch (err) {
    console.error("Critical script error:", err);
    process.exit(1);
  }
}

run();
