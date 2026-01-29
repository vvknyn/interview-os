"use server";

import * as cheerio from "cheerio";

export async function fetchUrlContent(url: string): Promise<{ data?: string; error?: string }> {
    try {
        if (!url) return { error: "No URL provided" };

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        if (!response.ok) {
            return { error: "Could not access this link. Please paste the content directly." };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and other non-content elements
        $('script, style, noscript, iframe, svg, header, footer, nav').remove();

        // Extract text from body
        const text = $('body').text().replace(/\s+/g, " ").trim();

        // Simple check for valid content length
        if (text.length < 50) {
            return { error: "Could not retrieve sufficient content from this link. Please paste the text directly." };
        }

        // Limit length to avoid token limits (increased to 12k for better context)
        const truncated = text.substring(0, 12000);

        return { data: truncated };
    } catch (e: any) {
        console.error("Fetch URL Error:", e);
        return { error: "Unable to crawl this link. Please paste the content directly." };
    }
}
