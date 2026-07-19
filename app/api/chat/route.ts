import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  // 1. Check if the key exists first
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 500 },
    );
  }

  // 2. Initialize the client using the environment variable
  const groq = createOpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const { messages } = await req.json();

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system:
      "You are a helpful assistant. You must respond using only plain text. Do not use Markdown, bolding, bullet points, headings, or any other formatting characters even astericks.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}