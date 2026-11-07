import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_UPDATED, OPERATOR, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service – Twain" };

export default function Terms() {
  return (
    <main className="legal mx-auto max-w-2xl px-5 py-8 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated {LEGAL_UPDATED}</p>

      <p>
        These terms are an agreement between you and {OPERATOR}, who run Twain. By creating an account you agree to them
        and to our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Who can use Twain</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>One account per person, using your real age and photos of yourself.</li>
        <li>You can&apos;t use Twain if you&apos;ve been banned before, or if you&apos;ve been convicted of a sexual or violent offence.</li>
      </ul>

      <h2>Community rules</h2>
      <p>Don&apos;t:</p>
      <ul>
        <li>Ask anyone for money, gifts, airtime, crypto or bank details, or promote any business or investment.</li>
        <li>Pretend to be someone else or use other people&apos;s photos.</li>
        <li>Harass, threaten, insult or bully anyone, or keep messaging someone who has stopped replying.</li>
        <li>Post or send nudity, sexual content, violence or hate speech.</li>
        <li>Involve anyone under 18 in any way.</li>
        <li>Use bots, scrape the app, or try to break its security.</li>
      </ul>
      <p>
        Breaking these rules can get your account suspended or banned without warning. Report anything wrong with the ⚑
        button on a profile or the ⋯ menu in a chat.
      </p>

      <h2>Your content</h2>
      <p>
        You own the photos, text and audio you add. You let us store and display them to other members so the service works.
        This permission ends when you delete them or your account.
      </p>

      <h2>Staying safe</h2>
      <p>
        We don&apos;t run criminal background checks, and a verified badge only means someone&apos;s selfie matched their
        photos. Never send money to anyone you meet on Twain. Meet in a public place, tell a friend where you&apos;re going,
        and arrange your own transport. You are responsible for your interactions with other members.
      </p>

      <h2>The service</h2>
      <p>
        Twain is free and provided &ldquo;as is&rdquo;. We work to keep it running but can&apos;t promise it will always be available,
        or that you will find a match. To the extent the law allows, we aren&apos;t liable for how other members behave or for
        indirect losses.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time in Profile → Delete account. We can close accounts that break these terms.
      </p>

      <h2>Law and contact</h2>
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria. We may update them and will tell you in the
        app before important changes take effect. Contact: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </main>
  );
}
