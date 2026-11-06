# Twain
# Twain Dating App 2026

A modern, full-stack dating app built with Next.js 15, Prisma, and Vercel. Features:
- Google OAuth login
- Tinder-style swiping with ethnicity filters (private)
- Mandatory voice intros, vibe questions, dealbreakers
- Anti-ghosting reply-rate scores
- Grok AI wingman for chat replies
- Full admin panel

## Quick Start
1. Clone: `git clone https://github.com/G41US/Twain.git`
2. Install: `npm install`
3. Copy `.env.example` to `.env` and fill it in:
   - `DATABASE_URL` — Supabase Postgres (free)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `UPLOADTHING_TOKEN` — needed for photo and voice uploads
   - `WINGMAN_API_KEY` — optional, turns on the ✨ AI wingman
4. Create tables: `npm run db:push`
5. Run: `npm run dev`

### Try it without Google
Set `DEMO_LOGIN="true"` in `.env`, run `npm run seed`, start `npm run dev`, then open
`/api/auth/signin` and use the Demo option with `you@demo.twain`. (Only works in dev mode.)

### Tests
`npm test`

Deploy to Vercel for free.

## Making yourself admin
Sign in once with Google, then run this in your database's SQL editor (e.g. Supabase → SQL Editor). It takes effect immediately:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'you@example.com';
```

Then open `/admin`.

Built with ❤️ by [Gaius] — the future of dating.
