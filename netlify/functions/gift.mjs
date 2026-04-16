import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
});

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

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { userPrompt } = JSON.parse(event.body);

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const message = completion.choices[0].message.content;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    };
  } catch (error) {
    console.error("OpenAI error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
