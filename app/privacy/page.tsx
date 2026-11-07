import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED, OPERATOR, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy – Twain" };

export default function Privacy() {
  return (
    <main className="legal mx-auto max-w-2xl px-5 py-8 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated {LEGAL_UPDATED}</p>

      <p>
        Twain is a dating app run by {OPERATOR} (&ldquo;we&rdquo;). This policy explains what we collect, why, who can see it,
        and the rights you have under the Nigeria Data Protection Act 2023 (NDPA) and similar laws. Questions or requests:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><b>From Google sign-in:</b> your name, email address and Google profile picture.</li>
        <li><b>What you add to your profile:</b> age, gender, who you&apos;re looking for, bio, photos, voice intro, vibe-check answers, lifestyle facts (e.g. whether you smoke) and dealbreakers.</li>
        <li><b>Your preferences:</b> distance and age range, and optionally an ethnicity preference.</li>
        <li><b>Ethnicity (optional, sensitive):</b> only stored if you choose to give it and tick the explicit-consent box.</li>
        <li><b>Approximate location:</b> from your device (rounded to about 1&nbsp;km before we save it) or the city you pick.</li>
        <li><b>Verification selfie:</b> if you ask to be verified.</li>
        <li><b>Activity:</b> likes, passes, matches, messages, blocks and reports.</li>
        <li><b>Technical:</b> a notification token for your device (if you turn on notifications), when you were last active, and error reports when the app crashes.</li>
      </ul>

      <h2>Why we use it (and our legal basis)</h2>
      <ul>
        <li>To run the service you signed up for: show you to compatible people, match you, deliver messages (contract).</li>
        <li>To keep people safe: verification, reports, bans, rate limits and fraud prevention (legitimate interest).</li>
        <li>Ethnicity and ethnicity preference: only for the matching filter you set, based on your explicit consent, which you can withdraw at any time by clearing it in your profile.</li>
        <li>To fix bugs and keep the app working (legitimate interest).</li>
      </ul>
      <p>We do not sell your data and we do not show ads.</p>

      <h2>What other members can see</h2>
      <p>
        Your first name, age, photos, bio, voice intro, approximate distance (in km), reply rate, vibe-match percentage and
        verified badge. They never see your email, exact location, ethnicity, preferences, lifestyle facts or dealbreakers.
        Messages are only visible to the two people in the match.
      </p>

      <h2>Who processes it for us</h2>
      <ul>
        <li><b>Vercel</b> (app hosting, United States).</li>
        <li><b>Supabase</b> (database and file storage, Frankfurt, EU).</li>
        <li><b>Google</b> (sign-in; push notifications on Android go through Google&apos;s messaging service).</li>
        <li><b>AI wingman provider</b>: only when you tap ✨ in a chat, we send both bios and the last 20 messages of that chat to generate a suggestion. Nothing is sent if you don&apos;t use it.</li>
      </ul>
      <p>
        Some of these providers are outside Nigeria. We rely on their contractual data-protection commitments to safeguard
        those transfers, as the NDPA allows.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Until you delete your account. When you do, your profile, matches, messages, likes and reports are deleted immediately
        and your photos, voice intro and selfie are erased from storage within about an hour. Error reports are kept for up to 90 days.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and correct your data in your profile, delete your account at any time (Profile → Delete account),
        withdraw consent, object to processing, or ask us for a copy of your data by emailing{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We reply within 30 days. You can also complain to the
        Nigeria Data Protection Commission (NDPC).
      </p>

      <h2>Age</h2>
      <p>Twain is only for people aged 18 or older. We delete accounts we find belong to anyone younger.</p>

      <h2>Security</h2>
      <p>
        Data travels over encrypted connections, access to the database is restricted, and uploads are checked and limited.
        No system is perfectly secure, so if we ever have a breach that puts you at risk we will tell you and the NDPC as the law requires.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way we&apos;ll tell you in the app before it takes effect.</p>

      <p><Link href="/terms">Terms of Service</Link></p>
    </main>
  );
}
