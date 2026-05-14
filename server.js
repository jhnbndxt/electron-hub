import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import OpenAI from "openai";

import chatbotRouter from "./server/routes/chatbot.js";

dotenv.config({ path: "./.env" });

console.log("OPENROUTER_API_KEY=", process.env.OPENROUTER_API_KEY);

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/chatbot", chatbotRouter);

const openai = new OpenAI({

  baseURL:
    "https://openrouter.ai/api/v1",

  apiKey:
    process.env.OPENROUTER_API_KEY,
});

app.post(
  "/api/chatbot",

  async (req, res) => {

    try {

      const {
        message
      } = req.body;

      const completion =
        await openai.chat.completions.create({

          model:
            "deepseek/deepseek-chat-v3-0324:free",

          messages: [

            {
              role: "system",

              content:
                "You are Electron Hub AI Assistant.",
            },

            {
              role: "user",

              content:
                message,
            },
          ],
      });

      res.json({

        success: true,

        reply:
          completion.choices[0]
            .message.content,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          error.message,
      });
    }
  }
);

app.listen(3001, () => {

  console.log(
    "AI server running on port 3001"
  );
});
