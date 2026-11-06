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
3. DB: Set DATABASE_URL in .env (use Supabase Postgres)
4. Auth: Add GOOGLE_CLIENT_ID/SECRET
5. Create tables: `npm run db:push`
6. Run: `npm run dev`

Deploy to Vercel for free.

## Making yourself admin
Sign in once with Google, then run this in your database's SQL editor (e.g. Supabase → SQL Editor), and sign out and back in:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'you@example.com';
```

Then open `/admin`.

Built with ❤️ by [Gaius] — the future of dating.
