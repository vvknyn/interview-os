
import { getSuggestions } from "../src/lib/search-suggestions";

console.log("Running Search Autocomplete Test Suite...");

// Test 1: Basic Company Matching
const results1 = getSuggestions("Goo", []);
if (results1.some(r => r.text === "Google" && r.type === "company")) {
    console.log("PASS: Found 'Google' for 'Goo'");
} else {
    console.error("FAIL: Did not find 'Google' for 'Goo'");
}

// Test 2: Basic Role Matching
const results2 = getSuggestions("Soft", []);
if (results2.some(r => r.text === "Software Engineer" && r.type === "role")) {
    console.log("PASS: Found 'Software Engineer' for 'Soft'");
} else {
    console.error("FAIL: Did not find 'Software Engineer' for 'Soft'");
}

// Test 3: History Matching
const history = ["Netflix"];
const results3 = getSuggestions("Net", history);
if (results3.some(r => r.text === "Netflix" && r.type === "history")) {
    console.log("PASS: Found history item 'Netflix'");
} else {
    console.error("FAIL: History item missing");
}

// Test 4: Empty Query (Should show recent history)
const results4 = getSuggestions("", ["Uber"]);
if (results4.some(r => r.text === "Uber" && r.type === "history")) {
    console.log("PASS: Empty query showed history");
} else {
    console.error("FAIL: Empty query did not show history");
}

console.log("Done.");
