import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { message, messages } = body || {};
    const input =
      Array.isArray(messages) && messages.length > 0
        ? messages
            .map((item) => `${item.role || "user"}: ${item.content || ""}`)
            .join("\n")
        : String(message || "").trim();

    if (!input) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are the Electron Hub AI Assistant. Be helpful, concise, and focused on student enrollment, assessment, documents, payment, and portal navigation.",
      input,
    });

    return Response.json({ reply: completion.output_text });
  } catch (error) {
    console.error("AI chat error:", error);
    return Response.json({ error: "Unable to generate a response" }, { status: 500 });
  }
}
