export async function POST(req: Request) {
  const { context } = await req.json();

  // Placeholder for Grok API - add your key in .env
  const reply = `Hey! Based on "${context}", how about: "Your voice intro had me hooked – what's your go-to karaoke song? 🎤"`;

  // Real Grok call (uncomment with key):
  /*
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [{ role: "user", content: `Write a flirty dating app reply for: ${context}` }],
      temperature: 0.8,
    }),
  });
  const data = await res.json();
  const reply = data.choices[0].message.content;
  */

  return Response.json({ reply });
}
