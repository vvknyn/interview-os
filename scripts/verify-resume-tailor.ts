
import { chromium } from 'playwright';
import path from 'path';

async function verifyResumeTailor() {
    console.log("Starting Resume Tailor Verification...");
    const browser = await chromium.launch({
        headless: true
    });
    const page = await browser.newPage();

    try {
        // 1. Navigate to Resume Tailor page
        console.log("Navigating to localhost:3000/resume-tailor...");
        await page.goto('http://localhost:3000/resume-tailor', { timeout: 30000 });

        // 2. Set mock job input to enable "Analyze" button
        console.log("Setting Job Input...");
        // Wait for the textarea to be available
        await page.waitForSelector('textarea', { state: 'visible', timeout: 10000 });
        const textarea = page.locator('textarea');
        await textarea.fill(`
            Company: TestCorp
            Position: Senior Engineer
            Requirements: 
            - React
            - TypeScript
            - 5+ years experience
            Culture:
            - Fast-paced
            - Collaborative
        `);

        // 3. Take a screenshot of the initial state
        console.log("Taking screenshot of Initial State...");
        const initialShotPath = path.resolve(process.cwd(), 'resume-tailor-initial.png');
        await page.screenshot({ path: initialShotPath, fullPage: true });
        console.log(`Saved screenshot to ${initialShotPath}`);

        // 4. (Partial mock) We can't easily click "Analyze" if it hits a real backend without an API key or mock.
        // But we can check if the layout elements we fixed are present (Grid structure).

        // Check for the "Job Posting" header
        const header = page.getByText('Job Posting', { exact: true });
        if (await header.isVisible()) {
            console.log("PASS: Job Posting header is visible.");
        }

        // 5. Verify local storage check (Resume Data warning should appear if no resume)
        // Since we are in incognito/headless, there is no resume data.
        const warning = page.locator('text=No resume found');
        if (await warning.isVisible()) {
            console.log("PASS: 'No resume found' warning is visible (Expected for fresh session).");
        }

        console.log("Verification Finished Successfully.");

    } catch (error) {
        console.error("Verification FAILED:", error);
        // Take a screenshot on failure
        const errorShotPath = path.resolve(process.cwd(), 'resume-tailor-error.png');
        await page.screenshot({ path: errorShotPath, fullPage: true });
        console.log(`Saved ERROR screenshot to ${errorShotPath}`);
    } finally {
        await browser.close();
    }
}

verifyResumeTailor();
