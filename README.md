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
5. Run: `npm run dev`

Deploy to Vercel for free. See /admin for God mode.

Run database migrations from your own machine (`npx prisma db push`), never from a public URL.
To make someone an admin, set it in the database yourself: `UPDATE "User" SET "isAdmin" = true WHERE email = 'you@example.com';`

Built with ❤️ by [Gaius] — the future of dating.
