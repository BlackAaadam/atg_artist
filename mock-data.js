// Pre-loaded mock historical data for Aetheria AI Art Journal
// Exposed as a global window object to work out-of-the-box in Vanilla JS

window.MOCK_DATA = [
  {
      "id": "gen-line_sticker-2026-05-29",
      "project": "line_sticker",
      "date": "2026-05-29",
      "title": "Cosmic Growth #0529",
      "prompt": "A futuristic glass greenhouse floating in deep space, glowing cosmic stars, botanical fantasy, rendered in Studio Ghibli style, with a Vibrant / Warm color palette, whimsical, detailed, 8k resolution",
      "imagePath": "assets/generations/daily_2026-05-29.png",
      "style": "Studio Ghibli",
      "palette": "Neon / High Contrast",
      "dateFormatted": "May 29, 2026"
  },
  {
    id: "gen-line_sticker-2026-05-26",
    project: "line_sticker",
    date: "2026-05-26",
    title: "Nostalgic Meadows",
    prompt: "A lush green meadow under a bright blue sky with fluffy white clouds, in the style of Studio Ghibli. Rolling hills, wildflowers blooming, warm sunlight, nostalgic and heartwarming hand-drawn anime aesthetic.",
    imagePath: "assets/ghibli_countryside.png",
    style: "Studio Ghibli",
    palette: "Vibrant / Warm",
    rating: 5,
    approved: true,
    feedback: "I absolutely love the warmth and nostalgic feelings. The clouds and soft lighting are perfect. I want to see more of this hand-drawn feel!",
    dateFormatted: "May 26, 2026"
  },
  {
    id: "gen-abstract_illustration-2026-05-27",
    project: "abstract_illustration",
    date: "2026-05-27",
    title: "Nebula Sentinel",
    prompt: "A beautiful surreal digital art of a giant glowing moon floating over a calm starry ocean, with a lone tree on a small island. Pastel purple and gold hues, whimsical, dreamy fantasy art, high resolution.",
    imagePath: "assets/cosmic_surrealism.png",
    style: "Surrealism",
    palette: "Pastel / Cosmic",
    rating: 3,
    approved: true,
    feedback: "The colors are beautiful, but the overall subject is a bit empty. The tree looks a bit isolated. Let's try to add more elements next time.",
    dateFormatted: "May 27, 2026"
  },
  {
    id: "gen-aesthetic_landscape-2026-05-28",
    project: "aesthetic_landscape",
    date: "2026-05-28",
    title: "Neon Rain in Shinjuku",
    prompt: "A stunning, highly detailed watercolor painting of a rainy cyberpunk street in Tokyo. Neon reflections on wet pavement, soft glowing blue and pink lights, dreamy atmosphere, premium artistic style.",
    imagePath: "assets/cyberpunk_watercolor.png",
    style: "Cyberpunk Watercolor",
    palette: "Neon / High Contrast",
    rating: 4,
    approved: true,
    feedback: "Really interesting mix of cyberpunk and watercolor. The wet reflections look incredibly realistic. Maybe make the neon colors pop even more next time.",
    dateFormatted: "May 28, 2026"
  },
  {
    id: "gen-quote_card_background-2026-05-25",
    project: "quote_card_background",
    date: "2026-05-25",
    title: "Golden Hour Solitude",
    prompt: "An artistic minimalist abstract background for a quote card, textured canvas, subtle golden and beige gradient color flow, copy space, elegant composition, high resolution, no text.",
    imagePath: "assets/quote_card_bg.png",
    style: "Oil Impressionism",
    palette: "Pastel / Cosmic",
    rating: 5,
    approved: true,
    feedback: "Perfect amount of negative space for adding text. The canvas texture looks high-quality.",
    dateFormatted: "May 25, 2026"
  }
];

window.MOCK_STYLES = [
  { name: "Studio Ghibli", category: "Art Styles", description: "Soft, hand-drawn anime nostalgia" },
  { name: "Cyberpunk Watercolor", category: "Art Styles", description: "Gritty neon themes blended with soft washes" },
  { name: "Cosmic Surrealism", category: "Art Styles", description: "Dreamlike cosmic landscapes and pastel nebula" },
  { name: "Minimalist Ink", category: "Art Styles", description: "High-contrast Japanese Zen wash paintings" },
  { name: "Oil Impressionism", category: "Art Styles", description: "Thick textured brushstrokes, focus on light play" },
  { name: "Line Art Illustration", category: "Art Styles", description: "Clean black ink linework with flat color fills" },
  { name: "Minimalist Editorial Photography", category: "Art Styles", description: "Clean, high-fashion layout with modern framing" },
  { name: "Poetic Photo Essay", category: "Art Styles", description: "Nostalgic, emotive storytelling through raw photography" },
  { name: "Japanese Magazine Layout", category: "Art Styles", description: "Asymmetric typography, negative space, and collage feel" },
  { name: "Matte Paper Print", category: "Art Styles", description: "Soft, flat ink tones on heavy textured fine art paper" }
];

window.MOCK_PALETTES = [
  { name: "Neon / High Contrast", colors: ["#ff007f", "#00f0ff", "#120e2e"] },
  { name: "Vibrant / Warm", colors: ["#ff9f43", "#ff6b6b", "#1dd1a1"] },
  { name: "Pastel / Cosmic", colors: ["#a29bfe", "#fd79a8", "#ffeaa7"] },
  { name: "Monochrome / Dark", colors: ["#2d3436", "#636e72", "#dfe6e9"] },
  { name: "Earth / Forest", colors: ["#2e86de", "#10ac84", "#ff9f43"] },
  { name: "Ivory Paper / Muted Earth", colors: ["#FDFBF7", "#A89F91", "#5C5346"] },
  { name: "Warm Paper / Forest Green", colors: ["#F9F6F0", "#859F84", "#1E3F20"] },
  { name: "Soft Natural Editorial", colors: ["#EAE6DF", "#C2B29F", "#4A4641"] },
  { name: "Matte Cream / Ink Gray", colors: ["#F5EFE6", "#686D76", "#191A19"] },
  { name: "Devotional Neutral Palette", colors: ["#E6DFD3", "#B3A594", "#4E4337"] }
];
