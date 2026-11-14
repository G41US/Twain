// Where the app talks to. The Supabase anon key is public by design (database rules decide what it can do).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://twain-coral.vercel.app";
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wnhrkkgsedcaidvwzwfq.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaHJra2dzZWRjYWlkdnd6d2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTY0MDMsImV4cCI6MjA3OTU5MjQwM30.dL7Epg9HEkNQq3cOkmc9Z8te6CvNPQ_8M46-HS2ENQs";

// Local testing only: pretend to be signed in as this email (the dev server must have DEMO_LOGIN=true).
export const DEMO_EMAIL = __DEV__ ? process.env.EXPO_PUBLIC_DEMO_EMAIL : undefined;
