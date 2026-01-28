
import { extractPdfText } from "../src/actions/extract-pdf";

async function test() {
    try {
        console.log("Testing PDF Extraction with Minimal Valid PDF...");

        // Minimal PDF "A"
        const minimalPdf = "JVBERi0xLjAKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoyIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgMyAzXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iago1IDAgb2JqCjw8L0xlbmd0aCA4Pj5zdHJlYW0KQlQvRjEgMVRmKEEpVmpFKAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZgowMDAwMDAwMDEwIDAwMDAwIG4KMDAwMDAwMDA2MCAwMDAwMCBuCjAwMDAwMDAxMTEgMDAwMDAgbgowMDAwMDAwMjEyIDAwMDAwIG4KMDAwMDAwMDI3NyAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCAxIDAgUi9TaXplIDY+PgpzdGFydHhyZWYKMzE1CiUlRU9GCg==";

        const result = await extractPdfText(minimalPdf);
        console.log("Result:", result);

        if (!result.error) {
            console.log("✅ PDF Extraction SUCCESS!");
        } else {
            console.log("❌ PDF Extraction FAILED");
        }
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
