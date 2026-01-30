"use server";

import Groq from "groq-sdk";

export async function transcribeAudio(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("Server configuration error: GROQ_API_KEY missing");
        }

        const groq = new Groq({
            apiKey: apiKey,
        });

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo", // or whisper-large-v3 for higher accuracy
            response_format: "json",
            language: "en",
            temperature: 0.0,
        });

        return { text: transcription.text };
    } catch (error: any) {
        console.error("Transcription error:", error);
        return { error: error.message || "Failed to transcribe audio" };
    }
}
