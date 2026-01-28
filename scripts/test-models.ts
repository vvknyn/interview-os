
import Groq from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Fallback if .env.local isn't picked up by dotenv default (sometimes needs path)
const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in environment variables.");
    process.exit(1);
}

const modelsToTest = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
];

async function testModels() {
    console.log(`🔑 Testing with API Key: ${apiKey.substring(0, 8)}...`);
    const groq = new Groq({ apiKey });

    for (const modelName of modelsToTest) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: "Hello, world!" }],
                model: modelName,
            });
            const text = completion.choices[0]?.message?.content;

            if (text) {
                console.log(`✅ SUCCESS: ${modelName} is available!`);
                console.log(`   Response: ${text.substring(0, 50)}...`);
                // Stop at the first working model as requested "find the best model" - usually list is ordered by preference
                return;
            }
        } catch (e: any) {
            let msg = e.message;
            if (msg.includes("404")) msg = "404 Not Found (Model not available)";
            else if (msg.includes("429")) msg = "429 Rate Limit Exceeded";
            else if (msg.includes("401")) msg = "401 Unauthorized";
            console.log(`❌ FAILED: ${modelName} - ${msg}`);
        }
    }
    console.log("\n❌ All models failed.");
}

testModels();
