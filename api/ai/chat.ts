import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const { message, messages } = request.body || {};
    const input =
      Array.isArray(messages) && messages.length > 0
        ? messages
            .map((item) => `${item.role || "user"}: ${item.content || ""}`)
            .join("\n")
        : String(message || "").trim();

    if (!input) {
      return response.status(400).json({ error: "Message is required" });
    }

    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are the Electron Hub AI Assistant. Be helpful, concise, and focused on student enrollment, assessment, documents, payment, and portal navigation.",
      input,
    });

    return response.status(200).json({
      reply: completion.output_text,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return response.status(500).json({ error: "Unable to generate a response" });
  }
}
