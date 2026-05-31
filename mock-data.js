// Pre-loaded mock historical data for Aetheria AI Art Journal
// Exposed as a global window object to work out-of-the-box in Vanilla JS

window.MOCK_DATA = [
  {
    id: "gen-sacred_still_life-2026-05-31",
    project: "sacred_still_life",
    date: "2026-05-31",
    title: "Vessel of Devotion",
    prompt: "A quiet, poetic image-only still-life photograph with a sacred devotional mood. No text. A single simple ceramic bowl and an old brass key resting on a rustic wooden table next to a folded white linen cloth. Soft diffused side light from a window casting long gentle shadows. The color palette is warm neutrals and muted earth tones. Peaceful, reverent, silent atmosphere, suitable for reflection.",
    imagePath: "assets/sacred_still_mock.png",
    style: "Matte Paper Print",
    palette: "Ivory Paper / Muted Earth",
    rating: 5,
    approved: true,
    feedback: "The key and simple bowl tell a beautiful story of quietness and devotion. Love the natural wood grain.",
    dateFormatted: "May 31, 2026"
  },
  {
    id: "gen-time_passage_threshold-2026-05-31",
    project: "time_passage_threshold",
    date: "2026-05-31",
    title: "Light & Shadow Crossing",
    prompt: "A cinematic, poetic image-only photograph of a quiet, empty room with a tall arched window. A strong beam of natural morning light streams across the bare wooden floor, casting long soft shadows. A single minimalist empty wooden chair sits near the door in the background. The color palette is muted gray and warm ivory paper tones. Serious, contemplative, silent mood, symbolizing time and passage. No text.",
    imagePath: "assets/time_passage_mock.png",
    style: "Minimalist Editorial Photography",
    palette: "Matte Cream / Ink Gray",
    rating: 5,
    approved: true,
    feedback: "Incredibly atmospheric. The contrast of light and the empty chair creates a strong narrative of waiting.",
    dateFormatted: "May 31, 2026"
  },
  {
    id: "gen-gift_relationship-2026-05-31",
    project: "gift_relationship",
    date: "2026-05-31",
    title: "Paired Warmth",
    prompt: "A warm, poetic image-only lifestyle still-life photograph showing two ceramic cups filled with tea on a wooden table, next to a small beautifully wrapped gift with a simple cotton string, soft sunlight filtering through a window casting gentle shadows, linen napkin texture, warm natural colors, cozy contemplative mood, symbolizing companionship and gift. No text.",
    imagePath: "assets/gift_relationship_mock.png",
    style: "Poetic Photo Essay",
    palette: "Soft Natural Editorial",
    rating: 5,
    approved: true,
    feedback: "The warm dining room lighting and paired cups feel deeply relational. The paper texture on the gift is beautiful.",
    dateFormatted: "May 31, 2026"
  },
  {
    id: "gen-botanical_growth-2026-05-31",
    project: "botanical_growth",
    date: "2026-05-31",
    title: "Resilient Sprout",
    prompt: "A poetic botanical photograph of a small green sprout emerging from a crack in a mossy stone. Soft morning light, shallow depth of field, macro detail, muted natural colors (earth, forest green, warm paper), matte paper print texture, calm contemplative mood, symbolizing growth and renewal. No text.",
    imagePath: "assets/botanical_growth_mock.png",
    style: "Poetic Photo Essay",
    palette: "Warm Paper / Forest Green",
    rating: 4,
    approved: true,
    feedback: "Beautiful lighting on the moss and sprout. It feels very peaceful and full of hope.",
    dateFormatted: "May 31, 2026"
  },
  {
    id: "gen-poetic_editorial-2026-05-30",
    project: "poetic_editorial",
    date: "2026-05-30",
    title: "Silent Whisper",
    prompt: "A poetic image-only editorial photograph for a quiet literary and spiritual page. No text, no typography, no letters, no captions. A delicate single dried flower resting on an ivory textured paper background, soft side lighting casting a gentle shadow, minimalist off-center composition, clean layout with ample breathing room, matte print feel, muted earthy color palette, calm and contemplative atmosphere.",
    imagePath: "assets/poetic_editorial_mock.png",
    style: "Minimalist Editorial Photography",
    palette: "Ivory Paper / Muted Earth",
    rating: 5,
    approved: true,
    feedback: "The delicate flower shadow and texture are perfect. The off-center framing is exactly what I wanted.",
    dateFormatted: "May 30, 2026"
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
