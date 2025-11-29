"use server";

import { generateContent } from "@/lib/gemini";

export async function chatWithGemini(message: string, context: string) {
    try {
        const response = await generateContent(message, context);
        return { success: true, data: response };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error.message || "Failed to generate response" };
    }
}
