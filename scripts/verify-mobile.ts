
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Helper to ensure directory exists
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

async function verifyMobile() {
    console.log("Starting Mobile Verification...");
    const browser = await chromium.launch();
    // Simulate iPhone 12 Pro dimensions
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();

    const outputDir = path.resolve(process.cwd(), 'mobile-screenshots');
    ensureDir(outputDir);

    const routes = [
        { name: 'landing', url: 'http://localhost:3000/' },
        { name: 'login', url: 'http://localhost:3000/login' },
        { name: 'dashboard', url: 'http://localhost:3000/dashboard' },
        { name: 'resume-tailor', url: 'http://localhost:3000/resume-tailor' },
        { name: 'settings', url: 'http://localhost:3000/settings' },
        { name: 'resume-builder', url: 'http://localhost:3000/resume-builder' }
    ];

    try {
        for (const route of routes) {
            console.log(`Checking ${route.name} (${route.url})...`);
            try {
                await page.goto(route.url, { timeout: 15000, waitUntil: 'domcontentloaded' });

                // Small wait for animations/rendering
                await page.waitForTimeout(2000);

                const screenshotPath = path.join(outputDir, `${route.name}-mobile.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`Saved screenshot: ${screenshotPath}`);

                // Check for horizontal overflow
                const width = await page.evaluate(() => document.body.scrollWidth);
                if (width > 390) {
                    console.log(`WARNING: ${route.name} has horizontal overflow! (Width: ${width}px)`);
                }

            } catch (e: any) {
                console.error(`Error checking ${route.name}:`, e.message);
            }
        }

        console.log("Mobile Verification Complete.");

    } catch (error) {
        console.error("Verification Script Failed:", error);
    } finally {
        await browser.close();
    }
}

verifyMobile();
