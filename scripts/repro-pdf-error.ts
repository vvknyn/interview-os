
// @ts-ignore
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
// import pdfParse from 'pdf-parse'; // Fails

async function testPdfParsing() {
    try {
        console.log("Generating test PDF...");
        // Generate valid PDF content
        const doc = new jsPDF();
        doc.text("Hello World! This is a test resume.", 10, 10);
        doc.text("Experience: Software Engineer at Google.", 10, 20);
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        const testFilePath = path.join(process.cwd(), 'test-resume.pdf');
        fs.writeFileSync(testFilePath, pdfBuffer);
        console.log(`Saved test PDF to ${testFilePath} (Size: ${pdfBuffer.length} bytes)`);

        console.log("Attempting to parse PDF using require()...");

        // Debug require structure
        let pdfParse;
        try {
            pdfParse = require('pdf-parse');
            console.log("Require success. Type:", typeof pdfParse);
            console.log("Keys:", Object.keys(pdfParse));
            if (typeof pdfParse !== 'function' && pdfParse.default) {
                console.log("Using .default export");
                pdfParse = pdfParse.default;
            }
        } catch (e) {
            console.error("Require failed:", e);
            throw e;
        }

        if (pdfParse.PDFParse) {
            console.log("Found PDFParse class in exports");
            const PDFParseClass = pdfParse.PDFParse;
            const parser = new PDFParseClass({ data: pdfBuffer });
            const result = await parser.getText();
            data = { text: result.text || "" };
        } else {
            // Fallback for v1 or unexpected structure
            data = await pdfParse(pdfBuffer);
        }

        console.log("Success! Parsed text:");
        console.log(data.text);

        if (data.text.includes("Hello World")) {
            console.log("Verification PASSED");
        } else {
            console.error("Verification FAILED: Text mismatch");
        }

    } catch (e) {
        console.error("Parsing Parsing ERROR:", e);
    }
}

testPdfParsing();
