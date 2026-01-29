
import { analyzeJobPosting } from "../src/actions/generate-context";

async function testAnalysis() {
    const jobText = `
        We are looking for a Senior Software Engineer at Netflix to join our Core UI team.
        You will work on React, Node.js, and large scale distributed systems.
        The interview process involves a technical screen and a system design round.
    `;

    console.log("Analyzing job text...");
    const result = await analyzeJobPosting(jobText);
    console.log("Result:", JSON.stringify(result, null, 2));
}

testAnalysis();
