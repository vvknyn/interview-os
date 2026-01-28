"use server";

export async function fetchUrlContent(url: string): Promise<{ data?: string; error?: string }> {
    try {
        if (!url) return { error: "No URL provided" };

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            return { error: `Failed to fetch URL: ${response.statusText}` };
        }

        const html = await response.text();

        // Simple regex to strip HTML tags and scripts
        // Ideally we'd use a parser, but this avoids heavy dependencies for now as per plan
        const text = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        // Limit length to avoid token limits
        const truncated = text.substring(0, 8000);

        return { data: truncated };
    } catch (e: any) {
        console.error("Fetch URL Error:", e);
        return { error: e.message || "Failed to fetch URL content" };
    }
}
