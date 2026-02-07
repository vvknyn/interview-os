import * as cheerio from "cheerio";
import { checkUrlSafety, checkContentSafety } from "@/lib/url-safety";

const FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache"
};

export async function fetchUrlContent(url: string): Promise<{ data?: string; title?: string; error?: string }> {
    try {
        if (!url) return { error: "No URL provided" };

        // Safety check on URL
        const urlCheck = checkUrlSafety(url);
        if (!urlCheck.safe) return { error: urlCheck.reason };

        const response = await fetch(url, { headers: FETCH_HEADERS });

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

        // Content safety check
        const contentCheck = checkContentSafety(rawText);
        if (!contentCheck.safe) return { error: contentCheck.reason };

        // Simple check for valid content length
        if (rawText.length < 50) {
            return { error: "Could not retrieve sufficient content from this link. Please paste the text directly." };
        }

        // Limit length to avoid token limits (increased to 12k for better context)
        const truncated = rawText.substring(0, 12000);

        return { data: truncated, title };

    } catch (e: unknown) {
        console.error("Fetch URL Error:", e);
        return { error: "Unable to crawl this link. Please paste the content directly." };
    }
}

const ASSET_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz|mp3|mp4|webm|avi|mov)$/i;

export async function discoverLinks(url: string): Promise<{ links: { url: string; title: string }[]; error?: string }> {
    try {
        const urlCheck = checkUrlSafety(url);
        if (!urlCheck.safe) return { links: [], error: urlCheck.reason };

        const parsed = new URL(url);
        const baseDomain = parsed.hostname;

        const response = await fetch(url, { headers: FETCH_HEADERS });
        if (!response.ok) return { links: [], error: "Could not access URL" };

        const html = await response.text();
        const $ = cheerio.load(html);

        const seen = new Set<string>();
        seen.add(parsed.href.replace(/#.*$/, '')); // skip the original URL
        const results: { url: string; title: string }[] = [];

        $('a[href]').each((_, el) => {
            if (results.length >= 20) return false;

            const href = $(el).attr('href');
            if (!href) return;

            try {
                const resolved = new URL(href, url);
                // Same domain only
                if (resolved.hostname !== baseDomain) return;
                // Strip fragment
                resolved.hash = '';
                const canonical = resolved.href;

                if (seen.has(canonical)) return;
                // Skip assets
                if (ASSET_EXTENSIONS.test(resolved.pathname)) return;
                // Skip mailto/tel/javascript
                if (/^(mailto|tel|javascript):/i.test(href)) return;

                seen.add(canonical);
                const linkTitle = $(el).text().trim().substring(0, 100) || canonical;
                results.push({ url: canonical, title: linkTitle });
            } catch {
                // skip invalid URLs
            }
        });

        return { links: results };
    } catch (e: unknown) {
        console.error("Discover Links Error:", e);
        return { links: [], error: "Failed to discover links" };
    }
}
