// Option lists shared by the profile screens and API validation.

export const VIBE_QUESTIONS = [
  "Party jollof is the best jollof",
  "Owambe parties are my cardio",
  "I'd pick Detty December in Lagos over a holiday abroad",
  "Afrobeats over Amapiano, any day",
  "Football on weekends is non-negotiable",
  "I'm a homebody — Netflix and suya > going out",
  "I want kids someday",
  "I'd japa if the right opportunity came",
  "I'm an early riser",
  "I reply to messages fast",
] as const;

// Lifestyle facts about me. Other people's dealbreakers are checked against these.
export const TRAITS = [
  { value: "smokes", label: "I smoke" },
  { value: "drinks", label: "I drink often" },
  { value: "has-kids", label: "I have kids" },
  { value: "wants-kids-soon", label: "I want kids soon" },
  { value: "no-kids-ever", label: "I don't want kids" },
] as const;

// Same values, phrased as "don't show me people who…"
export const DEALBREAKERS = [
  { value: "smokes", label: "Smokes" },
  { value: "drinks", label: "Drinks often" },
  { value: "has-kids", label: "Has kids" },
  { value: "wants-kids-soon", label: "Wants kids soon" },
  { value: "no-kids-ever", label: "Doesn't want kids" },
] as const;

export const TRAIT_VALUES: string[] = TRAITS.map((t) => t.value);

export const ETHNICITIES = [
  "Black", "White", "Asian", "Latin/Hispanic",
  "Middle Eastern", "Indian/South Asian", "Native/Indigenous", "Mixed", "Other",
];
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// For people who don't share GPS: pick the nearest city instead.
export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Lagos (Island/VI/Lekki)", lat: 6.45, lng: 3.47 },
  { name: "Lagos (Mainland/Ikeja)", lat: 6.6, lng: 3.35 },
  { name: "Abuja", lat: 9.06, lng: 7.49 },
  { name: "Port Harcourt", lat: 4.82, lng: 7.03 },
  { name: "Ibadan", lat: 7.38, lng: 3.95 },
  { name: "Kano", lat: 12.0, lng: 8.52 },
  { name: "Benin City", lat: 6.34, lng: 5.63 },
  { name: "Enugu", lat: 6.46, lng: 7.55 },
  { name: "Uyo", lat: 5.04, lng: 7.91 },
  { name: "Calabar", lat: 4.95, lng: 8.32 },
  { name: "Kaduna", lat: 10.52, lng: 7.44 },
  { name: "Jos", lat: 9.9, lng: 8.86 },
  { name: "Abeokuta", lat: 7.15, lng: 3.35 },
  { name: "Owerri", lat: 5.48, lng: 7.03 },
  { name: "Warri", lat: 5.52, lng: 5.75 },
  { name: "Ilorin", lat: 8.5, lng: 4.55 },
];

export const DISTANCES = [10, 25, 50, 100, 500] as const;

// Selfie verification: user copies one of these so a stolen photo can't pass.
export const POSES = [
  "Thumbs up 👍 next to your face",
  "Peace sign ✌️ with your left hand",
  "Hand on your chin 🤔",
  "Point at your ear with your right hand",
  "Cover one eye with your hand",
  "Wave 👋 with your left hand",
];
