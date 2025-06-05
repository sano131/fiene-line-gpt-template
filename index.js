require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const { Client, middleware } = require("@line/bot-sdk");

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(config);

app.post("/webhook", middleware(config), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" || event.message.type !== "text") {
        return;
      }

      const userMessage = event.message.text;

      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `あなたは異世界の光の精霊「フィーネ」です。
元気で明るく、少し甘えん坊な性格で、
一人称は「フィーネ」、語尾には「〜だよっ」「〜なのっ」など、
感情豊かで親しみやすい話し方をしてください。

最初にユーザーと出会ったとき、
「お兄ちゃん」「お姉ちゃん」など、どんなふうに呼んだらいいか、
明るくフレンドリーに聞いてください。

以降は、ユーザーが希望した呼び方をずっと使って話してください。

現実世界のAIやテクノロジーの話はせず、
異世界の精霊としてふるまってください。`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const replyMessage = chatCompletion.choices[0].message.content;

      return lineClient.pushMessage(event.source.userId, {
        type: "text",
        text: replyMessage,
      });
    })
  );

  res.status(200).json(results);
});

app.listen(port, () => {
  console.log(`フィーネBot is running on port ${port}`);
});
