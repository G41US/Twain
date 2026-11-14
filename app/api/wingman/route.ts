import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WINGMAN_STYLES } from "@/lib/options";

// Any OpenAI-compatible chat API works: xAI (default), Groq, OpenRouter, a local Ollama...
const API_URL = process.env.WINGMAN_API_URL || "https://api.x.ai/v1";
const API_KEY = process.env.WINGMAN_API_KEY || process.env.GROK_API_KEY;
const MODEL = process.env.WINGMAN_MODEL || "grok-3-mini";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { matchId, style: wanted } = await req.json().catch(() => ({}));
  const style: (typeof WINGMAN_STYLES)[number] = WINGMAN_STYLES.includes(wanted) ? wanted : "natural";
  const match =
    typeof matchId === "string" &&
    (await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: me.id }, { user2Id: me.id }] },
      include: {
        user1: { select: { id: true, name: true, bio: true, prompts: true } },
        user2: { select: { id: true, name: true, bio: true, prompts: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }));
  if (!match) return new Response("Not found", { status: 404 });

  const other = match.user1Id === me.id ? match.user2 : match.user1;
  const prompts = (other.prompts as { q: string; a: string }[] | null) ?? [];
  if (!API_KEY) return Response.json({ reply: starter(style, prompts[0]) });
  const transcript = match.messages
    .reverse()
    .map((m) => `${m.senderId === me.id ? "Me" : other.name ?? "Them"}: ${m.body}`)
    .join("\n");

  const res = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are a dating-app wingman. Suggest ONE short, genuine next message (max 2 sentences) " +
            `the user could send, in a ${style} tone (${TONES[style]}). ` +
            "Reference something specific from their match's prompts, bio or the chat. " +
            "No pickup lines, nothing sexual or pushy. Reply with the message text only.",
        },
        {
          role: "user",
          content:
            `My bio: ${me.bio ?? "(none)"}\nTheir name: ${other.name ?? "?"}\nTheir bio: ${other.bio ?? "(none)"}\n` +
            `Their prompts: ${prompts.map((p) => `${p.q}: ${p.a}`).join(" | ") || "(none)"}\n\n` +
            `Chat so far:\n${transcript || "(no messages yet — suggest an opener)"}`,
        },
      ],
    }),
  });

  if (!res.ok) return Response.json({ error: "Wingman is unavailable right now." }, { status: 502 });
  const data = await res.json();
  return Response.json({ reply: data.choices?.[0]?.message?.content?.trim() ?? "" });
}

const TONES = {
  natural: "relaxed and warm",
  witty: "playful, light humour",
  direct: "clear and confident, says what they mean",
  romantic: "sweet and sincere, never cheesy or sexual",
} as const;

// Without an AI key, a hand-written opener in the chosen style, built on their first prompt when there is one.
function starter(style: keyof typeof TONES, prompt?: { q: string; a: string }): string {
  if (prompt) {
    const a = prompt.a.replace(/[.!?]+$/, "");
    // Quote short answers; for long ones, refer to the prompt instead so the opener stays one easy line.
    const ref = a.length <= 40 ? `"${a}"` : `Your answer to "${prompt.q}"`;
    return {
      natural: `${ref} made me smile. What's the story behind it?`,
      witty: `${ref}? Bold. I need the full story before I decide if I agree 😄`,
      direct: `${ref} caught my eye. Tell me more?`,
      romantic: `${ref} says a lot about you, and I like what it says. How's your day going?`,
    }[style];
  }
  return {
    natural: "Hey! How's your week going so far?",
    witty: "I was told to say something clever, but I'd rather hear something clever from you. Go 😄",
    direct: "Hi! I liked your profile and wanted to say hello. What are you up to this weekend?",
    romantic: "Hi, your smile made me stop scrolling. How's your day been?",
  }[style];
}
