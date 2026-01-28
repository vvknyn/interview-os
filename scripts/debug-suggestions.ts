
import { getSuggestions } from "../src/lib/search-suggestions";

const testQueries = ["Goo", "Am", "Soft", ""];
const history = ["Netflix"];

console.log("Testing Search Suggestions Logic:");

testQueries.forEach(q => {
    const results = getSuggestions(q, history);
    console.log(`Query: "${q}" -> ${results.length} suggestions`);
    if (results.length > 0) {
        console.log(results.map(r => `  - [${r.type}] ${r.text}`).join("\n"));
    }
});
