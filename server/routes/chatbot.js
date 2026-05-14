import express from "express";
import {
  findDirectFaq,
  isEnrollmentRelated,
  retrieveChatbotKnowledge,
} from "../../src/data/chatbotKnowledge.js";

const router = express.Router();

function compactContext(context = {}) {
  const progress = Array.isArray(context.enrollmentProgress)
    ? context.enrollmentProgress
        .filter((step) => step.status === "current" || step.status === "completed")
        .map((step) => `${step.name}: ${step.status}`)
        .slice(-4)
    : [];

  return {
    role: context.userRole || "guest",
    currentStep: context.currentStep || null,
    paymentStatus: context.paymentStatus || null,
    voucherStatus: context.voucherStatus || null,
    rejectedDocuments: Array.isArray(context.rejectedDocuments)
      ? context.rejectedDocuments.slice(0, 3)
      : [],
    progress,
  };
}

function buildPrompt({ message, knowledge, context, recentMessages }) {
  return [
    `Student question: ${message}`,
    `Student context: ${JSON.stringify(compactContext(context))}`,
    `Recent chat: ${JSON.stringify((recentMessages || []).slice(-3))}`,
    `Relevant knowledge: ${knowledge.map((item) => `[${item.category}] ${item.content}`).join("\n\n")}`,
    "Answer in 2-5 short sentences. If the answer is not supported by the knowledge, say so and redirect to registrar/cashier or official support.",
  ].join("\n\n");
}

async function generateGroqReply({ message, knowledge, context, recentMessages }) {
  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are EHub AI Assistant, Electron Hub's enrollment support assistant. Only answer enrollment, assessment, documents, payments, voucher, school info, and portal navigation questions. Use only provided knowledge and context. Never reveal confidential data, invent eligibility, alter payment records, or override registrar/cashier decisions. Be concise, professional, student-friendly, and lightly conversational.",
        },
        {
          role: "user",
          content: buildPrompt({ message, knowledge, context, recentMessages }),
        },
      ],
      temperature: 0.15,
      max_tokens: 220,
    }),
  });

  const completion = await groqResponse.json();

  if (!groqResponse.ok) {
    throw new Error(completion?.error?.message || "Groq API request failed");
  }

  return String(completion.choices?.[0]?.message?.content || "").trim();
}

router.post("/", async (request, response) => {
  const { message, context, recentMessages } = request.body || {};
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    return response.status(400).json({ success: false, error: "Message is required" });
  }

  const faq = findDirectFaq(trimmedMessage);
  if (faq) {
    return response.json({
      success: true,
      source: "faq",
      reply: faq.answer,
      category: faq.category,
      knowledge: retrieveChatbotKnowledge(trimmedMessage, 2),
    });
  }

  if (!isEnrollmentRelated(trimmedMessage)) {
    return response.json({
      success: true,
      source: "guardrail",
      reply:
        "I can help with Electron Hub enrollment, assessment, documents, payment, voucher, and portal navigation. For other concerns, please contact the school through official support channels.",
      category: "restrictions",
      knowledge: [],
    });
  }

  const knowledge = retrieveChatbotKnowledge(trimmedMessage, 3);

  if (!process.env.GROQ_API_KEY) {
    return response.json({
      success: true,
      source: "retrieval",
      reply: knowledge[0]?.content || "I can help with enrollment-related questions. Please ask about enrollment, documents, payment, voucher, assessment, or navigation.",
      category: knowledge[0]?.category || "enrollment",
      knowledge,
    });
  }

  try {
    const reply = await generateGroqReply({
      message: trimmedMessage,
      knowledge,
      context,
      recentMessages,
    });

    return response.json({
      success: true,
      source: "ai",
      reply,
      category: knowledge[0]?.category || "enrollment",
      knowledge,
    });
  } catch (error) {
    console.error("Chatbot Groq error:", error);
    return response.json({
      success: true,
      source: "retrieval-fallback",
      reply:
        "I can help, but the AI response service is temporarily unavailable. Based on the enrollment guide, please check the related dashboard page or contact the registrar/cashier for official confirmation.",
      category: knowledge[0]?.category || "enrollment",
      knowledge,
    });
  }
});

export default router;
