// Domain patterns known to host unsafe/explicit content
const BLOCKED_DOMAIN_PATTERNS: RegExp[] = [
    // Explicit TLDs
    /\.xxx$/i,
    /\.porn$/i,
    /\.sex$/i,
    /\.adult$/i,
    /\.sexy$/i,
    /\.xxx\./i,
    // Major explicit sites
    /pornhub\./i,
    /xvideos\./i,
    /xnxx\./i,
    /xhamster\./i,
    /redtube\./i,
    /youporn\./i,
    /tube8\./i,
    /spankbang\./i,
    /xtube\./i,
    /porntrex\./i,
    /eporner\./i,
    /hqporner\./i,
    /beeg\./i,
    /txxx\./i,
    /fapvid\./i,
    /thumbzilla\./i,
    /pornpics\./i,
    /rule34\./i,
    /gelbooru\./i,
    /e-hentai\./i,
    /nhentai\./i,
    /hanime\./i,
    /hentaihaven\./i,
    /cam4\./i,
    /chaturbate\./i,
    /livejasmin\./i,
    /stripchat\./i,
    /bongacams\./i,
    /myfreecams\./i,
    /onlyfans\./i,
    /fansly\./i,
    /manyvids\./i,
    /clips4sale\./i,
];

// Word-boundary keyword patterns for detecting explicit content
const UNSAFE_CONTENT_KEYWORDS: RegExp[] = [
    /\bpornograph(y|ic)\b/i,
    /\bexplicit\s+sexual\b/i,
    /\bhardcore\s+sex\b/i,
    /\bxxx\s+video/i,
    /\badult\s+content\b/i,
    /\bnude\s+photos?\b/i,
    /\bnaked\s+girls?\b/i,
    /\bnaked\s+women\b/i,
    /\bfull\s+nude\b/i,
    /\berotic\s+video\b/i,
    /\bhentai\b/i,
    /\bescort\s+service/i,
    /\bsex\s+worker/i,
    /\bstrip\s*club/i,
    /\badult\s+entertainment\b/i,
    /\blive\s*cam\s*girl/i,
    /\bwebcam\s+model/i,
    /\bnsfw\s+content\b/i,
    /\bxxx\s+pics?\b/i,
    /\bfetish\s+porn\b/i,
    /\bmilf\b/i,
    /\bhooker\b/i,
    /\bsexcam\b/i,
    /\bcamgirl\b/i,
    /\bonly\s*fans\s+leak/i,
];

export interface SafetyResult {
    safe: boolean;
    reason?: string;
}

export function checkUrlSafety(url: string): SafetyResult {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        for (const pattern of BLOCKED_DOMAIN_PATTERNS) {
            if (pattern.test(hostname)) {
                return {
                    safe: false,
                    reason: "This URL has been blocked for safety reasons",
                };
            }
        }

        return { safe: true };
    } catch {
        return { safe: false, reason: "Invalid URL" };
    }
}

export function checkContentSafety(content: string): SafetyResult {
    const lower = content.toLowerCase();
    let matchCount = 0;

    for (const pattern of UNSAFE_CONTENT_KEYWORDS) {
        if (pattern.test(lower)) {
            matchCount++;
        }
        if (matchCount >= 3) {
            return {
                safe: false,
                reason: "Content blocked: unsafe material detected",
            };
        }
    }

    return { safe: true };
}

export function checkContentSafetyStrict(content: string): SafetyResult {
    const lower = content.toLowerCase();

    for (const pattern of UNSAFE_CONTENT_KEYWORDS) {
        if (pattern.test(lower)) {
            return {
                safe: false,
                reason: "Content blocked: unsafe material detected",
            };
        }
    }

    return { safe: true };
}
