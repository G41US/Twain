import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Any OpenAI-compatible chat API works: xAI (default), Groq, OpenRouter, a local Ollama...
const API_URL = process.env.WINGMAN_API_URL || "https://api.x.ai/v1";
const API_KEY = process.env.WINGMAN_API_KEY || process.env.GROK_API_KEY;
const MODEL = process.env.WINGMAN_MODEL || "grok-3-mini";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (!API_KEY) return Response.json({ error: "AI wingman isn't set up yet (add WINGMAN_API_KEY)." }, { status: 503 });

  const { matchId } = await req.json().catch(() => ({}));
  const match =
    typeof matchId === "string" &&
    (await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: me.id }, { user2Id: me.id }] },
      include: {
        user1: { select: { id: true, name: true, bio: true } },
        user2: { select: { id: true, name: true, bio: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }));
  if (!match) return new Response("Not found", { status: 404 });

  const other = match.user1Id === me.id ? match.user2 : match.user1;
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
            "You are a dating-app wingman. Suggest ONE short, friendly, genuine next message (max 2 sentences) " +
            "the user could send. Reference something specific from their match's bio or the chat. " +
            "No pickup lines, nothing sexual or pushy. Reply with the message text only.",
        },
        {
          role: "user",
          content:
            `My bio: ${me.bio ?? "(none)"}\nTheir name: ${other.name ?? "?"}\nTheir bio: ${other.bio ?? "(none)"}\n\n` +
            `Chat so far:\n${transcript || "(no messages yet — suggest an opener)"}`,
        },
      ],
    }),
  });

  if (!res.ok) return Response.json({ error: "Wingman is unavailable right now." }, { status: 502 });
  const data = await res.json();
  return Response.json({ reply: data.choices?.[0]?.message?.content?.trim() ?? "" });
}
