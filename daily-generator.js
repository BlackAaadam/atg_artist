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
  activeProjects: ["poetic_editorial", "botanical_growth", "gift_relationship", "time_passage_threshold", "sacred_still_life"],
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
  { id: "poetic_editorial", name: "Poetic Editorial Photography" },
  { id: "botanical_growth", name: "Botanical Growth" },
  { id: "gift_relationship", name: "Gift & Relationship" },
  { id: "time_passage_threshold", name: "Time, Passage & Threshold" },
  { id: "sacred_still_life", name: "Sacred Still Life" }
];

const DEFAULT_PROJECT_PREFS = {
  poetic_editorial: {
    theme: "A poetic image-only editorial photograph for a quiet literary and spiritual page. No text, no typography, no letters, no captions. Use refined photographic composition, gentle negative space, subtle matte paper texture, muted natural colors, and a calm contemplative atmosphere. The image should feel like a high-quality printed magazine spread, not a generic stock photo.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Japanese Magazine Layout", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Ivory Paper / Muted Earth", "Soft Natural Editorial"],
    tags: ["high resolution", "image-only", "no text", "no typography", "no letters", "no captions", "minimalist editorial photography", "poetic photography", "quiet composition", "magazine layout", "refined print atmosphere", "ivory negative space", "subtle paper grain", "soft natural light", "muted earth tones", "contemplative mood", "literary atmosphere", "spiritual calm"]
  },
  botanical_growth: {
    theme: "An image-only poetic botanical photograph symbolizing growth, quiet resilience, renewal, and spiritual life. No text, no typography, no letters, no captions. Feature natural subjects such as moss, sprouts, leaves, roots, bark, small flowers, soil, stones, or plants emerging from unexpected places. The mood should feel gentle, hopeful, grounded, and contemplative.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Earth / Forest", "Warm Paper / Forest Green", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "botanical photography", "symbolic nature", "moss green", "forest green", "sprout", "leaves", "bark", "roots", "soil", "stone", "quiet growth", "resilience", "renewal", "hope", "spiritual mood", "soft morning light", "diffused natural light", "macro detail", "shallow depth of field", "matte paper texture", "refined print texture", "muted earth tones"]
  },
  gift_relationship: {
    theme: "A poetic image-only lifestyle still-life photograph symbolizing gift, exchange, companionship, and human connection. No text, no typography, no letters, no captions. Feature objects such as wrapped gifts, ribbons, hands preparing something, two cups, shared table scenes, paired objects, flowers, envelopes, cloth, or a quiet dining table. The image should feel warm, thoughtful, and refined.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Japanese Magazine Layout", "Matte Paper Print"],
    activePalettes: ["Warm Paper / Forest Green", "Soft Natural Editorial", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "poetic still life", "lifestyle photography", "wrapped gift", "ribbon", "shared table", "two cups", "paired objects", "hands preparing", "quiet relationship", "companionship", "exchange", "gift", "care", "warm natural light", "soft shadows", "linen texture", "paper texture", "refined print atmosphere", "muted warm tones", "literary mood", "spiritual calm"]
  },
  time_passage_threshold: {
    theme: "An image-only poetic editorial photograph symbolizing time, passage, waiting, threshold, transition, and spiritual reflection. No text, no typography, no letters, no captions. Feature symbolic scenes such as clocks, doors, corridors, windows, paths, empty chairs, shadows on a wall, a quiet street, a doorway, or a passage of light. The mood should be calm, serious, contemplative, and emotionally resonant.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Japanese Magazine Layout", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Monochrome / Dark", "Matte Cream / Ink Gray", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "symbolic photography", "time", "passage", "threshold", "waiting", "doorway", "corridor", "window light", "clock", "empty chair", "quiet path", "soft shadow", "contemplative atmosphere", "spiritual reflection", "muted gray tones", "warm ivory paper", "cinematic stillness", "refined editorial photography", "matte paper texture", "subtle grain", "poetic silence"]
  },
  sacred_still_life: {
    theme: "A quiet image-only poetic still-life photograph with a sacred devotional mood. No text, no typography, no letters, no captions. Use simple symbolic objects such as a candle, cup, bowl, key, open notebook without readable writing, folded cloth, bread, lamp, stone, water, wooden table, or ceramic object. The image should feel peaceful, reverent, intimate, and suitable for spiritual reflection.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Ivory Paper / Muted Earth", "Soft Natural Editorial", "Warm Paper / Forest Green", "Matte Cream / Ink Gray"],
    tags: ["high resolution", "image-only", "no text", "sacred still life", "devotional mood", "quiet object", "candle", "cup", "bowl", "key", "folded cloth", "bread", "ceramic", "wooden table", "soft window light", "gentle shadow", "reverent atmosphere", "spiritual calm", "poetic stillness", "minimalist composition", "tactile paper grain", "matte print texture", "muted earth tones", "warm neutral background", "refined editorial photography"]
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
  
  // Recent feedback/memorandum injection
  if (prefs.recentFeedback && prefs.recentFeedback.trim().length > 0) {
    parts.push(`incorporating visual style instructions: ${prefs.recentFeedback.trim()}`);
  }
  
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
  const model = config.model || "black-forest-labs/FLUX.1-schnell";
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
