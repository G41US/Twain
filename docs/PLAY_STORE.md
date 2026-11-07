# Publishing Twain on Google Play

Package name: `com.g41us.twain` · Min Android 7.0 · Target Android 16 (API 36)

## One-time setup
1. Create a Google Play developer account (personal, US$25) at https://play.google.com/console.
2. **Create app** → name **Twain**, App, Free, accept declarations.
3. Upload `app-release.aab` to **Testing → Closed testing** (new personal accounts must run a closed test
   with **12+ testers for 14 days in a row** before production is unlocked).
4. Add testers by email (a Google Group is easiest), share the opt-in link, keep them opted in 14 days.
5. After the first upload, open **Setup → App signing**, copy the **App signing key SHA-256**, and add it to
   `public/.well-known/assetlinks.json` next to the upload key. Without it the Play-installed app shows a
   browser address bar.
6. After 14 days: **Dashboard → Apply for production**.

## Store listing
**Short description (80 max)**
> Dating with voice intros, vibe checks and people who actually reply. 18+.

**Full description**
> Twain is a dating app for people who are tired of dead chats.
>
> 🎙 Voice intros – hear someone before you match.
> ✨ Vibe check – see how much you have in common, from party jollof to Detty December.
> 💬 Reply rate – everyone's profile shows how often they reply, so ghosts stand out.
> ✓ Verified profiles – selfie verification keeps catfish out.
> 📍 Nearby – set your distance and age range.
> 🤖 AI wingman – stuck on what to say? Get a friendly opener.
> 🛡 Safety first – report and block in one tap, and we review every report.
>
> Twain is free. You must be 18 or older.

**Graphics:** `icon-512.png`, `feature-graphic.png` (1024×500), phone screenshots 1080×1920.
**Category:** Dating · **Contact email:** the support email in `lib/site.ts`
**Privacy policy URL:** https://twain-coral.vercel.app/privacy

## App content answers
- **Target audience:** 18 and over only.
- **Content rating questionnaire:** Category *Social / communication*. Users interact: **yes**. Users share
  location: **approximate, with other users as distance only**. Shares personal info: **yes** (profile).
  Dating app: **yes**. Expect an 18+ / Mature rating.
- **Ads:** No ads.
- **Account deletion:** In app: Profile → Delete account. Web link for the form:
  https://twain-coral.vercel.app/profile (sign in, scroll down, Delete account).
- **Government / financial / health features:** None.

## Data safety form
Data is encrypted in transit: **Yes**. Users can request deletion: **Yes** (in app).

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name, email (Google sign-in) | Yes | No | Account management | Required |
| Approximate location | Yes | No | App functionality (distance) | Required |
| Race and ethnicity | Yes | No | App functionality (matching filter) | Optional |
| Photos | Yes | No | App functionality | Required |
| Voice or sound recordings | Yes | No | App functionality | Optional |
| Messages (in-app) | Yes | No* | App functionality | Required |
| Other user-generated content (bio, answers) | Yes | No | App functionality | Required |
| Crash logs | Yes | No | Analytics (app stability) | Required |
| Device or other IDs (push token) | Yes | No | App functionality (notifications) | Optional |

\* When a user taps the ✨ wingman, both bios and the last 20 messages of that chat are sent to the AI
provider to generate a suggestion. Declare this as **Shared: Messages → App functionality**, optional,
if you turn the wingman on (set `WINGMAN_API_KEY`).

## Releasing updates
Website changes go live on Vercel immediately; the app picks them up with no new upload.
Only changes under `android/` need a new build: GitHub → Actions → **Android app** → Run workflow
(needs the four signing secrets listed at the top of `.github/workflows/android.yml`).
