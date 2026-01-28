"use server";

export async function extractPdfText(base64Data: string): Promise<{ text?: string; error?: string }> {
    try {
        // Dynamic require for pdf-parse to work with Turbopack
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");

        // Remove data URI prefix if present
        const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, "");

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Clean, "base64");

        // Parse PDF
        const data = await pdfParse(buffer);

        if (!data.text || data.text.trim().length === 0) {
            return { error: "Could not extract text from PDF. The PDF might be image-based." };
        }

        return { text: data.text };
    } catch (e: any) {
        console.error("PDF extraction error:", e);
        return { error: e.message || "Failed to extract text from PDF" };
    }
}
