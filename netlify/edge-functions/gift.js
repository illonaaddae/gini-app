const systemPrompt = `You are the Gift Genie.

You generate gift ideas that feel thoughtful, specific, and genuinely useful.
Your output must be in structured Markdown.
Do not write introductions or conclusions.
Start directly with the gift suggestions.

Each gift must:
- Have a clear heading
- Include a short explanation of why it works

If the user mentions a location, situation, or constraint,
adapt the gift ideas and add another short section
under each gift that guides the user to get the gift in that
constrained context.

After the gift ideas, include a section titled "Questions for you"
with clarifying questions that would help improve the recommendations.`;

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userPrompt } = await request.json();

  const AI_KEY = Deno.env.get("AI_KEY");
  const AI_URL = Deno.env.get("AI_URL");
  const AI_MODEL = Deno.env.get("AI_MODEL");

  // Call OpenAI-compatible API with streaming
  const upstreamResponse = await fetch(`${AI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    }),
  });

  if (!upstreamResponse.ok) {
    const errText = await upstreamResponse.text();
    return new Response(
      `data: ${JSON.stringify({ error: `AI provider error: ${errText.slice(0, 200)}` })}\n\n`,
      {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }

  // Transform the upstream OpenAI SSE stream into our custom SSE format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  (async () => {
    const reader = upstreamResponse.body.getReader();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content ?? "";
            if (content) {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ content })}\n\n`
                )
              );
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (error) {
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ error: error.message })}\n\n`
        )
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
