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

// --- TRANSLATION SYSTEM ---
const TRANSLATIONS = {
  en: {
    logo_subtitle: "AI Daily Art Journal",
    nav_dashboard: "Dashboard",
    nav_preferences: "Preferences",
    nav_timeline: "Timeline",
    nav_settings: "Settings",
    today_title: "Today's Creation",
    trigger_btn: "Trigger Daily Generate",
    create_artwork_btn: "Create Today's Artwork",
    studio_ready_title: "Your Studio is Ready",
    studio_ready_desc: "We'll combine your visual preferences, favorite colors, and historic ratings to design today's custom masterpiece.",
    engine_fault_title: "Render Engine Faulted",
    engine_fault_desc: "We failed to generate today's artwork. Reason:",
    retry_btn: "Retry Rendering",
    config_settings_btn: "Configure Settings",
    journal_review: "Journal Review",
    rate_response: "Rate your response",
    feedback_aesthetics: "Feedback & Aesthetics",
    keep_journal: "Keep in Journal",
    recreate_style: "Recreate Style",
    notes_tomorrow: "Notes for Tomorrow's AI",
    notes_placeholder: "Write feedback (e.g. 'I love the starry textures. Add more trees next time...')",
    save_timeline: "Save to Timeline",
    your_score: "Your Score",
    verdict: "Review Verdict",
    approved_kept: "Approved & Kept",
    desired_revision: "Desired Revision",
    feedback_logs: "Your Feedback Logs",
    note_no_feedback: "No written notes provided.",
    saved_securely: "This journal entry is saved securely. Future generation prompts will automatically weight styling descriptors based on this review.",
    pref_title: "Artistic Persona Preferences",
    base_concept: "Base Creative Concept",
    theme_label: "Central Theme / Subject",
    focus_styles: "Focus Art Styles",
    color_palettes: "Color Palettes (Select Multiple)",
    keyword_tags: "Keyword Tags",
    style_cues: "Inject Style Cues",
    prompt_formula: "Active Prompt Preview Formula",
    style_multipliers: "Highly Rated Style Multipliers",
    style_multipliers_empty: "Prompt adjustments will appear here once you rate images 4★ or 5★.",
    save_pref_btn: "Save Preference Profile",
    archive_title: "Art Journal Archives",
    project_filter: "Project:",
    rating_filter: "Filter Reviews:",
    all_projects: "All Projects",
    show_all_days: "Show All Days",
    excellent_5: "Excellent (5★ only)",
    highly_rated_4: "Highly Rated (4★ and above)",
    approved_3: "Approved Only (3★ and above)",
    pending_review: "PENDING REVIEW",
    unreviewed_gen: "Unreviewed Generation",
    modal_verdict: "Verdict & Grade",
    modal_prompt: "AI Prompt Formula",
    modal_notes: "Review & Notes",
    modal_no_notes: "No written notes left on this artwork.",
    download_hires: "Download High-Res",
    settings_title: "System Configuration & Integrations",
    gen_mode: "AI Image Generation Mode",
    mode_mock: "Offline Mock Mode (No Key / Free Simulation)",
    mode_hf: "Hugging Face Inference API (Free Real-Time Generation)",
    mode_openai: "OpenAI DALL-E 3 API (Paid High-Quality Rendering)",
    auth_token: "API Authentication Token",
    hf_path: "Hugging Face Repository Model Path",
    gen_time: "Daily Generation Time",
    notify_time: "Morning Notify Time",
    tg_push: "Mobile Phone Push Notifications (Telegram Setup)",
    tg_push_desc: "You can push newly generated artworks directly to your Telegram chat each morning. To setup, create a bot via @BotFather and fetch your user Chat ID via @userinfobot.",
    tg_token: "Telegram Bot Token (HTTP API)",
    tg_chat: "Telegram Chat ID",
    cloud_settings: "Cloud Daily Generation Settings",
    cloud_settings_desc: "Select which sub-projects you want to activate for the automated daily cloud generation, then download config.json and commit it to your repository.",
    active_cloud: "Active Cloud Projects",
    github_pat: "GitHub Personal Access Token (PAT) — Optional",
    github_pat_desc: "Enter a token to enable automatic background synchronization. Create a fine-grained token with Contents: Write permissions on your atg_artist repository.",
    download_config_btn: "Download config.json",
    download_config_desc: "Place this file in your project folder to sync with GitHub Actions.",
    save_settings_btn: "Save System Settings",
    reset_data_btn: "Reset App Data",
    sys_lang: "System Language",
    
    // Notification Alerts
    alert_new_day: "A new day has arrived! Click to generate today's artwork.",
    alert_gen_success: "Today's artwork is generated successfully!",
    alert_pref_saved: "Preferences updated and saved to client database.",
    alert_settings_saved: "Configuration settings updated.",
    alert_db_reset: "Database reset complete.",
    alert_entry_deleted: "Journal entry deleted.",
    alert_git_success: "✨ Cloud settings synchronized to GitHub successfully!",
    alert_rate_first: "Please rate the generation first.",
    alert_verdict_first: "Please choose whether you want to Keep or Discard the style.",
    alert_review_saved: "Review saved. The Prompt engine has successfully ingested your feedback.",
    footer_text: "© 2026 Aetheria AI Art Journal. Crafted for visual inspiration. Fully client-side encrypted storage.",
    alert_new_artwork: "A new daily masterpiece has materialized.",
    confirm_delete: "Delete this journal entry permanently?",
    confirm_clear: "Are you sure you want to clear your entire history and settings? This will delete all saved reviews and custom artworks permanently!",
    no_items_found: "No items found in timeline matching this filter.",
    generate_prompt: "Go to your dashboard to generate your daily artwork!",
    alert_config_downloaded: "config.json file downloaded. Put it in your project folder to sync settings!",
    alert_git_connecting: "Connecting to GitHub Cloud Database...",
    alert_git_fail: "GitHub Sync Failed:\nMake sure your token is valid and has Write access to the repository contents.",
    loading_synth: "Synthesizing Prompt...",
    loading_conn: "Connecting to Neural Engine...",
    loading_gen: "Materializing artwork...",
    loading_hf_submit: "Submitting Prompt to Hugging Face...",
    loading_hf_process: "Processing generated tensor...",
    loading_dalle_submit: "Requesting DALL-E 3 Render...",
    loading_dalle_download: "Downloading high-resolution render...",
    generated_on: "Generated on",
    download_image: "Download Image",
    ai_prompt: "AI Prompt",
    style_label: "Style",
    palette_label: "Palette",
    openai_key_label: "OpenAI API Key",
    reference_images_title: "Reference Images",
    add_reference_label: "Add Reference Image (URL or Upload File)",
    ref_url_placeholder: "Paste image URL here...",
    ref_desc_placeholder: "Describe the style cues to reference (e.g., golden hour lighting, clean layout)...",
    upload_btn: "Upload",
    add_image_btn: "Add Image",
    alert_ref_added: "Reference image added successfully!",
    alert_ref_removed: "Reference image removed.",
    alert_enter_ref: "Please provide an image URL or upload a file first.",
    alert_enter_desc: "Please enter a style description for this reference image.",
    poetic_editorial: "Poetic Editorial Photography",
    botanical_growth: "Botanical Growth",
    gift_relationship: "Gift & Relationship",
    time_passage_threshold: "Time, Passage & Threshold",
    sacred_still_life: "Sacred Still Life"
  },
  zh: {
    logo_subtitle: "AI 每日畫廊日誌",
    nav_dashboard: "今日創作",
    nav_preferences: "風格偏好",
    nav_timeline: "時光畫廊",
    nav_settings: "系統設定",
    today_title: "今日創作",
    trigger_btn: "手動觸發生成",
    create_artwork_btn: "創建今日作品",
    studio_ready_title: "您的創作工作室已就緒",
    studio_ready_desc: "我們將結合您的視覺偏好、喜愛顏色和歷史評分，為您設計今天的專屬傑作。",
    engine_fault_title: "渲染引擎發生錯誤",
    engine_fault_desc: "我們未能生成今日的作品。原因：",
    retry_btn: "重新渲染",
    config_settings_btn: "配置系統設定",
    journal_review: "作品評分與回饋",
    rate_response: "為本次作品評分",
    feedback_aesthetics: "外觀與美感回饋",
    keep_journal: "保留至畫廊",
    recreate_style: "調整風格重新生成",
    notes_tomorrow: "給明天 AI 的建議備忘錄",
    notes_placeholder: "請寫下回饋（例如：我喜歡星空的紋理。下次可以多加一些樹，並讓紫色霓虹更加顯眼。）",
    save_timeline: "儲存至畫廊",
    your_score: "您的評分",
    verdict: "評分結論",
    approved_kept: "已批准並保留",
    desired_revision: "期望風格調整",
    feedback_logs: "您的回饋日誌",
    note_no_feedback: "未填寫回饋筆記。",
    saved_securely: "本篇作品已安全儲存。未來的 AI 生成將自動根據此評價調整風格描述的權重。",
    pref_title: "藝術風格偏好設定",
    base_concept: "核心創作概念",
    theme_label: "中心主題 / 畫面主體",
    focus_styles: "專注藝術風格",
    color_palettes: "配色方案 (可複選)",
    keyword_tags: "關鍵字標籤",
    style_cues: "注入風格提示",
    prompt_formula: "當前提示詞公式預覽",
    style_multipliers: "高評分風格加成",
    style_multipliers_empty: "當您為圖片評分 4★ 或 5★ 後，此處將顯示風格權重調整資訊。",
    save_pref_btn: "儲存風格設定",
    archive_title: "藝術畫廊存檔",
    project_filter: "子專案：",
    rating_filter: "評分篩選：",
    all_projects: "所有專案",
    show_all_days: "顯示所有日期",
    excellent_5: "極佳 (僅 5★)",
    highly_rated_4: "高度評價 (4★ 以上)",
    approved_3: "已批准 (3★ 以上)",
    pending_review: "待評分",
    unreviewed_gen: "未評分作品",
    modal_verdict: "評分與結論",
    modal_prompt: "AI 提示詞公式",
    modal_notes: "回饋與筆記",
    modal_no_notes: "此作品未留下任何回饋筆記。",
    download_hires: "下載高解析度",
    settings_title: "系統配置與整合",
    gen_mode: "AI 圖片生成模式",
    mode_mock: "離線測試模式 (免金鑰 / 免費模擬)",
    mode_hf: "Hugging Face 推理 API (免費即時生成)",
    mode_openai: "OpenAI DALL-E 3 API (付費高畫質渲染)",
    auth_token: "API 驗證金鑰",
    hf_path: "Hugging Face 模型路徑",
    gen_time: "每日自動生成時間",
    notify_time: "早晨通知時間",
    tg_push: "手機推播通知 (Telegram 設定)",
    tg_push_desc: "您每天早上可以將新生成的作品直接推播到 Telegram 聊天中。請透過 @BotFather 創建機器人，並透過 @userinfobot 取得您的 Chat ID。",
    tg_token: "Telegram 機器人 Token (HTTP API)",
    tg_chat: "Telegram 聊天 ID",
    cloud_settings: "雲端每日生成設定",
    cloud_settings_desc: "選擇您要為哪些子專案啟用自動生成，下載 config.json 並上傳到您的倉庫中。",
    active_cloud: "啟用的雲端專案",
    github_pat: "GitHub 個人存取權杖 (PAT) — 選填",
    github_pat_desc: "輸入 Token 以啟用自動背景同步。請在您的 atg_artist 倉庫中產生具備 Contents: Write 權限的 Token。",
    download_config_btn: "下載 config.json",
    download_config_desc: "將此檔案放入您的專案資料夾以同步設定。",
    save_settings_btn: "儲存系統設定",
    reset_data_btn: "重置應用程式資料",
    sys_lang: "系統語言",
    
    // Notification Alerts
    alert_new_day: "新的一天已到來！點擊生成今日的作品。",
    alert_gen_success: "今日作品已成功生成！",
    alert_pref_saved: "偏好設定已更新並儲存至本機資料庫。",
    alert_settings_saved: "配置設定已成功更新。",
    alert_db_reset: "資料庫重置完成。",
    alert_entry_deleted: "畫廊作品已成功刪除。",
    alert_git_success: "✨ 雲端設定已成功同步至 GitHub！",
    alert_rate_first: "請先為本次生成進行評分。",
    alert_verdict_first: "請選擇您要保留還是重新設計風格。",
    alert_review_saved: "回饋已儲存。提示詞引擎已成功導入您的評價回饋。",
    footer_text: "© 2026 Aetheria AI 藝術日誌。為視覺靈感而生。完全客戶端加密儲存。",
    alert_new_artwork: "一個新的每日傑作已經具現化。",
    confirm_delete: "確定要永久刪除此畫廊作品嗎？",
    confirm_clear: "您確定要清除所有歷史記錄和設定嗎？這將永久刪除所有已儲存的評價和自訂作品！",
    no_items_found: "找不到符合篩選條件的畫廊作品。",
    generate_prompt: "請至今日創作頁面手動觸發生成您的每日作品！",
    alert_config_downloaded: "config.json 檔案已下載。請放入您的專案資料夾以同步設定！",
    alert_git_connecting: "正在連接至 GitHub 雲端資料庫...",
    alert_git_fail: "GitHub 同步失敗：\n請確保您的 Token 有效且具有寫入該倉庫的權限。",
    loading_synth: "正在合成提示詞...",
    loading_conn: "正在連接至神經渲染引擎...",
    loading_gen: "正在具現化藝術作品...",
    loading_hf_submit: "正在提交提示詞至 Hugging Face...",
    loading_hf_process: "正在處理生成的張量數據...",
    loading_dalle_submit: "正在請求 DALL-E 3 渲染...",
    loading_dalle_download: "正在下載高解析度渲染作品...",
    generated_on: "生成於",
    download_image: "下載圖片",
    ai_prompt: "AI 提示詞",
    style_label: "風格",
    palette_label: "配色",
    openai_key_label: "OpenAI API 金鑰 (Key)",
    reference_images_title: "參考範例圖",
    add_reference_label: "新增參考圖 (貼上網址或上傳本機圖檔)",
    ref_url_placeholder: "貼上圖片網址...",
    ref_desc_placeholder: "描述想要參考的風格特徵 (例如：黃昏光影、乾淨排版)...",
    upload_btn: "上傳圖檔",
    add_image_btn: "新增圖片",
    alert_ref_added: "參考圖片已成功新增！",
    alert_ref_removed: "參考圖片已移除。",
    alert_enter_ref: "請先輸入圖片網址或上傳檔案。",
    alert_enter_desc: "請輸入此參考圖的風格特徵描述。",
    poetic_editorial: "詩意雜誌風攝影",
    botanical_growth: "植物生長",
    gift_relationship: "禮物與關係",
    time_passage_threshold: "時間、流逝與門檻",
    sacred_still_life: "神聖靜物"
  }
};

const t = (key) => {
  const lang = appState.settings.language || "en";
  return TRANSLATIONS[lang][key] || TRANSLATIONS["en"][key] || key;
};

function applyLanguage() {
  const lang = appState.settings.language || "en";
  
  // 1. Text translations
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });
  
  // 2. Input placeholder translations
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      el.placeholder = TRANSLATIONS[lang][key];
    }
  });
}

// --- STATE MANAGEMENT ---
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
    tags: ["high resolution", "image-only", "no text", "no typography", "no letters", "no captions", "minimalist editorial photography", "poetic photography", "quiet composition", "magazine layout", "refined print atmosphere", "ivory negative space", "subtle paper grain", "soft natural light", "muted earth tones", "contemplative mood", "literary atmosphere", "spiritual calm"],
    excludedTags: ["text", "words", "letters", "signatures", "watermarks", "deformed", "bad composition"],
    referenceImages: []
  },
  botanical_growth: {
    theme: "An image-only poetic botanical photograph symbolizing growth, quiet resilience, renewal, and spiritual life. No text, no typography, no letters, no captions. Feature natural subjects such as moss, sprouts, leaves, roots, bark, small flowers, soil, stones, or plants emerging from unexpected places. The mood should feel gentle, hopeful, grounded, and contemplative.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Earth / Forest", "Warm Paper / Forest Green", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "botanical photography", "symbolic nature", "moss green", "forest green", "sprout", "leaves", "bark", "roots", "soil", "stone", "quiet growth", "resilience", "renewal", "hope", "spiritual mood", "soft morning light", "diffused natural light", "macro detail", "shallow depth of field", "matte paper texture", "refined print texture", "muted earth tones"],
    excludedTags: ["text", "words", "letters", "signatures", "watermarks", "deformed", "bad composition"],
    referenceImages: []
  },
  gift_relationship: {
    theme: "A poetic image-only lifestyle still-life photograph symbolizing gift, exchange, companionship, and human connection. No text, no typography, no letters, no captions. Feature objects such as wrapped gifts, ribbons, hands preparing something, two cups, shared table scenes, paired objects, flowers, envelopes, cloth, or a quiet dining table. The image should feel warm, thoughtful, and refined.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Japanese Magazine Layout", "Matte Paper Print"],
    activePalettes: ["Warm Paper / Forest Green", "Soft Natural Editorial", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "poetic still life", "lifestyle photography", "wrapped gift", "ribbon", "shared table", "two cups", "paired objects", "hands preparing", "quiet relationship", "companionship", "exchange", "gift", "care", "warm natural light", "soft shadows", "linen texture", "paper texture", "refined print atmosphere", "muted warm tones", "literary mood", "spiritual calm"],
    excludedTags: ["text", "words", "letters", "signatures", "watermarks", "deformed", "bad composition"],
    referenceImages: []
  },
  time_passage_threshold: {
    theme: "An image-only poetic editorial photograph symbolizing time, passage, waiting, threshold, transition, and spiritual reflection. No text, no typography, no letters, no captions. Feature symbolic scenes such as clocks, doors, corridors, windows, paths, empty chairs, shadows on a wall, a quiet street, a doorway, or a passage of light. The mood should be calm, serious, contemplative, and emotionally resonant.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Japanese Magazine Layout", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Monochrome / Dark", "Matte Cream / Ink Gray", "Ivory Paper / Muted Earth"],
    tags: ["high resolution", "image-only", "no text", "symbolic photography", "time", "passage", "threshold", "waiting", "doorway", "corridor", "window light", "clock", "empty chair", "quiet path", "soft shadow", "contemplative atmosphere", "spiritual reflection", "muted gray tones", "warm ivory paper", "cinematic stillness", "refined editorial photography", "matte paper texture", "subtle grain", "poetic silence"],
    excludedTags: ["text", "words", "letters", "signatures", "watermarks", "deformed", "bad composition"],
    referenceImages: []
  },
  sacred_still_life: {
    theme: "A quiet image-only poetic still-life photograph with a sacred devotional mood. No text, no typography, no letters, no captions. Use simple symbolic objects such as a candle, cup, bowl, key, open notebook without readable writing, folded cloth, bread, lamp, stone, water, wooden table, or ceramic object. The image should feel peaceful, reverent, intimate, and suitable for spiritual reflection.",
    activeStyles: ["Minimalist Editorial Photography", "Poetic Photo Essay", "Matte Paper Print", "Minimalist Ink"],
    activePalettes: ["Ivory Paper / Muted Earth", "Soft Natural Editorial", "Warm Paper / Forest Green", "Matte Cream / Ink Gray"],
    tags: ["high resolution", "image-only", "no text", "sacred still life", "devotional mood", "quiet object", "candle", "cup", "bowl", "key", "folded cloth", "bread", "ceramic", "wooden table", "soft window light", "gentle shadow", "reverent atmosphere", "spiritual calm", "poetic stillness", "minimalist composition", "tactile paper grain", "matte print texture", "muted earth tones", "warm neutral background", "refined editorial photography"],
    excludedTags: ["text", "words", "letters", "signatures", "watermarks", "deformed", "bad composition"],
    referenceImages: []
  }
};

const DEFAULT_SETTINGS = {
  mode: "mock", // "mock" | "huggingface" | "openai"
  apiKey: "",
  model: "black-forest-labs/FLUX.1-schnell",
  scheduleTime: "02:00",
  notifyTime: "08:00",
  telegramBotToken: "",
  telegramChatId: "",
  activeProjects: ["poetic_editorial", "botanical_growth", "gift_relationship", "time_passage_threshold", "sacred_still_life"],
  githubPat: "",
  language: "en"
};

let appState = {
  activeProject: "poetic_editorial",
  projectPrefs: { ...DEFAULT_PROJECT_PREFS },
  settings: { ...DEFAULT_SETTINGS },
  get preferences() {
    return this.projectPrefs[this.activeProject];
  },
  history: [], // Metadata stored in localStorage
  activeTab: "dashboard",
  todayGeneration: null, // Today's generation metadata for active project
  imageUrls: {}, // Cache of objectUrls mapped from IndexedDB blobs
  refImageUrls: {} // Cache of objectUrls mapped from IndexedDB reference images
};

// --- INITIALIZE APP ---
document.addEventListener("DOMContentLoaded", async () => {
  loadDataFromStorage();
  await loadHistoryBlobs();
  await syncSettingsFromConfigJson();
  applyLanguage();
  setupNavigation();
  populateProjectSelectors();
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
  
  // Reference images buttons
  document.getElementById("btn-ref-image-upload").addEventListener("click", () => {
    document.getElementById("ref-image-file-input").click();
  });
  document.getElementById("ref-image-file-input").addEventListener("change", handleRefImageUpload);
  document.getElementById("btn-add-ref-image").addEventListener("click", handleAddReferenceImage);
});

// Helper to populate sub-project select boxes across the app
function populateProjectSelectors() {
  const dashSelect = document.getElementById("dashboard-project-select");
  const prefSelect = document.getElementById("preferences-project-select");
  const galleryFilter = document.getElementById("gallery-project-filter");
  
  const optionsHtml = SUB_PROJECTS.map(p => `<option value="${p.id}">${t(p.id)}</option>`).join("");
  
  dashSelect.innerHTML = optionsHtml;
  prefSelect.innerHTML = optionsHtml;
  galleryFilter.innerHTML = `<option value="all">${t("all_projects")}</option>` + optionsHtml;
  
  // Set default values
  dashSelect.value = appState.activeProject;
  prefSelect.value = appState.activeProject;
  
  // Bind change events
  dashSelect.onchange = (e) => {
    appState.activeProject = e.target.value;
    prefSelect.value = e.target.value;
    localStorage.setItem("aetheria_active_project", appState.activeProject);
    
    // Refresh today's generation metadata
    updateTodayGenerationRef();
    renderDashboard();
  };
  
  prefSelect.onchange = (e) => {
    appState.activeProject = e.target.value;
    dashSelect.value = e.target.value;
    localStorage.setItem("aetheria_active_project", appState.activeProject);
    
    // Refresh preferences UI inputs
    setupPreferencesTab();
    
    // Refresh today's generation metadata
    updateTodayGenerationRef();
    renderDashboard();
  };
  
  galleryFilter.onchange = () => {
    renderGallery();
  };
}

function updateTodayGenerationRef() {
  const todayStr = getTodayString();
  appState.todayGeneration = appState.history.find(item => item.date === todayStr && item.project === appState.activeProject) || null;
}

// Load preferences, settings, and metadata list from localStorage
function loadDataFromStorage() {
  const savedActiveProject = localStorage.getItem("aetheria_active_project");
  const subProjIds = SUB_PROJECTS.map(p => p.id);
  
  if (savedActiveProject && subProjIds.includes(savedActiveProject)) {
    appState.activeProject = savedActiveProject;
  } else {
    appState.activeProject = SUB_PROJECTS[0].id;
  }

  const savedProjectPrefs = localStorage.getItem("aetheria_project_prefs");
  if (savedProjectPrefs) {
    try {
      const parsedPrefs = JSON.parse(savedProjectPrefs);
      appState.projectPrefs = {};
      SUB_PROJECTS.forEach(p => {
        if (parsedPrefs[p.id]) {
          appState.projectPrefs[p.id] = parsedPrefs[p.id];
        } else {
          appState.projectPrefs[p.id] = { ...DEFAULT_PROJECT_PREFS[p.id] };
        }
      });
    } catch (e) {
      console.error("Failed to parse project preferences", e);
      appState.projectPrefs = { ...DEFAULT_PROJECT_PREFS };
    }
    
    // Initialize referenceImages array and activePalettes if missing (migration)
    for (const projId in appState.projectPrefs) {
      if (!appState.projectPrefs[projId].referenceImages) {
        appState.projectPrefs[projId].referenceImages = [];
      }
      if (!appState.projectPrefs[projId].activePalettes) {
        if (appState.projectPrefs[projId].activePalette) {
          appState.projectPrefs[projId].activePalettes = [appState.projectPrefs[projId].activePalette];
          delete appState.projectPrefs[projId].activePalette;
        } else {
          appState.projectPrefs[projId].activePalettes = [DEFAULT_PROJECT_PREFS[projId].activePalettes[0]];
        }
      }
    }
  } else {
    appState.projectPrefs = { ...DEFAULT_PROJECT_PREFS };
  }

  const savedSettings = localStorage.getItem("aetheria_settings");
  if (savedSettings) {
    try {
      appState.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      // Filter active projects to only contain existing sub-project IDs
      appState.settings.activeProjects = appState.settings.activeProjects.filter(id => subProjIds.includes(id));
      if (appState.settings.activeProjects.length === 0) {
        appState.settings.activeProjects = [SUB_PROJECTS[0].id];
      }
    } catch (e) {
      appState.settings = { ...DEFAULT_SETTINGS };
    }
  } else {
    appState.settings = { ...DEFAULT_SETTINGS };
  }

  const savedHistory = localStorage.getItem("aetheria_history");
  if (savedHistory) {
    try {
      appState.history = JSON.parse(savedHistory);
      // Merge items from window.MOCK_DATA that are not present in localStorage history
      let mergedCount = 0;
      window.MOCK_DATA.forEach(mockItem => {
        const exists = appState.history.some(h => h.id === mockItem.id);
        if (!exists) {
          appState.history.push(mockItem);
          mergedCount++;
        }
      });
      if (mergedCount > 0) {
        appState.history.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem("aetheria_history", JSON.stringify(appState.history));
        console.log(`Merged ${mergedCount} new cloud-generated artworks from mock-data.js.`);
      }
    } catch (e) {
      console.error("Error parsing history from storage, resetting to mock data.", e);
      appState.history = [...window.MOCK_DATA];
    }
  } else {
    appState.history = [...window.MOCK_DATA];
    localStorage.setItem("aetheria_history", JSON.stringify(appState.history));
  }
  
  // Backwards compatibility migration: ensure all items have a project key
  appState.history.forEach(item => {
    if (!item.project) {
      item.project = "poetic_editorial";
    }
  });
  
  updateTodayGenerationRef();
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

function saveOrUpdateHistory(newGen) {
  const existingIndex = appState.history.findIndex(item => item.id === newGen.id);
  if (existingIndex !== -1) {
    appState.history[existingIndex] = newGen;
  } else {
    appState.history.unshift(newGen);
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
  const history = appState.history.filter(item => item.project === appState.activeProject);
  
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
    
  const chosenPalette = prefs.activePalettes && prefs.activePalettes.length > 0 
    ? prefs.activePalettes[Math.floor(Math.random() * prefs.activePalettes.length)] 
    : "Vibrant Colors";
  
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
  
  // Reference images style descriptors
  if (prefs.referenceImages && prefs.referenceImages.length > 0) {
    const refDescs = prefs.referenceImages.map(img => img.description).filter(Boolean);
    if (refDescs.length > 0) {
      promptParts.push(`referencing style elements of ${refDescs.join(", ")}`);
    }
  }
  
  // Concat and clean
  return promptParts.join(", ").replace(/\s+/g, ' ').trim();
}

// --- AUTOMATED ON-DEMAND SCHEDULER ---
function checkDailySchedule() {
  const todayStr = getTodayString();
  const alreadyGenerated = appState.history.some(item => item.date === todayStr && item.project === appState.activeProject);
  
  if (!alreadyGenerated) {
    // Trigger desktop notification banner
    setTimeout(() => {
      showNotification(t("alert_new_day"));
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
          <h3>${t("studio_ready_title")}</h3>
          <p>${t("studio_ready_desc")}</p>
          <button class="btn-primary" id="btn-generate-today-inner">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.547 9.34 4.5 10.561 4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ${t("create_artwork_btn")}
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
              <p>${t("generated_on")} ${item.dateFormatted}</p>
            </div>
            <div class="overlay-actions">
              <button class="btn-utility" id="btn-download-today" title="${t("download_image")}">
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
            <strong>${t("ai_prompt")}:</strong> ${item.prompt}
          </p>
        </div>
      </div>
    </div>
    
    <div class="glass-card">
      <div class="panel-header">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.15-.426.837-.426.98 0l2.302 6.565a.478.478 0 00.454.325l6.908.575c.445.037.623.585.292.89l-5.08 4.675a.478.478 0 00-.144.444l1.378 6.78a.497.497 0 01-.734.534l-6.096-3.754a.478.478 0 00-.532 0l-6.096 3.754a.497.497 0 01-.734-.534l1.378-6.78a.478.478 0 00-.144-.444L2.83 12.518c-.33-.305-.152-.853.292-.89l6.908-.575a.478.478 0 00.454-.325l2.302-6.565z" /></svg>
        <h2>${t("journal_review")}</h2>
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
      <label>${t("rate_response")}</label>
      <div class="stars-container" id="stars-row">
        <button class="star-btn" data-star="1">★</button>
        <button class="star-btn" data-star="2">★</button>
        <button class="star-btn" data-star="3">★</button>
        <button class="star-btn" data-star="4">★</button>
        <button class="star-btn" data-star="5">★</button>
      </div>
    </div>
    
    <div class="review-row">
      <label>${t("feedback_aesthetics")}</label>
      <div class="binary-choice">
        <button class="btn-choice approve" id="btn-choice-keep">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          ${t("keep_journal")}
        </button>
        <button class="btn-choice reject" id="btn-choice-discard">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ${t("recreate_style")}
        </button>
      </div>
    </div>
    
    <div class="review-row">
      <label>${t("notes_tomorrow")}</label>
      <textarea class="textarea-styled" id="review-feedback-text" placeholder="${t("notes_placeholder")}"></textarea>
    </div>
    
    <button class="btn-submit-review" id="btn-submit-review">${t("save_timeline")}</button>
  `;
}

function renderAlreadyReviewedState(item) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span style="font-size: 1.5rem; color: ${i <= item.rating ? '#ffb800' : 'rgba(255,255,255,0.08)'}">★</span>`;
  }
  return `
    <div class="review-row">
      <label>${t("your_score")}</label>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
        ${starsHtml}
        <span style="font-weight:700; color:#ffb800; font-size:1.1rem; margin-left:0.25rem;">${item.rating} / 5</span>
      </div>
    </div>
    
    <div class="review-row">
      <label>${t("verdict")}</label>
      <div style="margin-top:0.25rem;">
        ${item.approved 
          ? `<span class="pill accent" style="background:rgba(16,172,132,0.15); border-color:rgba(16,172,132,0.3); color:#10ac84; padding:0.5rem 1rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ${t("approved_kept")}</span>` 
          : `<span class="pill accent" style="background:rgba(255,107,107,0.15); border-color:rgba(255,107,107,0.3); color:#ff6b6b; padding:0.5rem 1rem;"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px; height:14px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> ${t("desired_revision")}</span>`
        }
      </div>
    </div>
    
    <div class="review-row">
      <label>${t("feedback_logs")}</label>
      <p style="font-size:0.95rem; font-style:italic; line-height:1.6; color:var(--text-primary); background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
        "${item.feedback || t("note_no_feedback")}"
      </p>
    </div>
    
    <div style="border-top:1px dashed rgba(255,255,255,0.05); padding-top:1.5rem; margin-top:0.5rem; text-align:center;">
      <p style="font-size:0.8rem; color:var(--text-muted);">${t("saved_securely")}</p>
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
        <p class="loading-text" id="loading-step-text">${t("loading_synth")}</p>
      </div>
    </div>
  `;

  const todayStr = getTodayString();
  const dateFormatted = getFormattedDate(todayStr);
  const prompt = constructDailyPrompt();
  
  const stepText = document.getElementById("loading-step-text");
  
  try {
    // Stage 1: Call generation
    stepText.innerText = t("loading_conn");
    
    let imageBlob;
    let title = "Daily Dream " + todayStr.replace(/-/g, "/");
    let chosenStyle = appState.preferences.activeStyles[0] || "Digital Art";
    let chosenPalette = appState.preferences.activePalettes && appState.preferences.activePalettes.length > 0
      ? appState.preferences.activePalettes[Math.floor(Math.random() * appState.preferences.activePalettes.length)]
      : "Vibrant Colors";
    
    if (appState.settings.mode === "mock") {
      // Simulation mode
      await sleep(2000);
      stepText.innerText = t("loading_gen");
      await sleep(1500);
      
      // Select mock details matching the active project
      let selectedPreset;
      if (appState.activeProject === "ui_ux") {
        selectedPreset = { path: "assets/mock_ui_ux.png", style: "Line Art Illustration", title: "Smart Dashboard Mockup" };
      } else if (appState.activeProject === "line_sticker") {
        selectedPreset = { path: "assets/mock_line_sticker.png", style: "Studio Ghibli", title: "Happy Chibi Panda" };
      } else if (appState.activeProject === "aesthetic_landscape") {
        selectedPreset = { path: "assets/ghibli_countryside.png", style: "Oil Impressionism", title: "Nostalgic Meadows" };
      } else if (appState.activeProject === "quote_card_background") {
        selectedPreset = { path: "assets/quote_card_bg.png", style: "Cyberpunk Watercolor", title: "Abstract Pastel Canvas" };
      } else { // abstract_illustration
        selectedPreset = { path: "assets/cosmic_surrealism.png", style: "Cosmic Surrealism", title: "Astral Portal Canopy" };
      }
      
      const newGen = {
        id: `gen-${appState.activeProject}-${todayStr}`,
        project: appState.activeProject,
        date: todayStr,
        title: selectedPreset.title,
        prompt: prompt,
        imagePath: selectedPreset.path,
        style: selectedPreset.style,
        palette: chosenPalette,
        dateFormatted: dateFormatted
      };
      
      saveOrUpdateHistory(newGen);
      appState.imageUrls[newGen.id] = selectedPreset.path;
      appState.todayGeneration = newGen;
      
    } else if (appState.settings.mode === "huggingface") {
      // Hugging Face API call
      if (!appState.settings.apiKey) {
        throw new Error("Missing Hugging Face API Key in Settings!");
      }
      
      await sleep(1000);
      stepText.innerText = t("loading_hf_submit");
      
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
      
      stepText.innerText = t("loading_hf_process");
      imageBlob = await response.blob();
      
      // Save heavy blob into IndexedDB
      const id = `gen-${appState.activeProject}-${todayStr}`;
      await saveImageBlob(id, imageBlob);
      
      // Cache URL
      const objectUrl = URL.createObjectURL(imageBlob);
      appState.imageUrls[id] = objectUrl;
      
      const newGen = {
        id: id,
        project: appState.activeProject,
        date: todayStr,
        title: "Ethereal Concept " + todayStr.split('-').slice(1).join('/'),
        prompt: prompt,
        imagePath: `indexeddb://${id}`, // Flag pointing to IndexedDB storage
        style: chosenStyle,
        palette: chosenPalette,
        dateFormatted: dateFormatted
      };
      
      saveOrUpdateHistory(newGen);
      appState.todayGeneration = newGen;
      
    } else if (appState.settings.mode === "openai") {
      // OpenAI DALL-E 3 API Call
      if (!appState.settings.apiKey) {
        throw new Error("Missing OpenAI API Key in Settings!");
      }
      
      await sleep(1000);
      stepText.innerText = t("loading_dalle_submit");
      
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
      
      stepText.innerText = t("loading_dalle_download");
      const resData = await response.json();
      const imageUrl = resData.data[0].url;
      
      // Fetch the actual image blob so it's cached offline in IndexedDB
      const imageFetch = await fetch(imageUrl);
      imageBlob = await imageFetch.blob();
      
      const id = `gen-${appState.activeProject}-${todayStr}`;
      await saveImageBlob(id, imageBlob);
      
      const objectUrl = URL.createObjectURL(imageBlob);
      appState.imageUrls[id] = objectUrl;
      
      const newGen = {
        id: id,
        project: appState.activeProject,
        date: todayStr,
        title: "DALL-E Conceptual Art",
        prompt: prompt,
        imagePath: `indexeddb://${id}`,
        style: chosenStyle,
        palette: chosenPalette,
        dateFormatted: dateFormatted
      };
      
      saveOrUpdateHistory(newGen);
      appState.todayGeneration = newGen;
    }
    
    // Save state
    saveHistory();
    
    // Trigger notification push if Vercel configured
    await triggerMobileNotificationPush(appState.todayGeneration);
    
    // Complete
    renderDashboard();
    renderGallery();
    showNotification(t("alert_gen_success"));
    
  } catch (error) {
    console.error("Generation failed:", error);
    container.innerHTML = `
      <div class="glass-card" style="grid-column: span 2; padding: 3rem 2rem; border-color:#ff6b6b">
        <div class="generator-placeholder" style="color:#ff6b6b">
          <div class="generator-placeholder-icon" style="background:rgba(255,107,107,0.1); color:#ff6b6b; box-shadow:none;">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h3 style="color:#ff6b6b">${t("engine_fault_title")}</h3>
          <p style="color:var(--text-muted)">${t("engine_fault_desc")} <strong>${error.message}</strong></p>
          <div style="display:flex; gap:1rem;">
            <button class="btn-primary" id="btn-retry-generation">${t("retry_btn")}</button>
            <button class="btn-choice" id="btn-settings-page" style="flex:none; padding: 0.9rem 1.5rem;">${t("config_settings_btn")}</button>
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
    alert(t("alert_rate_first"));
    return;
  }
  
  if (selectedVerdict === null) {
    alert(t("alert_verdict_first"));
    return;
  }
  
  const textFeedback = document.getElementById("review-feedback-text").value.trim();
  const todayStr = getTodayString();
  
  // Find current day item and update values
  const index = appState.history.findIndex(item => item.date === todayStr && item.project === appState.activeProject);
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
    showNotification(t("alert_review_saved"));
    
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
    <div class="palette-card ${appState.preferences.activePalettes.includes(p.name) ? 'active' : ''}" data-palette="${p.name}">
      <div class="palette-colors-row">
        ${p.colors.map(col => `<div class="color-bar" style="background:${col}"></div>`).join("")}
      </div>
      <div class="palette-title">${p.name}</div>
    </div>
  `).join("");
  
  paletteGrid.querySelectorAll(".palette-card").forEach(card => {
    card.addEventListener("click", () => {
      const name = card.getAttribute("data-palette");
      if (appState.preferences.activePalettes.includes(name)) {
        if (appState.preferences.activePalettes.length > 1) {
          appState.preferences.activePalettes = appState.preferences.activePalettes.filter(p => p !== name);
          card.classList.remove("active");
        } else {
          showNotification(appState.settings.language === "zh" ? "請至少保留一個選中的配色方案。" : "Please keep at least one selected color palette.");
        }
      } else {
        appState.preferences.activePalettes.push(name);
        card.classList.add("active");
      }
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
  renderReferenceImages();
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

async function renderReferenceImages() {
  const container = document.getElementById("pref-reference-images-list");
  if (!container) return;
  
  const prefs = appState.preferences;
  if (!prefs.referenceImages) prefs.referenceImages = [];
  
  // Clean up old object URLs from cache
  Object.values(appState.refImageUrls).forEach(url => URL.revokeObjectURL(url));
  appState.refImageUrls = {};
  
  // Render cards
  const cardsHtmlPromises = prefs.referenceImages.map(async img => {
    let src = "";
    if (img.url) {
      src = img.url;
    } else if (img.id) {
      // It is local, loaded from IndexedDB
      const blobUrl = await getImageBlobUrl(img.id);
      if (blobUrl) {
        appState.refImageUrls[img.id] = blobUrl;
        src = blobUrl;
      } else {
        src = "assets/cosmic_surrealism.png"; // Fallback if blob missing
      }
    }
    
    return `
      <div class="reference-image-card" data-ref-id="${img.id}">
        <img src="${src}" class="reference-image-thumb" alt="Reference Image">
        <div class="reference-image-desc" title="${img.description}">${img.description}</div>
        <button type="button" class="reference-image-delete" data-id="${img.id}">✕</button>
      </div>
    `;
  });
  
  const cardsHtmlArray = await Promise.all(cardsHtmlPromises);
  container.innerHTML = cardsHtmlArray.join("");
  
  // Bind delete actions
  container.querySelectorAll(".reference-image-delete").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      
      // Delete from preferences array
      prefs.referenceImages = prefs.referenceImages.filter(img => img.id !== id);
      
      // Delete blob if in IndexedDB
      if (id.startsWith("ref-img-")) {
        await deleteImageBlob(id);
      }
      
      showNotification(t("alert_ref_removed"));
      
      // Re-render and preview prompt update
      renderReferenceImages();
      renderPreferencesPromptPreview();
    };
  });
}

// Handle pasting an image URL and a description
async function handleAddReferenceImage() {
  const urlInput = document.getElementById("ref-image-url-input");
  const descInput = document.getElementById("ref-image-desc-input");
  
  const url = urlInput.value.trim();
  const desc = descInput.value.trim();
  
  if (!url) {
    alert(t("alert_enter_ref"));
    return;
  }
  if (!desc) {
    alert(t("alert_enter_desc"));
    return;
  }
  
  const newRef = {
    id: `ref-url-${Date.now()}`,
    url: url,
    description: desc
  };
  
  if (!appState.preferences.referenceImages) {
    appState.preferences.referenceImages = [];
  }
  
  appState.preferences.referenceImages.push(newRef);
  
  // Reset fields
  urlInput.value = "";
  descInput.value = "";
  
  showNotification(t("alert_ref_added"));
  renderReferenceImages();
  renderPreferencesPromptPreview();
}

// Handle uploading a local reference file
async function handleRefImageUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  const descInput = document.getElementById("ref-image-desc-input");
  const baseDesc = descInput.value.trim();
  
  let successCount = 0;
  for (const file of files) {
    // Default description to filename (without extension) if none entered
    const desc = baseDesc || file.name.split('.').slice(0, -1).join('.') || "Reference Image";
    const randSuffix = Math.random().toString(36).substring(2, 7);
    const id = `ref-img-${appState.activeProject}-${Date.now()}-${randSuffix}`;
    
    try {
      await saveImageBlob(id, file);
      const newRef = {
        id: id,
        description: desc
      };
      
      if (!appState.preferences.referenceImages) {
        appState.preferences.referenceImages = [];
      }
      appState.preferences.referenceImages.push(newRef);
      successCount++;
    } catch (err) {
      console.error(`Failed to save reference image ${file.name}:`, err);
    }
  }
  
  // Reset fields
  e.target.value = "";
  descInput.value = "";
  
  if (successCount > 0) {
    showNotification(t("alert_ref_added"));
    renderReferenceImages();
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
  appState.history.filter(item => item.project === appState.activeProject).forEach(item => {
    if (item.rating && item.rating >= 4) {
      favorites[item.style] = (favorites[item.style] || 0) + 1;
    }
  });
  
  const faveKeys = Object.keys(favorites);
  if (faveKeys.length > 0) {
    weightsContainer.innerHTML = `
      <div class="weight-title">${t("style_multipliers")}</div>
      <div class="weight-pills">
        ${faveKeys.map(k => `<span class="weight-pill positive">★ ${k} (+${favorites[k]})</span>`).join("")}
      </div>
    `;
  } else {
    weightsContainer.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted)">${t("style_multipliers_empty")}</span>`;
  }
}

function savePreferences() {
  localStorage.setItem("aetheria_project_prefs", JSON.stringify(appState.projectPrefs));
  showNotification(t("alert_pref_saved"));
  
  if (appState.settings.githubPat) {
    syncConfigToGitHub();
  }
}

// --- SETTINGS PANEL RENDERER ---
function setupSettingsTab() {
  const s = appState.settings;
  
  document.getElementById("settings-language-select").value = s.language || "en";
  document.getElementById("settings-mode-select").value = s.mode;
  document.getElementById("settings-apikey-input").value = s.apiKey;
  document.getElementById("settings-model-input").value = s.model;
  document.getElementById("settings-schedule-time").value = s.scheduleTime;
  document.getElementById("settings-notify-time").value = s.notifyTime;
  
  document.getElementById("settings-tg-bot-token").value = s.telegramBotToken;
  document.getElementById("settings-tg-chat-id").value = s.telegramChatId;
  document.getElementById("settings-github-pat").value = s.githubPat || "";
  
  // Populate Active Projects checkboxes
  const checkboxesContainer = document.getElementById("settings-active-projects-checkboxes");
  checkboxesContainer.innerHTML = SUB_PROJECTS.map(proj => {
    const isActive = s.activeProjects.includes(proj.id);
    return `
      <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.9rem;">
        <input type="checkbox" value="${proj.id}" class="settings-proj-checkbox" ${isActive ? 'checked' : ''}>
        ${t(proj.id)}
      </label>
    `;
  }).join("");
  
  // Toggle inputs visibility depending on mode selection
  toggleApiFormRow(s.mode);
  document.getElementById("settings-mode-select").onchange = (e) => {
    toggleApiFormRow(e.target.value);
  };
  
  document.getElementById("btn-download-config").onclick = downloadConfigFile;
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
    keyLabel.innerText = mode === "huggingface" ? t("hf_token_label") : t("openai_key_label");
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
  
  // Extract checkboxes
  const checkedBoxes = document.querySelectorAll(".settings-proj-checkbox:checked");
  appState.settings.activeProjects = Array.from(checkedBoxes).map(cb => cb.value);
  appState.settings.githubPat = document.getElementById("settings-github-pat").value.trim();
  appState.settings.language = document.getElementById("settings-language-select").value;
  
  localStorage.setItem("aetheria_settings", JSON.stringify(appState.settings));
  
  // Apply language translations immediately
  applyLanguage();
  showNotification(t("alert_settings_saved"));
  
  // Trigger background sync if GitHub Token is provided
  if (appState.settings.githubPat) {
    syncConfigToGitHub();
  }
  
  // Refresh layouts in new language
  populateProjectSelectors();
  setupPreferencesTab();
  renderDashboard();
  renderGallery();
}

async function clearAllDatabase() {
  if (confirm(t("confirm_clear"))) {
    localStorage.clear();
    
    // Clear IndexedDB store
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    
    showNotification(t("alert_db_reset"));
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// --- TIMELINE GALLERY PANEL RENDERER ---
function renderGallery() {
  const grid = document.getElementById("gallery-grid");
  const filterVal = document.getElementById("gallery-rating-filter").value;
  const projectFilter = document.getElementById("gallery-project-filter").value;
  
  let items = [...appState.history];
  
  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));
  
  // Filter by rating
  if (filterVal !== "all") {
    const minStars = parseInt(filterVal);
    items = items.filter(item => item.rating >= minStars);
  }
  
  // Filter by project
  if (projectFilter !== "all") {
    items = items.filter(item => item.project === projectFilter);
  }
  
  document.getElementById("gallery-rating-filter").onchange = renderGallery;
  
  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color:var(--text-muted)">
        <h3>${t("no_items_found")}</h3>
        <p>${t("generate_prompt")}</p>
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
      starsHtml = `<span style="color:var(--accent-cyan); font-weight:700; font-size:0.75rem;">${t("pending_review")}</span>`;
    }
    
    return `
      <div class="gallery-item" data-id="${item.id}">
        <img src="${imgUrl}" class="gallery-thumbnail" alt="${item.title}">
        <div class="gallery-info">
          <div class="gallery-date">${item.dateFormatted}</div>
          <div class="gallery-title">${item.title}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${t("style_label")}: ${item.style}</div>
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
    starsHtml = `<span style="color:var(--accent-cyan); font-weight:700; font-size:0.8rem;">${t("unreviewed_gen")}</span>`;
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
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${t("modal_verdict")}</div>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem;">
        ${starsHtml}
      </div>
    </div>
    
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <span class="pill accent">${t("style_label")}: ${item.style}</span>
      <span class="pill">${t("palette_label")}: ${item.palette}</span>
    </div>
    
    <div>
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.35rem;">${t("modal_prompt")}</div>
      <p class="modal-prompt-box">${item.prompt}</p>
    </div>
    
    <div>
      <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.35rem;">${t("modal_notes")}</div>
      <p style="font-size:0.9rem; font-style:italic; line-height:1.5; color:var(--text-primary); background:rgba(255,255,255,0.02); padding:0.75rem 1rem; border-radius:8px; border:1px solid rgba(255,255,255,0.05)">
        "${item.feedback || t("modal_no_notes")}"
      </p>
    </div>
    
    <div style="display:flex; gap:0.75rem; margin-top:auto; border-top:1px solid rgba(255,255,255,0.05); padding-top:1.25rem;">
      <button class="btn-submit-review" id="btn-modal-download" style="flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="width:16px; height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        ${t("download_hires")}
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
    if (confirm(t("confirm_delete"))) {
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
      showNotification(t("alert_entry_deleted"));
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

// Download configuration JSON file for cloud actions sync
function downloadConfigFile() {
  const configObj = {
    activeProjects: appState.settings.activeProjects,
    notifyTime: appState.settings.notifyTime,
    model: appState.settings.model
  };
  const jsonStr = JSON.stringify(configObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "config.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification(t("alert_config_downloaded"));
}

// Synchronize configurations directly to your GitHub repository in the background
async function syncConfigToGitHub() {
  const token = appState.settings.githubPat;
  if (!token) return;
  
  const owner = "BlackAaadam";
  const repo = "atg_artist";
  const filePath = "config.json";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  showNotification(t("alert_git_connecting"));
  
  const configObj = {
    activeProjects: appState.settings.activeProjects,
    notifyTime: appState.settings.notifyTime,
    model: appState.settings.model,
    projectPrefs: appState.projectPrefs
  };
  const jsonStr = JSON.stringify(configObj, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(jsonStr))); // UTF-8 safe base64 encoding
  
  try {
    // 1. Get file SHA if it exists
    let sha = null;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      if (getRes.ok) {
        const getJson = await getRes.json();
        sha = getJson.sha;
      }
    } catch (e) {
      console.log("No existing config.json found or fetch failed, creating new one.", e);
    }
    
    // 2. Commit / Put the file
    const body = {
      message: "config: update active projects and notify time from browser settings",
      content: base64Content
    };
    if (sha) body.sha = sha;
    
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify(body)
    });
    
    if (putRes.ok) {
      showNotification(t("alert_git_success"));
      console.log("config.json updated directly in GitHub repo.");
    } else {
      const errorJson = await putRes.json();
      throw new Error(errorJson.message || putRes.statusText);
    }
    
  } catch (err) {
    console.error("Failed to sync settings to GitHub:", err);
    alert(t("alert_git_fail") + "\n\nError: " + err.message);
  }
}

// Synchronize settings from deployed config.json back to the local browser
async function syncSettingsFromConfigJson() {
  try {
    // Fetch with cache-buster parameter to guarantee loading the latest version
    const res = await fetch("./config.json?t=" + Date.now());
    if (res.ok) {
      const gitConfig = await res.json();
      if (gitConfig && Array.isArray(gitConfig.activeProjects)) {
        appState.settings.activeProjects = gitConfig.activeProjects;
      }
      if (gitConfig && gitConfig.notifyTime) {
        appState.settings.notifyTime = gitConfig.notifyTime;
      }
      // Save back to local storage
      localStorage.setItem("aetheria_settings", JSON.stringify(appState.settings));
      console.log("Successfully synchronized local settings from repository config.json!");
    }
  } catch (err) {
    console.log("No config.json deployed or fetch failed, using local storage defaults.", err);
  }
}
