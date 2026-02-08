import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// We test the unpdf extraction directly (avoids Next.js server action context)
// This validates the core logic that extractPDFText uses

async function extractPDFText(fileBase64: string): Promise<{ text?: string; error?: string }> {
    try {
        if (!fileBase64 || fileBase64.length < 100) {
            return { error: "Invalid PDF data received. Please try uploading again." };
        }

        let uint8: Uint8Array;
        try {
            const buffer = Buffer.from(fileBase64, 'base64');
            const header = buffer.slice(0, 5).toString('ascii');
            if (!header.startsWith('%PDF')) {
                return { error: "The file does not appear to be a valid PDF. Please check the file format." };
            }
            uint8 = new Uint8Array(buffer);
        } catch {
            return { error: "Failed to process PDF file. The file may be corrupted." };
        }

        const { extractText } = await import('unpdf');

        let pages: string[];
        let totalPages: number;
        try {
            const result = await extractText(uint8);
            pages = result.text;
            totalPages = result.totalPages;
        } catch (parseError: unknown) {
            const msg = (parseError as Error).message || '';
            if (/password/i.test(msg)) {
                return { error: "This PDF is password-protected. Please unlock it or paste the text directly." };
            }
            if (/encrypt/i.test(msg)) {
                return { error: "This PDF is encrypted. Please use an unencrypted version or paste the text directly." };
            }
            return { error: `Could not parse PDF: ${msg}. Please try pasting the content directly.` };
        }

        const rawText = pages.join('\n\n');

        if (!rawText || rawText.trim().length < 20) {
            return {
                error: "No text could be extracted from this PDF. It may be an image-based/scanned document. Please paste your resume text instead."
            };
        }

        const cleanedText = rawText
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return { text: cleanedText };
    } catch (e: unknown) {
        const errorMsg = (e as Error).message || "Unknown error";
        return { error: `Failed to extract text from PDF: ${errorMsg}. Please try pasting the content directly.` };
    }
}

// Helper: create a minimal valid PDF with given text content
function createTestPDF(textLines: string[]): string {
    const textOps = textLines.map((line, i) =>
        `${i === 0 ? '' : `0 -18 Td\n`}(${line}) Tj`
    ).join('\n');

    const streamContent = `BT\n/F1 11 Tf\n72 720 Td\n${textOps}\nET`;
    const streamLength = Buffer.byteLength(streamContent);

    const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000278 00000 n
0000000528 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
610
%%EOF`;
    return Buffer.from(pdf).toString('base64');
}

describe('PDF Text Extraction (unpdf)', () => {

    it('extracts text from a simple PDF', async () => {
        const base64 = createTestPDF([
            'John Doe - Software Engineer',
            'Experience: 10 years in web development',
            'Skills: TypeScript, React, Node.js',
        ]);

        const result = await extractPDFText(base64);
        assert.ok(!result.error, `Should not error: ${result.error}`);
        assert.ok(result.text, 'Should return text');
        assert.ok(result.text.includes('John Doe'), 'Should contain name');
        assert.ok(result.text.includes('Software Engineer'), 'Should contain title');
        assert.ok(result.text.includes('TypeScript'), 'Should contain skills');
    });

    it('extracts multi-line resume content', async () => {
        const base64 = createTestPDF([
            'Jane Smith',
            'Senior Product Manager',
            'jane.smith@example.com',
            'San Francisco, CA',
            'Professional Summary',
            'Experienced PM with 8 years in SaaS',
        ]);

        const result = await extractPDFText(base64);
        assert.ok(!result.error, `Should not error: ${result.error}`);
        assert.ok(result.text, 'Should return text');
        assert.ok(result.text.includes('Jane Smith'), 'Contains name');
        assert.ok(result.text.includes('Senior Product Manager'), 'Contains role');
        assert.ok(result.text.includes('jane.smith@example.com'), 'Contains email');
    });

    it('rejects empty or too-short base64 input', async () => {
        const result = await extractPDFText('abc');
        assert.ok(result.error, 'Should return error');
        assert.ok(result.error.includes('Invalid PDF data'), 'Correct error message');
    });

    it('rejects non-PDF file data', async () => {
        // Create a base64 string that's long enough but not a PDF
        const fakeData = Buffer.from('This is not a PDF file. '.repeat(10)).toString('base64');
        const result = await extractPDFText(fakeData);
        assert.ok(result.error, 'Should return error');
        assert.ok(result.error.includes('does not appear to be a valid PDF'), 'Correct error message');
    });

    it('rejects an empty PDF (no extractable text)', async () => {
        // Create a PDF with only whitespace
        const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >> endobj
4 0 obj << /Length 0 >>
stream

endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000226 00000 n
trailer << /Size 5 /Root 1 0 R >>
startxref
280
%%EOF`;
        const base64 = Buffer.from(pdf).toString('base64');
        const result = await extractPDFText(base64);
        assert.ok(result.error, 'Should return error for empty PDF');
        assert.ok(result.error.includes('No text could be extracted') || result.error.includes('Could not parse'), 'Correct error type');
    });

    it('cleans up excessive whitespace', async () => {
        const base64 = createTestPDF([
            'Name:    John    Doe',
            'Role:    Engineer',
        ]);

        const result = await extractPDFText(base64);
        assert.ok(!result.error, `Should not error: ${result.error}`);
        assert.ok(result.text, 'Should return text');
        // Horizontal whitespace should be collapsed
        assert.ok(!result.text.includes('    '), 'Should not have excessive spaces');
    });

    it('handles valid base64 that decodes to a large enough PDF', async () => {
        const lines = [];
        for (let i = 0; i < 20; i++) {
            lines.push(`Line ${i + 1}: This is a test resume line with enough content.`);
        }
        const base64 = createTestPDF(lines);

        const result = await extractPDFText(base64);
        assert.ok(!result.error, `Should not error: ${result.error}`);
        assert.ok(result.text, 'Should return text');
        assert.ok(result.text.length > 100, 'Should have substantial content');
    });
});
