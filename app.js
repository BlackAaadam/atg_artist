// Aetheria AI Art Journal - Core Application Logic
// Handles state, IndexedDB storage for images, API generation, and adaptive feedback loops

// --- INDEXED DB ENGINE (To store heavy image blobs without localStorage limits) ---
const DB_NAME = "AetheriaDB";
const DB_VERSION = 1;
const STORE_NAME = "images";

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveImageBlob(id, blob) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getImageBlobUrl(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) {
        const url = URL.createObjectURL(request.result);
        resolve(url);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function deleteImageBlob(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// --- STATE MANAGEMENT ---
const DEFAULT_PREFERENCES = {
  theme: "Cyberpunk street scene with rainy atmosphere",
  activeStyles: ["Studio Ghibli", "Cyberpunk Watercolor"],
  activePalette: "Neon / High Contrast",
  tags: ["cozy", "neon glow", "rainy", "highly detailed"],
  excludedTags: ["ugly", "blurry", "deformed"]
};

const DEFAULT_SETTINGS = {
  mode: "mock", // "mock" | "huggingface" | "openai"
  apiKey: "",
  model: "stabilityai/stable-diffusion-xl-base-1.0",
  scheduleTime: "02:00",
  notifyTime: "08:00",
  telegramBotToken: "",
  telegramChatId: ""
};

let appState = {
  preferences: { ...DEFAULT_PREFERENCES },
  settings: { ...DEFAULT_SETTINGS },
  history: [], // Metadata stored in localStorage
  activeTab: "dashboard",
  todayGeneration: null, // Today's generation metadata if it exists
  imageUrls: {} // Cache of objectUrls mapped from IndexedDB blobs
};

// --- INITIALIZE APP ---
document.addEventListener("DOMContentLoaded", async () => {
  loadDataFromStorage();
  await loadHistoryBlobs();
  setupNavigation();
  setupPreferencesTab();
  setupSettingsTab();
  renderDashboard();
  renderGallery();
  checkDailySchedule();
  setupReviewListeners();
  
  // Custom interactive listeners
  document.getElementById("btn-generate-today").addEventListener("click", triggerGeneration);
  document.getElementById("btn-add-tag").addEventListener("click", addNewTag);
  document.getElementById("new-tag-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addNewTag();
  });
});

// Load preferences, settings, and metadata list from localStorage
function loadDataFromStorage() {
  const savedPrefs = localStorage.getItem("aetheria_prefs");
  if (savedPrefs) appState.preferences = JSON.parse(savedPrefs);

  const savedSettings = localStorage.getItem("aetheria_settings");
  if (savedSettings) appState.settings = JSON.parse(savedSettings);

  const savedHistory = localStorage.getItem("aetheria_history");
  if (savedHistory) {
    appState.history = JSON.parse(savedHistory);
  } else {
    // Inject mock data if fresh install
    appState.history = [...window.MOCK_DATA];
    localStorage.setItem("aetheria_history", JSON.stringify(appState.history));
  }
  
  // Check if we already have today's artwork generated
  const todayStr = getTodayString();
  appState.todayGeneration = appState.history.find(item => item.date === todayStr) || null;
}

// Convert IndexedDB stored blobs into ObjectURLs to display in browser
async function loadHistoryBlobs() {
  for (let item of appState.history) {
    if (item.imagePath.startsWith("assets/")) {
      // It's a static mock asset path
      appState.imageUrls[item.id] = item.imagePath;
    } else {
      // It's an API generated image stored in IndexedDB
      try {
        const url = await getImageBlobUrl(item.id);
        if (url) {
          appState.imageUrls[item.id] = url;
        } else {
          // Fallback image if blob missing
          appState.imageUrls[item.id] = "assets/cyberpunk_watercolor.png";
        }
      } catch (err) {
        console.error("Failed to load image blob for ", item.id, err);
      }
    }
  }
}

function saveHistory() {
  localStorage.setItem("aetheria_history", JSON.stringify(appState.history));
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getFormattedDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- ADAPTIVE PROMPT GENERATOR ENGINE (FEEDBACK LOOP) ---
function constructDailyPrompt() {
  const prefs = appState.preferences;
  const history = appState.history;
  
  // 1. Analyze historical reviews to adjust weights
  let positiveKeywords = [];
  let negativeKeywords = [];
  
  history.forEach(item => {
    if (item.rating && item.rating >= 4) {
      // High rating: extract style and tags
      positiveKeywords.push(item.style);
      // Scan prompt for descriptive nouns/adjectives
      const keywords = item.prompt.split(',').map(s => s.trim());
      if (keywords.length > 2) {
        positiveKeywords.push(keywords[keywords.length - 2]); // grab descriptive details
      }
    } else if (item.rating && item.rating <= 2) {
      // Low rating: add to negative filter
      negativeKeywords.push(item.style);
    }
  });

  // Unique elements
  positiveKeywords = [...new Set(positiveKeywords)].filter(Boolean);
  negativeKeywords = [...new Set(negativeKeywords)].filter(Boolean);

  // 2. Select visual descriptors based on active settings
  const chosenStyle = prefs.activeStyles.length > 0 
    ? prefs.activeStyles[Math.floor(Math.random() * prefs.activeStyles.length)] 
    : "Digital Painting";
    
  const chosenPalette = prefs.activePalette || "Vibrant Colors";
  
  const additionalTags = prefs.tags.filter(t => !negativeKeywords.includes(t));
  
  // 3. Synthesize the prompt
  let promptParts = [];
  
  // Core theme
  promptParts.push(prefs.theme);
  
  // Style injector
  promptParts.push(`rendered in ${chosenStyle} style`);
  
  // Color palette injector
  promptParts.push(`with a ${chosenPalette} color palette`);
  
  // Review-based positive reinforcement
  if (positiveKeywords.length > 0) {
    const bonusStyle = positiveKeywords[Math.floor(Math.random() * positiveKeywords.length)];
    promptParts.push(`incorporating elements of ${bonusStyle}`);
  }
  
  // Tags
  if (additionalTags.length > 0) {
    promptParts.push(additionalTags.join(", "));
  }
  
  // Concat and clean
  return promptParts.join(", ").replace(/\s+/g, ' ').trim();
}

// --- AUTOMATED ON-DEMAND SCHEDULER ---
function checkDailySchedule() {
  const todayStr = getTodayString();
  const alreadyGenerated = appState.history.some(item => item.date === todayStr);
  
  if (!alreadyGenerated) {
    // Trigger desktop notification banner
    setTimeout(() => {
      showNotification("A new day has arrived! Click to generate today's artwork.");
    }, 1500);
  }
}

function showNotification(message) {
  const banner = document.getElementById("notification-banner");
  banner.querySelector("p").innerText = message;
  banner.classList.add("active");
  
  // Clicking the notification focuses the dashboard
  banner.onclick = () => {
    switchTab("dashboard");
    banner.classList.remove("active");
  };
  
  setTimeout(() => {
    banner.classList.remove("active");
  }, 7000);
}

// --- NAVIGATION PANEL CONTROLLER ---
function setupNavigation() {
  const navItems = document.querySelectorAll("nav li");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update state
  appState.activeTab = tabId;
  
  // UI update
  document.querySelectorAll("nav li").forEach(li => {
    li.classList.toggle("active", li.getAttribute("data-tab") === tabId);
  });
  
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.toggle("active", tab.id === `${tabId}-tab`);
  });
  
  // Trigger specific tab renders
  if (tabId === "gallery") renderGallery();
  if (tabId === "preferences") renderPreferencesPromptPreview();
}

// --- DASHBOARD PANEL RENDERER ---
function renderDashboard() {
  const container = document.getElementById("dashboard-container");
  
  // If no artwork generated today, render placeholder
  if (!appState.todayGeneration) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: span 2; display: flex; justify-content: center; padding: 4rem 2rem;">
        <div class="generator-placeholder">
          <div class="generator-placeholder-icon">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l8.982-8.982m-8.982 3.886l5.771-5.771m0 0L19 4.018l-9 9m9-9l-8.982 8.982" /></svg>
          </div>
          <h3>Your Studio is Ready</h3>
          <p>We'll combine your visual preferences, favorite colors, and historic ratings to design today's custom masterpiece.</p>
          <button class="btn-primary" id="btn-generate-today-inner">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.547 9.34 4.5 10.561 4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Create Today's Artwork
          </button>
        </div>
      </div>
    `;
    
    // Bind trigger to the inner button
    document.getElementById("btn-generate-today-inner").onclick = triggerGeneration;
    return;
  }
  
  // Render layout with today's artwork and review panel
  const item = appState.todayGeneration;
  const imageSrc = appState.imageUrls[item.id] || item.imagePath;
  const isReviewed = item.rating !== undefined;
  
  container.innerHTML = `
    <div class="artwork-display">
      <div class="glass-card" style="padding: 1rem;">
        <div class="artwork-frame">
          <img src="${imageSrc}" class="artwork-image" alt="Today's Artwork">
          <div class="artwork-overlay">
            <div class="overlay-details">
              <h3>${item.title}</h3>
              <p>Generated on ${item.dateFormatted}</p>
            </div>
            <div class="overlay-actions">
              <button class="btn-utility" id="btn-download-today" title="Download Image">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div style="padding: 1rem 0.5rem 0.5rem 0.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 class="font-title" style="font-size:1.5rem; font-weight:800;">${item.title}</h2>
            <span class="pill accent"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.181 0l5.141-5.141a2.25 2.25 0 000-3.181l-9.58-9.581A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg> ${item.style}</span>
          </div>
          <p class="modal-prompt-box" style="margin-top: 1rem; background:rgba(0,0,0,0.15)">
            <strong>AI Prompt:</strong> ${item.prompt}
          </p>
        </div>
      </div>
    </div>
    
    <div class="glass-card">
      <div class="panel-header">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.15-.426.837-.426.98 0l2.302 6.565a.478.478 0 00.454.325l6.908.575c.445.037.623.585.292.89l-5.08 4.675a.478.478 0 00-.144.444l1.378 6.78a.497.497 0 01-.734.534l-6.096-3.754a.478.478 0 00-.532 0l-6.096 3.754a.497.497 0 01-.734-.534l1.378-6.78a.478.478 0 00-.144-.444L2.83 12.518c-.33-.305-.152-.853.292-.89l6.908-.575a.478.478 0 00.454-.325l2.302-6.565z" /></svg>
        <h2>Journal Review</h2>
      </div>
      
      <div class="review-form" id="dashboard-review-form">
        ${isReviewed ? renderAlreadyReviewedState(item) : renderActiveReviewForm(item)}
      </div>
    </div>
  `;
  
  // Bind interactive actions
  document.getElementById("btn-download-today").onclick = () => downloadImage(item.title, imageSrc);
  if (!isReviewed) {
    setupReviewListeners();
  }
}

function renderActiveReviewForm(item) {
  return `
    <div class="review-row">
      <label>Rate your response</label>
      <div class="stars-container" id="stars-row">
        <button class="star-btn" data-star="1">★</button>
        <button class="star-btn" data-star="2">★</button>
        <button class="star-btn" data-star="3">★</button>
        <button class="star-btn" data-star="4">★</button>
        <button class="star-btn" data-star="5">★</button>
      </div>
    </div>
    
    <div class="review-row">
      <label>Feedback & Aesthetics</label>
      <div class="binary-choice">
        <button class="btn-choice approve" id="btn-choice-keep">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          Keep in Journal
        </button>
        <button class="btn-choice reject" id="btn-choice-discard">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Recreate Style
        </button>
      </div>
    </div>
    
    <div class="review-row">
      <label>Notes for Tomorrow's AI</label>
      <textarea class="textarea-styled" id="review-feedback-text" placeholder="Write feedback (e.g. 'I love the starry textures. Add more trees next time, and make the neon purple highlights pop more.')"></textarea>
    </div>
    
    <button class="btn-submit-review" id="btn-submit-review">Save to Timeline</button>
  `;
}

function renderAlreadyReviewedState(item) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span style="font-size: 1.5rem; color: ${i <= item.rating ? '#ffb800' : 'rgba(255,255,255,0.08)'}">★</span>`;
  }
  return `
    <div class="review-row">
      <label>Your Score</label>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
        ${starsHtml}
        <span style="font-weight:700; color:#ffb800; font-size:1.1rem; margin-left:0.25rem;">${item.rating} / 5</span>
      </div>
    </div>
    
    <div class="review-row">
      <label>Review Verdict</label>
      <div style="margin-top:0.25rem;">
        ${item.approved 
          ? `<span class="pill accent" style="background:rgba(16,172,132,0.15); border-color:rgba(16,172,132,0.3); color:#10ac84; padding:0.5rem 1rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Approved & Kept</span>` 
          : `<span class="pill accent" style="background:rgba(255,107,107,0.15); border-color:rgba(255,107,107,0.3); color:#ff6b6b; padding:0.5rem 1rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Desired Revision</span>`
        }
      </div>
    </div>
    
    <div class="review-row">
      <label>Your Feedback Logs</label>
      <p style="font-size:0.95rem; font-style:italic; line-height:1.6; color:var(--text-primary); background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
        "${item.feedback || 'No written notes provided.'}"
      </p>
    </div>
    
    <div style="border-top:1px dashed rgba(255,255,255,0.05); padding-top:1.5rem; margin-top:0.5rem; text-align:center;">
      <p style="font-size:0.8rem; color:var(--text-muted);">This journal entry is saved securely. Future generation prompts will automatically weight styling descriptors based on this review.</p>
    </div>
  `;
}

// --- CORE GENERATION ENGINE CONTROLLER ---
async function triggerGeneration() {
  const container = document.getElementById("dashboard-container");
  
  // Set UI state to loading
  container.innerHTML = `
    <div class="glass-card" style="grid-column: span 2; height: 400px; padding: 0;">
      <div class="loading-skeleton">
        <svg class="animate-spin" width="50" height="50" fill="none" stroke="var(--accent-cyan)" stroke-width="3" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.05)"></circle>
          <path stroke-linecap="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <style>
          @keyframes spin { 100% { transform: rotate(360deg); } }
        </style>
        <p class="loading-text" id="loading-step-text">Synthesizing Prompt...</p>
      </div>
    </div>
  `;

  const todayStr = getTodayString();
  const dateFormatted = getFormattedDate(todayStr);
  const prompt = constructDailyPrompt();
  
  const stepText = document.getElementById("loading-step-text");
  
  try {
    // Stage 1: Call generation
    stepText.innerText = "Connecting to Neural Engine...";
    
    let imageBlob;
    let title = "Daily Dream " + todayStr.replace(/-/g, "/");
    let chosenStyle = appState.preferences.activeStyles[0] || "Digital Art";
    
    if (appState.settings.mode === "mock") {
      // Simulation mode
      await sleep(2000);
      stepText.innerText = "Materializing artwork...";
      await sleep(1500);
      
      // Grab a preset image based on rotation
      const presets = [
        { path: "assets/ghibli_countryside.png", style: "Studio Ghibli", title: "Valley of Wind" },
        { path: "assets/cosmic_surrealism.png", style: "Cosmic Surrealism", title: "Astral Canopy" },
        { path: "assets/cyberpunk_watercolor.png", style: "Cyberpunk Watercolor", title: "Cyber Monsoon" }
      ];
      const selectedPreset = presets[appState.history.length % presets.length];
      
      const newGen = {
        id: `gen-${todayStr}`,
        date: todayStr,
        title: selectedPreset.title,
        prompt: prompt,
        imagePath: selectedPreset.path,
        style: selectedPreset.style,
        palette: appState.preferences.activePalette,
        dateFormatted: dateFormatted
      };
      
      appState.history.unshift(newGen);
      appState.imageUrls[newGen.id] = selectedPreset.path;
      appState.todayGeneration = newGen;
      
    } else if (appState.settings.mode === "huggingface") {
      // Hugging Face API call
      if (!appState.settings.apiKey) {
        throw new Error("Missing Hugging Face API Key in Settings!");
      }
      
      await sleep(1000);
      stepText.innerText = "Submitting Prompt to Hugging Face...";
      
      const modelUrl = `https://router.huggingface.co/hf-inference/models/${appState.settings.model}`;
      
      const response = await fetch(modelUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${appState.settings.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inference API Error (${response.status}): ${errorText}`);
      }
      
      stepText.innerText = "Processing generated tensor...";
      imageBlob = await response.blob();
      
      // Save heavy blob into IndexedDB
      const id = `gen-${todayStr}`;
      await saveImageBlob(id, imageBlob);
      
      // Cache URL
      const objectUrl = URL.createObjectURL(imageBlob);
      appState.imageUrls[id] = objectUrl;
      
      const newGen = {
        id: id,
        date: todayStr,
        title: "Ethereal Concept " + todayStr.split('-').slice(1).join('/'),
        prompt: prompt,
        imagePath: `indexeddb://${id}`, // Flag pointing to IndexedDB storage
        style: chosenStyle,
        palette: appState.preferences.activePalette,
        dateFormatted: dateFormatted
      };
      
      appState.history.unshift(newGen);
      appState.todayGeneration = newGen;
      
    } else if (appState.settings.mode === "openai") {
      // OpenAI DALL-E 3 API Call
      if (!appState.settings.apiKey) {
        throw new Error("Missing OpenAI API Key in Settings!");
      }
      
      await sleep(1000);
      stepText.innerText = "Requesting DALL-E 3 Render...";
      
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${appState.settings.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`DALL-E Error: ${err.error?.message || response.statusText}`);
      }
      
      stepText.innerText = "Downloading high-resolution render...";
      const resData = await response.json();
      const imageUrl = resData.data[0].url;
      
      // Fetch the actual image blob so it's cached offline in IndexedDB
      const imageFetch = await fetch(imageUrl);
      imageBlob = await imageFetch.blob();
      
      const id = `gen-${todayStr}`;
      await saveImageBlob(id, imageBlob);
      
      const objectUrl = URL.createObjectURL(imageBlob);
      appState.imageUrls[id] = objectUrl;
      
      const newGen = {
        id: id,
        date: todayStr,
        title: "DALL-E Conceptual Art",
        prompt: prompt,
        imagePath: `indexeddb://${id}`,
        style: chosenStyle,
        palette: appState.preferences.activePalette,
        dateFormatted: dateFormatted
      };
      
      appState.history.unshift(newGen);
      appState.todayGeneration = newGen;
    }
    
    // Save state
    saveHistory();
    
    // Trigger notification push if Vercel configured
    await triggerMobileNotificationPush(appState.todayGeneration);
    
    // Complete
    renderDashboard();
    renderGallery();
    showNotification("Today's artwork is generated successfully!");
    
  } catch (error) {
    console.error("Generation failed:", error);
    container.innerHTML = `
      <div class="glass-card" style="grid-column: span 2; padding: 3rem 2rem; border-color:#ff6b6b">
        <div class="generator-placeholder" style="color:#ff6b6b">
          <div class="generator-placeholder-icon" style="background:rgba(255,107,107,0.1); color:#ff6b6b; box-shadow:none;">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h3 style="color:#ff6b6b">Render Engine Faulted</h3>
          <p style="color:var(--text-muted)">We failed to generate today's artwork. Reason: <strong>${error.message}</strong></p>
          <div style="display:flex; gap:1rem;">
            <button class="btn-primary" id="btn-retry-generation">Retry Rendering</button>
            <button class="btn-choice" id="btn-settings-page" style="flex:none; padding: 0.9rem 1.5rem;">Configure Settings</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById("btn-retry-generation").onclick = triggerGeneration;
    document.getElementById("btn-settings-page").onclick = () => switchTab("settings");
  }
}

// Helper mock sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Telegram integration trigger
async function triggerMobileNotificationPush(item) {
  const s = appState.settings;
  if (!s.telegramBotToken || !s.telegramChatId) return; // Silent skip if not setup
  
  try {
    const url = `https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`;
    const message = `🎨 *Aetheria Art Journal* 🎨\n\nYour artwork for today (*${item.dateFormatted}*) has materialized!\n\n*Title:* ${item.title}\n*Style:* ${item.style}\n*Palette:* ${item.palette}\n\n*Prompt:* _${item.prompt}_\n\nOpen your journal dashboard to review and grade this piece.`;
    
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: s.telegramChatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
    console.log("Telegram notification sent successfully.");
  } catch (err) {
    console.error("Failed to push notification to Telegram:", err);
  }
}

// --- REVIEW ACTIONS CONTROLLER ---
let selectedRating = 0;
let selectedVerdict = null;

function setupReviewListeners() {
  const stars = document.querySelectorAll("#stars-row .star-btn");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.getAttribute("data-star"));
      highlightStars(selectedRating);
    });
  });
  
  const keepBtn = document.getElementById("btn-choice-keep");
  const discardBtn = document.getElementById("btn-choice-discard");
  
  if (keepBtn && discardBtn) {
    keepBtn.addEventListener("click", () => {
      selectedVerdict = true;
      keepBtn.classList.add("active");
      discardBtn.classList.remove("active");
    });
    
    discardBtn.addEventListener("click", () => {
      selectedVerdict = false;
      discardBtn.classList.add("active");
      keepBtn.classList.remove("active");
    });
  }
  
  const submitBtn = document.getElementById("btn-submit-review");
  if (submitBtn) {
    submitBtn.onclick = submitReview;
  }
}

function highlightStars(rating) {
  const stars = document.querySelectorAll("#stars-row .star-btn");
  stars.forEach(star => {
    const val = parseInt(star.getAttribute("data-star"));
    star.classList.toggle("active", val <= rating);
  });
}

function submitReview() {
  if (selectedRating === 0) {
    alert("Please rate the generation first.");
    return;
  }
  
  if (selectedVerdict === null) {
    alert("Please choose whether you want to Keep or Discard the style.");
    return;
  }
  
  const textFeedback = document.getElementById("review-feedback-text").value.trim();
  const todayStr = getTodayString();
  
  // Find current day item and update values
  const index = appState.history.findIndex(item => item.date === todayStr);
  if (index !== -1) {
    appState.history[index].rating = selectedRating;
    appState.history[index].approved = selectedVerdict;
    appState.history[index].feedback = textFeedback;
    
    // Save to localStorage
    saveHistory();
    appState.todayGeneration = appState.history[index];
    
    // Refresh dashboard layout to reflect finalized review state
    renderDashboard();
    renderGallery();
    showNotification("Review saved. The Prompt engine has successfully ingested your feedback.");
    
    // Reset state values
    selectedRating = 0;
    selectedVerdict = null;
  }
}

// --- PREFERENCES PANEL RENDERER ---
function setupPreferencesTab() {
  // Bind core save actions
  document.getElementById("btn-save-preferences").onclick = savePreferences;
  
  const stylesList = document.getElementById("pref-styles-list");
  stylesList.innerHTML = window.MOCK_STYLES.map(style => `
    <button class="tag-btn ${appState.preferences.activeStyles.includes(style.name) ? 'active' : ''}" data-style="${style.name}">
      ${style.name}
    </button>
  `).join("");
  
  // Tag toggle listeners
  stylesList.querySelectorAll(".tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-style");
      if (appState.preferences.activeStyles.includes(name)) {
        appState.preferences.activeStyles = appState.preferences.activeStyles.filter(s => s !== name);
      } else {
        appState.preferences.activeStyles.push(name);
      }
      btn.classList.toggle("active");
      renderPreferencesPromptPreview();
    });
  });
  
  // Render Palette cards
  const paletteGrid = document.getElementById("pref-palettes-grid");
  paletteGrid.innerHTML = window.MOCK_PALETTES.map(p => `
    <div class="palette-card ${appState.preferences.activePalette === p.name ? 'active' : ''}" data-palette="${p.name}">
      <div class="palette-colors-row">
        ${p.colors.map(col => `<div class="color-bar" style="background:${col}"></div>`).join("")}
      </div>
      <div class="palette-title">${p.name}</div>
    </div>
  `).join("");
  
  paletteGrid.querySelectorAll(".palette-card").forEach(card => {
    card.addEventListener("click", () => {
      paletteGrid.querySelectorAll(".palette-card").forEach(c => c.classList.remove("active"));
      appState.preferences.activePalette = card.getAttribute("data-palette");
      card.classList.add("active");
      renderPreferencesPromptPreview();
    });
  });
  
  // Render prompt theme text value
  document.getElementById("pref-theme-input").value = appState.preferences.theme;
  document.getElementById("pref-theme-input").addEventListener("input", (e) => {
    appState.preferences.theme = e.target.value.trim();
    renderPreferencesPromptPreview();
  });
  
  renderActiveKeywords();
  renderPreferencesPromptPreview();
}

function renderActiveKeywords() {
  const container = document.getElementById("pref-keywords-list");
  container.innerHTML = appState.preferences.tags.map(t => `
    <span class="pill accent">
      ${t}
      <button class="btn-clear-tag" data-tag="${t}" style="background:transparent; border:none; color:inherit; cursor:pointer; font-weight:700; font-size:10px;">✕</button>
    </span>
  `).join("");
  
  container.querySelectorAll(".btn-clear-tag").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-tag");
      appState.preferences.tags = appState.preferences.tags.filter(t => t !== tag);
      renderActiveKeywords();
      renderPreferencesPromptPreview();
    });
  });
}

function addNewTag() {
  const input = document.getElementById("new-tag-input");
  const value = input.value.trim().toLowerCase();
  if (value && !appState.preferences.tags.includes(value)) {
    appState.preferences.tags.push(value);
    input.value = "";
    renderActiveKeywords();
    renderPreferencesPromptPreview();
  }
}

function renderPreferencesPromptPreview() {
  const prompt = constructDailyPrompt();
  document.getElementById("prompt-preview-text").innerText = prompt;
  
  // Render adaptive feedback logs in preferences
  const weightsContainer = document.getElementById("pref-weights-log");
  
  // Gather statistics from history
  const favorites = {};
  appState.history.forEach(item => {
    if (item.rating && item.rating >= 4) {
      favorites[item.style] = (favorites[item.style] || 0) + 1;
    }
  });
  
  const faveKeys = Object.keys(favorites);
  if (faveKeys.length > 0) {
    weightsContainer.innerHTML = `
      <div class="weight-title">Highly Rated Style Multipliers</div>
      <div class="weight-pills">
        ${faveKeys.map(k => `<span class="weight-pill positive">★ ${k} (+${favorites[k]})</span>`).join("")}
      </div>
    `;
  } else {
    weightsContainer.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted)">Prompt adjustments will appear here once you rate images 4★ or 5★.</span>`;
  }
}

function savePreferences() {
  localStorage.setItem("aetheria_prefs", JSON.stringify(appState.preferences));
  showNotification("Preferences updated and saved to client database.");
}

// --- SETTINGS PANEL RENDERER ---
function setupSettingsTab() {
  const s = appState.settings;
  
  document.getElementById("settings-mode-select").value = s.mode;
  document.getElementById("settings-apikey-input").value = s.apiKey;
  document.getElementById("settings-model-input").value = s.model;
  document.getElementById("settings-schedule-time").value = s.scheduleTime;
  document.getElementById("settings-notify-time").value = s.notifyTime;
  
  document.getElementById("settings-tg-bot-token").value = s.telegramBotToken;
  document.getElementById("settings-tg-chat-id").value = s.telegramChatId;
  
  // Toggle inputs visibility depending on mode selection
  toggleApiFormRow(s.mode);
  document.getElementById("settings-mode-select").onchange = (e) => {
    toggleApiFormRow(e.target.value);
  };
  
  document.getElementById("btn-save-settings").onclick = saveSettings;
  document.getElementById("btn-clear-database").onclick = clearAllDatabase;
}

function toggleApiFormRow(mode) {
  const keyRow = document.getElementById("api-key-group");
  const modelRow = document.getElementById("api-model-group");
  const keyLabel = keyRow.querySelector("label");
  
  if (mode === "mock") {
    keyRow.style.display = "none";
    modelRow.style.display = "none";
  } else {
    keyRow.style.display = "flex";
    modelRow.style.display = mode === "huggingface" ? "flex" : "none";
    keyLabel.innerText = mode === "huggingface" ? "Hugging Face User Access Token" : "OpenAI API Key";
  }
}

function saveSettings() {
  appState.settings.mode = document.getElementById("settings-mode-select").value;
  appState.settings.apiKey = document.getElementById("settings-apikey-input").value.trim();
  appState.settings.model = document.getElementById("settings-model-input").value.trim();
  appState.settings.scheduleTime = document.getElementById("settings-schedule-time").value;
  appState.settings.notifyTime = document.getElementById("settings-notify-time").value;
  
  appState.settings.telegramBotToken = document.getElementById("settings-tg-bot-token").value.trim();
  appState.settings.telegramChatId = document.getElementById("settings-tg-chat-id").value.trim();
  
  localStorage.setItem("aetheria_settings", JSON.stringify(appState.settings));
  showNotification("Configuration settings updated.");
  
  // Refresh layout
  renderDashboard();
}

async function clearAllDatabase() {
  if (confirm("Are you sure you want to clear your entire history and settings? This will delete all saved reviews and custom artworks permanently!")) {
    localStorage.clear();
    
    // Clear IndexedDB store
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    
    showNotification("Database reset complete.");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// --- TIMELINE GALLERY PANEL RENDERER ---
function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  const filterVal = document.getElementById("gallery-rating-filter").value;
  
  let items = [...appState.history];
  
  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));
  
  if (filterVal !== "all") {
    const minStars = parseInt(filterVal);
    items = items.filter(item => item.rating >= minStars);
  }
  
  document.getElementById("gallery-rating-filter").onchange = renderGallery;
  
  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color:var(--text-muted)">
        <h3>No items found in timeline matching this filter.</h3>
        <p>Go to your dashboard to generate your daily artwork!</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = items.map(item => {
    const imgUrl = appState.imageUrls[item.id] || item.imagePath;
    let starsHtml = "";
    if (item.rating) {
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<span style="color:${i <= item.rating ? '#ffb800' : 'rgba(255,255,255,0.08)'}">★</span>`;
      }
    } else {
      starsHtml = `<span style="color:var(--accent-cyan); font-weight:700; font-size:0.75rem;">PENDING REVIEW</span>`;
    }
    
    return `
      <div class="gallery-item" data-id="${item.id}">
        <img src="${imgUrl}" class="gallery-thumbnail" alt="${item.title}">
        <div class="gallery-info">
          <div class="gallery-date">${item.dateFormatted}</div>
          <div class="gallery-title">${item.title}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Style: ${item.style}</div>
          <div class="gallery-footer">
            <div class="gallery-rating">${starsHtml}</div>
            <svg fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  // Bind click overlays for detail modals
  grid.querySelectorAll(".gallery-item").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      openGalleryItemModal(id);
    });
  });
}

// --- GALLERY MODAL DISPLAY CONTROLLER ---
function openGalleryItemModal(id) {
  const item = appState.history.find(i => i.id === id);
  if (!item) return;
  
  const modal = document.getElementById("gallery-detail-modal");
  const imgUrl = appState.imageUrls[item.id] || item.imagePath;
  
  let starsHtml = "";
  if (item.rating) {
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<span style="font-size:1.3rem; color:${i <= item.rating ? '#ffb800' : 'rgba(255,255,255,0.08)'}">★</span>`;
    }
  } else {
    starsHtml = `<span style="color:var(--accent-cyan); font-weight:700; font-size:0.8rem;">Unreviewed Generation</span>`;
  }
  
  modal.querySelector(".modal-visual").innerHTML = `
    <img src="${imgUrl}" class="modal-image" alt="${item.title}">
  `;
  
  modal.querySelector(".modal-details").innerHTML = `
    <div class="modal-header-row">
      <div>
        <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:700; text-transform:uppercase;">${item.dateFormatted}</div>
        <h2 class="font-title" style="font-size:1.6rem; font-weight:800; margin-top:0.25rem;">${item.title}</h2>
      </div>
      <button class="modal-close" id="btn-close-modal">✕</button>
    </div>
    
    <div>
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Verdict & Grade</div>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem;">
        ${starsHtml}
      </div>
    </div>
    
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <span class="pill accent">Style: ${item.style}</span>
      <span class="pill">Palette: ${item.palette}</span>
    </div>
    
    <div>
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.35rem;">AI Prompt Formula</div>
      <p class="modal-prompt-box">${item.prompt}</p>
    </div>
    
    <div>
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.35rem;">Review & Notes</div>
      <p style="font-size:0.9rem; font-style:italic; line-height:1.5; color:var(--text-primary); background:rgba(255,255,255,0.02); padding:0.75rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05)">
        "${item.feedback || 'No written notes left on this artwork.'}"
      </p>
    </div>
    
    <div style="display:flex; gap:0.75rem; margin-top:auto; border-top:1px solid rgba(255,255,255,0.05); padding-top:1.25rem;">
      <button class="btn-submit-review" id="btn-modal-download" style="flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        Download High-Res
      </button>
      <button class="btn-choice reject" id="btn-modal-delete" style="flex:none; width:45px; border-radius:12px; height:38px; display:flex; align-items:center; justify-content:center;">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width:18px; height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
      </button>
    </div>
  `;
  
  modal.classList.add("active");
  
  // Bind modal button clicks
  document.getElementById("btn-close-modal").onclick = closeModal;
  document.getElementById("btn-modal-download").onclick = () => downloadImage(item.title, imgUrl);
  
  document.getElementById("btn-modal-delete").onclick = async () => {
    if (confirm("Delete this journal entry permanently?")) {
      // Remove from history
      appState.history = appState.history.filter(i => i.id !== id);
      saveHistory();
      
      // Delete blob if stored in IndexedDB
      await deleteImageBlob(id);
      
      if (appState.todayGeneration && appState.todayGeneration.id === id) {
        appState.todayGeneration = null;
      }
      
      closeModal();
      renderDashboard();
      renderGallery();
      showNotification("Journal entry deleted.");
    }
  };
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function closeModal() {
  const modal = document.getElementById("gallery-detail-modal");
  modal.classList.remove("active");
}

// Download image trigger using standard anchor tags
function downloadImage(title, src) {
  const a = document.createElement("a");
  a.href = src;
  a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
