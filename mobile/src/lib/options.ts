// Same lists as the website's lib/options.ts (the API validates against those). Keep the two in sync.

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

export const TRAITS = [
  { value: "smokes", label: "I smoke" },
  { value: "drinks", label: "I drink often" },
  { value: "has-kids", label: "I have kids" },
  { value: "wants-kids-soon", label: "I want kids soon" },
  { value: "no-kids-ever", label: "I don't want kids" },
];

export const DEALBREAKERS = [
  { value: "smokes", label: "Smokes" },
  { value: "drinks", label: "Drinks often" },
  { value: "has-kids", label: "Has kids" },
  { value: "wants-kids-soon", label: "Wants kids soon" },
  { value: "no-kids-ever", label: "Doesn't want kids" },
];

export const ETHNICITIES = [
  "Black", "White", "Asian", "Latin/Hispanic",
  "Middle Eastern", "Indian/South Asian", "Native/Indigenous", "Mixed", "Other",
];
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export const CITIES = [
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

export const DISTANCES = [10, 25, 50, 100, 500];
export const GENDERS = [
  { value: "Male", label: "Man" },
  { value: "Female", label: "Woman" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Other", label: "Other" },
];
export const LOOKING_FOR = [
  { value: "Women", label: "Women" },
  { value: "Men", label: "Men" },
  { value: "Everyone", label: "Everyone" },
];

// What someone is on Twain for. Shown on their card; Discover favours people who want the same thing.
export const INTENTIONS = [
  { value: "serious", label: "A serious relationship", short: "Serious" },
  { value: "casual", label: "Something casual", short: "Casual" },
  { value: "exploring", label: "Still figuring it out", short: "Exploring" },
  { value: "open", label: "Open to see where it goes", short: "Open" },
] as const;
export const INTENTION_VALUES: string[] = INTENTIONS.map((i) => i.value);

// Profile prompts: up to 3, each answered in a line or two. Easier to reply to than a bio.
export const PROMPTS = [
  "My simple pleasure",
  "We'll get along if",
  "A perfect first date",
  "The quickest way to my heart",
  "Green flags I look for",
  "My ideal weekend",
  "The best jollof in town is",
  "I'm weirdly good at",
  "Two truths and a lie",
  "My unpopular opinion",
];
export const MAX_PROMPTS = 3;
export const PROMPT_MAX_CHARS = 150;

export const WINGMAN_STYLES = ["natural", "witty", "direct", "romantic"] as const;
