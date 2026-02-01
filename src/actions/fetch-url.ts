import * as cheerio from "cheerio";

export async function fetchUrlContent(url: string): Promise<{ data?: string; title?: string; error?: string }> {
    try {
        if (!url) return { error: "No URL provided" };

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache"
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
        const rawText = $('body').text().replace(/\s+/g, " ").trim();
        const title = $('title').text().trim() || url;

        // Simple check for valid content length
        if (rawText.length < 50) {
            return { error: "Could not retrieve sufficient content from this link. Please paste the text directly." };
        }

        // Limit length to avoid token limits (increased to 12k for better context)
        const truncated = rawText.substring(0, 12000);

        return { data: truncated, title };

    } catch (e: any) {
        console.error("Fetch URL Error:", e);
        return { error: "Unable to crawl this link. Please paste the content directly." };
    }
}
