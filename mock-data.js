// Pre-loaded mock historical data for Aetheria AI Art Journal
// Exposed as a global window object to work out-of-the-box in Vanilla JS

window.MOCK_DATA = [
  {
      "id": "gen-2026-05-29",
      "date": "2026-05-29",
      "title": "Cosmic Growth #0529",
      "prompt": "A futuristic glass greenhouse floating in deep space, glowing cosmic stars, botanical fantasy, rendered in Cyberpunk Watercolor style, with a Pastel / Cosmic color palette, whimsical, detailed, 8k resolution",
      "imagePath": "assets/generations/daily_2026-05-29.png",
      "style": "Studio Ghibli",
      "palette": "Neon / High Contrast",
      "dateFormatted": "May 29, 2026"
  },
  {
      "id": "gen-2026-05-29",
      "date": "2026-05-29",
      "title": "Cosmic Growth #0529",
      "prompt": "A futuristic glass greenhouse floating in deep space, glowing cosmic stars, botanical fantasy, rendered in Cosmic Surrealism style, with a Pastel / Cosmic color palette, whimsical, detailed, 8k resolution",
      "imagePath": "assets/generations/daily_2026-05-29.png",
      "style": "Studio Ghibli",
      "palette": "Neon / High Contrast",
      "dateFormatted": "May 29, 2026"
  },
  {
      "id": "gen-2026-05-29",
      "date": "2026-05-29",
      "title": "Cosmic Growth #0529",
      "prompt": "A futuristic glass greenhouse floating in deep space, glowing cosmic stars, botanical fantasy, rendered in Studio Ghibli style, with a Vibrant / Warm color palette, whimsical, detailed, 8k resolution",
      "imagePath": "assets/generations/daily_2026-05-29.png",
      "style": "Studio Ghibli",
      "palette": "Neon / High Contrast",
      "dateFormatted": "May 29, 2026"
  },
  {
    id: "gen-2026-05-26",
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
    id: "gen-2026-05-27",
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
    id: "gen-2026-05-28",
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
  }
];

window.MOCK_STYLES = [
  { name: "Studio Ghibli", category: "Art Styles", description: "Soft, hand-drawn anime nostalgia" },
  { name: "Cyberpunk Watercolor", category: "Art Styles", description: "Gritty neon themes blended with soft washes" },
  { name: "Cosmic Surrealism", category: "Art Styles", description: "Dreamlike cosmic landscapes and pastel nebula" },
  { name: "Minimalist Ink", category: "Art Styles", description: "High-contrast Japanese Zen wash paintings" },
  { name: "Oil Impressionism", category: "Art Styles", description: "Thick textured brushstrokes, focus on light play" },
  { name: "Line Art Illustration", category: "Art Styles", description: "Clean black ink linework with flat color fills" }
];

window.MOCK_PALETTES = [
  { name: "Neon / High Contrast", colors: ["#ff007f", "#00f0ff", "#120e2e"] },
  { name: "Vibrant / Warm", colors: ["#ff9f43", "#ff6b6b", "#1dd1a1"] },
  { name: "Pastel / Cosmic", colors: ["#a29bfe", "#fd79a8", "#ffeaa7"] },
  { name: "Monochrome / Dark", colors: ["#2d3436", "#636e72", "#dfe6e9"] },
  { name: "Earth / Forest", colors: ["#2e86de", "#10ac84", "#ff9f43"] }
];
