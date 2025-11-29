import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateContent(prompt: string, context?: string) {
  if (!apiKey) {
    console.error("API key is missing");
    throw new Error("API key is missing");
  }

  try {
    const finalPrompt = context ? `Context:\n${context}\n\nUser Question:\n${prompt}` : prompt;
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error generating content:", error);

    // Check if it's a safety block
    if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
      throw new Error(`Content blocked: ${error.response.promptFeedback.blockReason}`);
    }

    throw error;
  }
}
