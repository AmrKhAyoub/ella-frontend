// app/api/chat/route.ts
import { streamText, convertToModelMessages } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_AMR,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter("google/gemma-4-26b-a4b-it:free"),
    system:
      "You are a helpful assistant. You must respond using only plain text. Do not use Markdown, bolding, bullet points, headings, or any other formatting characters even astericks.",
    messages: await convertToModelMessages(messages),
  });

  // Use this for standard text streaming
  return result.toUIMessageStreamResponse();
}