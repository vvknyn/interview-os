"use server";

import { StarStory } from "@/types";
import { generateGenericJSON } from "@/actions/generate-context";
import { ProviderConfig } from "@/lib/llm/types";

/**
 * Parsed story with confidence metadata
 */
export interface ParsedStory extends StarStory {
    confidence: number;
    parseNotes?: string;
    suggestedTags?: string[];
}

/**
 * Result from AI story parsing
 */
export interface ParseStoriesResult {
    stories: ParsedStory[];
    totalFound: number;
    warnings: string[];
}

/**
 * AI-powered parsing of a text blob into multiple STAR stories
 *
 * This is the magic: user dumps their experiences, AI extracts structured stories
 */
export async function parseStoriesFromText(
    text: string,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: ParseStoriesResult; error?: string }> {
    try {
        if (!text || text.trim().length < 50) {
            return { error: "Please provide more text. We need at least a paragraph to extract stories." };
        }

        const prompt = `
You are an expert career coach who helps people identify and structure their professional stories for behavioral interviews.

TASK: Analyze the following text and extract ALL distinct professional stories, experiences, or achievements. Convert each into the STAR format.

TEXT TO ANALYZE:
"""
${text.substring(0, 12000)}
"""

INSTRUCTIONS:
1. **Find Stories**: Look for any mention of:
   - Projects completed
   - Problems solved
   - Achievements or wins
   - Challenges overcome
   - Leadership moments
   - Team collaborations
   - Process improvements
   - Metrics or results
   - Learning experiences
   - Conflicts resolved

2. **For Each Story**, extract:
   - **title**: A catchy 3-6 word title (e.g., "Scaled Payment System 10x")
   - **situation**: The context/background (2-3 sentences)
   - **task**: The specific responsibility or goal (1-2 sentences)
   - **action**: What actions were taken (3-5 sentences, be specific)
   - **result**: The outcome, ideally with metrics (2-3 sentences)
   - **confidence**: 0-100 score for how complete this story is
   - **parseNotes**: Any notes about what's missing or assumed
   - **suggestedTags**: 2-4 relevant tags (e.g., "leadership", "technical", "conflict-resolution")

3. **Be Generous**: If you see even a hint of a story, extract it. Partial stories are valuable too.

4. **Don't Invent**: Only use information present in the text. If parts are missing, note it in parseNotes.

5. **Merge Similar**: If the same story is mentioned multiple times, combine into one comprehensive version.

RETURN VALID JSON:
{
    "stories": [
        {
            "id": "story-1",
            "title": "Catchy Story Title",
            "type": "star",
            "situation": "The context...",
            "task": "My responsibility was...",
            "action": "I took the following actions...",
            "result": "This resulted in...",
            "confidence": 85,
            "parseNotes": "Result metrics were not specified",
            "suggestedTags": ["leadership", "technical"]
        }
    ],
    "totalFound": 3,
    "warnings": ["Some stories lacked specific metrics", "Dates were not provided for most experiences"]
}

IMPORTANT:
- Generate unique IDs like "story-1", "story-2", etc.
- Set type to "star" for all stories
- If a section is truly missing, write a placeholder like "[Not specified - add details]"
- Be thorough - users often undersell their experiences
`;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result || !result.stories) {
            return { error: "Could not parse stories from the text. Please try with more detailed content." };
        }

        // Validate and sanitize the parsed stories
        const stories: ParsedStory[] = (result.stories || []).map((story: any, idx: number) => ({
            id: story.id || `story-${idx + 1}`,
            title: story.title || `Story ${idx + 1}`,
            type: 'star' as const,
            situation: story.situation || "",
            task: story.task || "",
            action: story.action || "",
            result: story.result || "",
            confidence: Math.min(100, Math.max(0, Number(story.confidence) || 70)),
            parseNotes: story.parseNotes || undefined,
            suggestedTags: Array.isArray(story.suggestedTags) ? story.suggestedTags : [],
            deleted: false
        }));

        const warnings: string[] = Array.isArray(result.warnings) ? result.warnings : [];

        // Add automatic warnings
        if (stories.length === 0) {
            warnings.unshift("No distinct stories could be identified. Try adding more specific experiences.");
        }

        const lowConfidenceCount = stories.filter(s => s.confidence < 70).length;
        if (lowConfidenceCount > 0) {
            warnings.push(`${lowConfidenceCount} story/stories have low confidence and may need more details.`);
        }

        return {
            data: {
                stories,
                totalFound: result.totalFound || stories.length,
                warnings
            }
        };
    } catch (e: any) {
        console.error("[ParseStories] Error:", e);
        return { error: e.message || "Failed to parse stories" };
    }
}

/**
 * Enhance a single story with AI (fill in gaps, improve wording)
 */
export async function enhanceStory(
    story: StarStory,
    additionalContext?: string,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: StarStory; error?: string }> {
    try {
        const prompt = `
You are a career coach helping improve a STAR story for behavioral interviews.

CURRENT STORY:
Title: ${story.title}
Situation: ${story.situation || "[Missing]"}
Task: ${story.task || "[Missing]"}
Action: ${story.action || "[Missing]"}
Result: ${story.result || "[Missing]"}

${additionalContext ? `ADDITIONAL CONTEXT FROM USER:\n${additionalContext}` : ""}

TASK: Improve this story by:
1. Filling in any missing sections with reasonable placeholders based on context
2. Making the language more impactful and specific
3. Adding action verbs and quantifiable results where possible
4. Keeping authenticity - don't invent facts, just improve presentation

Return JSON:
{
    "title": "Improved title if needed",
    "situation": "Enhanced situation...",
    "task": "Enhanced task...",
    "action": "Enhanced action...",
    "result": "Enhanced result..."
}
`;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result) {
            return { error: "Failed to enhance story" };
        }

        return {
            data: {
                ...story,
                title: result.title || story.title,
                situation: result.situation || story.situation,
                task: result.task || story.task,
                action: result.action || story.action,
                result: result.result || story.result
            }
        };
    } catch (e: any) {
        console.error("[EnhanceStory] Error:", e);
        return { error: e.message || "Failed to enhance story" };
    }
}

/**
 * Convert a free-text blob story into STAR format
 */
export async function convertBlobToStar(
    content: string,
    title?: string,
    configOverride?: Partial<ProviderConfig>
): Promise<{ data?: StarStory; error?: string }> {
    try {
        if (!content || content.trim().length < 20) {
            return { error: "Content too short to convert" };
        }

        const prompt = `
Convert this free-text story into STAR format for behavioral interviews.

TEXT:
"""
${content.substring(0, 3000)}
"""

Extract and structure into:
- **Situation**: The context/background
- **Task**: The specific responsibility
- **Action**: What was done (be specific)
- **Result**: The outcome (include metrics if mentioned)

Also generate a catchy title (3-6 words).

Return JSON:
{
    "title": "Catchy Title Here",
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "..."
}
`;

        const result = await generateGenericJSON(prompt, configOverride);

        if (!result) {
            return { error: "Failed to convert to STAR format" };
        }

        return {
            data: {
                id: crypto.randomUUID(),
                title: result.title || title || "Untitled Story",
                type: 'star',
                situation: result.situation || "",
                task: result.task || "",
                action: result.action || "",
                result: result.result || ""
            }
        };
    } catch (e: any) {
        console.error("[ConvertBlobToStar] Error:", e);
        return { error: e.message || "Failed to convert story" };
    }
}
