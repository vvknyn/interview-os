"use server";

import { ProviderFactory } from "@/lib/llm/providers";
import { ProviderConfig } from "@/lib/llm/types";
import { fetchProfile } from "@/actions/profile";

const processEnv = process.env;

// Helper to get configuration (same approach as generate-context.ts)
const getConfig = async (override?: Partial<ProviderConfig>) => {
    try {
        // 1. Check Override first (for guest users)
        if (override?.apiKey && override?.provider) {
            return {
                apiKey: override.apiKey,
                provider: override.provider,
                model: override.model || (override.provider === 'gemini' ? 'gemini-1.5-flash' : 'llama-3.3-70b-versatile')
            };
        }

        const { data } = await fetchProfile();

        // Parse preferred_model for provider:model format
        const rawModel = override?.model || data?.preferred_model || "groq:llama-3.3-70b-versatile";
        let provider: 'groq' | 'gemini' | 'openai' = 'groq';
        let model = rawModel;

        if (rawModel.includes(':')) {
            const parts = rawModel.split(':');
            provider = parts[0] as any;
            model = parts.slice(1).join(':');
        } else {
            provider = 'groq';
            model = rawModel || "llama-3.3-70b-versatile";
        }

        // Handle API Key
        let apiKey = "";

        // 1. Try JSON stored in DB custom_api_key
        if (data?.custom_api_key?.trim().startsWith('{')) {
            try {
                const keys = JSON.parse(data.custom_api_key);
                apiKey = keys[provider];
            } catch (e) {
                console.warn("Failed to parse API keys JSON", e);
            }
        }

        // 2. Legacy fallback
        if (!apiKey && data?.custom_api_key && !data.custom_api_key.trim().startsWith('{')) {
            if (provider === 'groq') apiKey = data.custom_api_key;
        }

        // 3. Environment fallback
        if (!apiKey) {
            if (provider === 'groq') apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY || "";
            if (provider === 'gemini') apiKey = processEnv.GEMINI_API_KEY || processEnv.NEXT_PUBLIC_GEMINI_API_KEY || "";
            if (provider === 'openai') apiKey = processEnv.OPENAI_API_KEY || processEnv.NEXT_PUBLIC_OPENAI_API_KEY || "";
        }

        if (!apiKey) throw new Error(`Missing API Key for ${provider}. Please configure it in Settings.`);

        return { apiKey, provider, model };
    } catch (e: unknown) {
        const apiKey = processEnv.GROQ_API_KEY || processEnv.NEXT_PUBLIC_GROQ_API_KEY;
        if (!apiKey) throw new Error("Critical: No API Key available. " + (e instanceof Error ? e.message : ""));
        return { apiKey, provider: 'groq' as const, model: "llama-3.3-70b-versatile" };
    }
};

// Generate professional summary
export async function generateSummary(params: {
    role: string;
    yearsExperience: number;
    keySkills: string[];
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ summary?: string; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const prompt = `
            Write a professional resume summary for someone with this background:
            - Target Role: ${params.role}
            - Years of Experience: ${params.yearsExperience}
            - Key Skills: ${params.keySkills.join(', ')}

            WRITE IN A POLISHED, PROFESSIONAL FAANG STYLE:

            1. LENGTH: Write 3-4 complete sentences

            2. TONE: Confident, precise, and technical - like a senior engineer at Google or Meta
               - Direct and assertive, not hedging
               - Focus on scope, scale, and measurable impact
               - Technical credibility with business awareness

            3. AVOID:
               - Clichés: "Results-driven", "Passionate", "Dynamic", "Motivated"
               - Buzzwords: "proven track record", "leveraging", "synergies", "innovative solutions"
               - Vague claims without specifics
               - Overly casual language

            4. STRUCTURE:
               - Sentence 1: Core identity + years of experience + technical focus area
               - Sentence 2: Scope and scale of work (systems built, users served, team size)
               - Sentence 3: Specific technical strengths or notable achievements
               - Sentence 4: What you're looking for (optional)

            EXCELLENT EXAMPLES (FAANG-STYLE):

            "Senior software engineer with 7 years of experience building high-throughput distributed systems. At Meta, I architected the real-time analytics pipeline processing 2M events/second and led a team of 5 engineers on the ads delivery infrastructure. Deep expertise in Java, Kafka, and large-scale data systems. Seeking a staff-level role focused on platform infrastructure."

            "Full-stack engineer with 5 years specializing in consumer-facing products at scale. Most recently at Stripe, I owned the merchant dashboard serving 500K businesses and led the React migration that improved page load times by 60%. Strong background in TypeScript, GraphQL, and building products that balance technical excellence with user experience."

            "Engineering manager with 8 years of experience, including 3 years leading teams at Amazon. Built and scaled a 12-person team responsible for the order fulfillment platform handling $50M in daily transactions. Track record of shipping complex projects on time while developing senior engineers through mentorship and technical leadership."

            BAD EXAMPLES (DO NOT WRITE LIKE THIS):

            "Results-driven software engineer with a proven track record of delivering innovative solutions."
            "Passionate technologist who leverages cutting-edge tools to drive business outcomes."
            "Highly motivated team player seeking to utilize my skills in a dynamic environment."

            Return ONLY the summary text. No labels, quotes, or formatting.
        `;

        const response = await provider.generate({ prompt });

        if (response.error) {
            return { error: response.error };
        }

        return { summary: response.text?.trim() || "" };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Generate Summary Error:", error);
        return { error: error.message || "Failed to generate summary" };
    }
}

// Generate experience bullet points
export async function generateExperienceBullets(params: {
    role: string;
    company: string;
    description: string;
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ bullets?: string[]; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const prompt = `
            Enhance this work experience into polished resume bullet points using the STAR framework:

            Role: ${params.role}
            Company: ${params.company}
            Their notes/existing content: ${params.description}

            === CRITICAL: PRESERVE THE USER'S CONTENT ===

            The user has provided their own description above. Your job is to ENHANCE it, not replace it.

            - KEEP all specific technical details they mentioned (technologies, tools, frameworks, numbers)
            - KEEP their metrics and achievements exactly as stated
            - KEEP the projects and work they described
            - ADD structure using the STAR framework
            - ADD context and flow to make it read better
            - EXPAND brief points into fuller sentences
            - DO NOT invent new projects or achievements they didn't mention
            - DO NOT change their numbers or metrics
            - DO NOT remove technical specifics to make it more "general"

            === HOW TO HANDLE DIFFERENT INPUT TYPES ===

            IF the user provided detailed bullet points:
            → Polish the wording, add STAR structure, but keep 90% of their content intact
            → Example: "Built API using Node.js, reduced latency 40%" → Expand into full STAR sentence keeping "Node.js" and "40%"

            IF the user provided rough notes or fragments:
            → Transform into complete sentences while preserving ALL technical details they mentioned
            → Example: "worked on payment system, stripe integration, PCI compliance" → Full bullets about Stripe, PCI, payment work

            IF the user provided very little:
            → Generate reasonable content based on role/company, but keep it conservative and realistic
            → Don't invent impressive metrics - use qualitative descriptions instead

            === STAR FRAMEWORK (WEAVE NATURALLY INTO EACH BULLET) ===

            Each bullet point should weave together these elements naturally:
            - SITUATION: What was the context, challenge, or problem?
            - TASK: What was your specific responsibility or goal?
            - ACTION: What did YOU specifically do? (Be detailed about your approach)
            - RESULT: What was the measurable outcome or impact?

            === FORMAT REQUIREMENTS ===

            1. GENERATE 4-5 BULLET POINTS
            2. EACH BULLET SHOULD BE 35-50 WORDS (verbose and detailed, not short fragments)
            3. Write in a flowing, narrative style - not choppy phrases

            === WRITING STYLE - FAANG/BIG TECH PROFESSIONAL ===

            Write like a senior engineer at Google, Meta, or Amazon would write their resume.
            Professional, precise, impactful - but not robotic or full of corporate jargon.

            KEY CHARACTERISTICS:
            - Confident and direct, not hedging or overly humble
            - Technical depth with clear business impact
            - Quantified results with specific metrics
            - Shows ownership and scope of influence
            - Demonstrates system-level thinking

            SENTENCE PATTERNS (vary these):

            Pattern A - Impact-first:
            "Reduced [metric] by [X]% by designing and implementing [specific solution] for [system/product]"

            Pattern B - Scale + Technical:
            "Architected [system] handling [scale: QPS, users, data volume] using [technologies], enabling [business outcome]"

            Pattern C - Leadership + Delivery:
            "Led [X]-person team to deliver [project] on [timeline], resulting in [measurable impact]"

            Pattern D - Problem → Solution → Impact:
            "Identified [bottleneck/issue] in [system], redesigned [component] using [approach], improving [metric] from [X] to [Y]"

            Pattern E - Ownership:
            "Owned end-to-end [feature/system] serving [scale], from technical design through launch, achieving [outcome]"

            === THINGS TO INCLUDE ===

            - Specific technologies, architectures, and technical decisions
            - Scale: QPS, DAU/MAU, data volume, team size, budget
            - Precise metrics: latency (p50, p99), throughput, availability, cost savings
            - Scope of ownership and decision-making authority
            - Cross-functional collaboration with specific teams (PM, Data Science, SRE)
            - Business impact tied to technical work

            === AVOID ===

            - Overused words: "Spearheaded", "Leveraged", "Utilized", "Synergy"
            - Vague claims without specifics
            - Overly casual language ("pretty much", "kind of", "worked on stuff")
            - Generic statements that don't differentiate you

            === EXCELLENT EXAMPLES (FAANG-STYLE) ===

            "Architected and implemented a distributed caching layer using Redis Cluster, reducing API latency p99 from 850ms to 120ms and handling 50K QPS at peak load for the checkout service serving 12M monthly active users."

            "Led a team of 4 engineers to redesign the notification delivery pipeline, migrating from a polling-based system to event-driven architecture with Kafka, reducing infrastructure costs by $180K annually while improving delivery reliability from 94% to 99.7%."

            "Owned the search ranking algorithm improvements for the discovery feed, collaborating with ML engineers to implement real-time personalization that increased user engagement by 18% and click-through rate by 31% based on A/B testing across 5M users."

            "Identified and resolved a critical memory leak in the core payment processing service that was causing cascading failures during traffic spikes. Implemented circuit breakers and improved monitoring, eliminating the P0 incidents that had been occurring weekly."

            "Designed and built an internal developer platform that automated environment provisioning, reducing new engineer onboarding time from 3 days to 4 hours and enabling 200+ developers to self-serve staging deployments."

            === BAD EXAMPLES (DO NOT WRITE LIKE THIS) ===

            "Worked on various backend services" (too vague, no impact)
            "Helped improve system performance" (no ownership, no metrics)
            "Was responsible for the payment system" (passive, no achievements)
            "Utilized microservices architecture to deliver solutions" (buzzwordy, no specifics)

            Return ONLY a JSON object:
            { "bullets": ["First detailed bullet point here", "Second detailed bullet point here", ...] }
        `;

        const response = await provider.generate({
            prompt,
            json: true,
            system: "You are a senior tech recruiter who has reviewed thousands of FAANG resumes. CRITICAL: Preserve all technical details, metrics, and specifics the user provided - enhance their content, don't replace it. Write in the polished, precise style of a Google/Meta engineer's resume - confident, technical, impact-focused. Each bullet should be 30-45 words. Return ONLY valid JSON."
        });

        if (response.error) {
            return { error: response.error };
        }

        try {
            const parsed = JSON.parse(response.text || "{}");
            return { bullets: parsed.bullets || [] };
        } catch (parseError) {
            // Fallback: try to extract bullets from plain text
            const lines = response.text?.split('\n').filter(line => line.trim().length > 0) || [];
            return { bullets: lines.slice(0, 5) };
        }
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Generate Experience Bullets Error:", error);
        return { error: error.message || "Failed to generate bullet points" };
    }
}

// Improve existing text with AI
export async function improveResumeText(params: {
    text: string;
    section: 'summary' | 'experience' | 'skills';
    configOverride?: Partial<ProviderConfig>;
}): Promise<{ improved?: string; error?: string }> {
    try {
        const config = await getConfig(params.configOverride);
        const provider = ProviderFactory.getProvider(config.provider, config.apiKey, config.model);

        const sectionGuidance = {
            summary: `
                - Write 3-4 natural sentences that sound like a real person
                - Start with a concrete fact, not "Results-driven" or "Passionate"
                - Be specific about actual experience and skills
                - Avoid corporate buzzwords and AI-sounding phrases
            `,
            experience: `
                - Each bullet should be 15-30 words, telling a mini-story
                - Vary sentence starters - don't begin every line the same way
                - Include specific details: technologies, team sizes, realistic metrics
                - Avoid "Leveraged", "Spearheaded", "Utilized" and similar overused words
                - Show thinking and context: why did this matter?
            `,
            skills: `
                - Group skills logically by category
                - Be specific (e.g., "PostgreSQL" not just "databases")
                - Include proficiency context where relevant
                - Don't list everything - focus on what's most relevant
            `
        };

        const prompt = `
            Improve this resume ${params.section} section while keeping it sounding HUMAN and NATURAL:

            Original text:
            ${params.text}

            KEY REQUIREMENTS:
            ${sectionGuidance[params.section]}

            AVOID THESE AI RED FLAGS:
            - Generic phrases like "proven track record", "innovative solutions"
            - Buzzwords: "synergy", "leverage", "spearhead", "drive results"
            - Suspiciously round percentages (50%, 100% improvement)
            - Starting every sentence with the same structure
            - Vague claims without specific details

            INSTEAD:
            - Be specific and concrete
            - Use varied sentence structures
            - Include realistic details and metrics
            - Write like a real person describing their work to a colleague
            - Preserve the original meaning and facts, just make them clearer

            Return ONLY the improved text. No labels, explanations, or "Here's the improved version".
        `;

        const response = await provider.generate({ prompt });

        if (response.error) {
            return { error: response.error };
        }

        return { improved: response.text?.trim() || "" };
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Improve Resume Text Error:", error);
        return { error: error.message || "Failed to improve text" };
    }
}
