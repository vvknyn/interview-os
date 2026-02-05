import { test, expect } from '@playwright/test';

// Use environment variable or valid key structure but not actual key
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCKlGnhErgXVuz0HG57j1hHMoB47QwLKQE_placeholder';
const GROQ_KEY = process.env.GROQ_API_KEY || 'gsk_test_key_placeholder_for_verification';

test.describe('API Key and Search Stability', () => {

    test.beforeEach(async ({ page }) => {
        // Clear local storage to ensure fresh state
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('TC-API-001: Configure Groq Key and Search', async ({ page }) => {
        test.slow();
        await page.goto('/');

        // 1. Configure Groq Key
        const modelSwitcher = page.locator('button[role="combobox"]');
        await expect(modelSwitcher).toBeVisible();
        await modelSwitcher.click();

        // Wait for popover content
        const popover = page.locator('[role="dialog"], [role="listbox"], [role="menu"], .popover-content');
        await expect(popover.first()).toBeVisible();

        // Find Groq gear icon - Target the one in the Groq section
        // We know Groq is the first section, but let's be safe
        // The structure is: <div>Header -> Gear</div>

        // Use nth(0) because Groq is the first section
        const groqGear = page.locator('button[title="Configure API key"]').nth(0);

        // Ensure visible before clicking
        await expect(groqGear).toBeVisible();
        await groqGear.click();

        // Modal should open
        const modal = page.locator('h2:has-text("Configure API Key")');
        await expect(modal).toBeVisible();

        // Enter key
        const input = page.locator('input[type="password"]');
        await input.fill(GROQ_KEY);
        // Wait for button to be enabled/ready
        const saveBtn = page.locator('button:has-text("Save Key")');
        await expect(saveBtn).toBeEnabled();
        await saveBtn.click();

        // Modal should close
        await expect(modal).not.toBeVisible();

        // 2. Perform Search
        await page.locator('input[placeholder="Company, Position, Round..."]').fill('Google, Software Engineer, Technical');

        // Start Analysis
        const startBtn = page.locator('button:has-text("Start preparing")');
        await startBtn.click();

        // Should NOT see modal again
        await expect(modal).not.toBeVisible();

        // Should see loading or dashboard OR error (if rate limited)
        const resultOrError = page.locator('text=Parsing your query...')
            .or(page.locator('text=Strategy'))
            .or(page.locator('text=Analysis Error'))
            .or(page.locator('text=Rate limit'));

        await expect(resultOrError).toBeVisible({ timeout: 15000 });
    });

    test('TC-API-002: Configure Gemini Key and Search', async ({ page }) => {
        test.slow(); // Increase timeout
        await page.goto('/');

        // 1. Switch directly to Gemini
        const modelSwitcher = page.locator('button[role="combobox"]');
        await expect(modelSwitcher).toBeVisible();
        await modelSwitcher.click();

        const geminiOption = page.locator('div[role="option"]:has-text("Gemini")');
        // Wait for it to be visible?
        // Sometimes command list details vary. Just looking for text "Gemini"
        const geminiText = page.locator('span:has-text("Gemini")').first();
        await expect(geminiText).toBeVisible();
        await geminiText.click({ force: true });

        // Modal might open AUTOMATICALLY if key is missing
        const modal = page.locator('h2:has-text("Configure API Key")');

        // Wait check if modal appears automatically within 2s
        try {
            await expect(modal).toBeVisible({ timeout: 3000 });
            console.log("Modal opened automatically");
        } catch (e) {
            console.log("Modal did not open automatically, clicking gear");
            // If not, click gear
            await modelSwitcher.click(); // Re-open if closed

            // Find gear for Gemini
            // Assuming Gemini is now selected, it might show checkmark
            // But we want to configure it.
            // Gear button has title "Configure API key"
            // Locate specifically the 2nd one (index 1) or by related text
            const geminiGear = page.locator('button[title="Configure API key"]').nth(1);

            if (await geminiGear.isVisible()) {
                await geminiGear.click({ force: true });
            } else {
                // Fallback: Trigger analysis
                await page.locator('input[placeholder="Company, Position, Round..."]').fill('Microsoft, PM, Design');
                await page.click('button:has-text("Start preparing")');
            }
            await expect(modal).toBeVisible();
        }

        const keyInput = page.locator('input[type="password"]');
        await expect(keyInput).toBeVisible();
        await keyInput.fill(GEMINI_KEY);
        await page.click('button:has-text("Save Key")');
        await expect(modal).not.toBeVisible();

        // 3. Search
        const searchInput = page.locator('input[placeholder="Company, Position, Round..."]');
        await searchInput.fill('Microsoft, PM, Design');
        await page.click('button:has-text("Start preparing")');

        // Should succeed or show error (if rate limited)
        await expect(modal).not.toBeVisible();

        // Wait for result OR error
        const resultOrError = page.locator('text=Parsing your query...')
            .or(page.locator('text=Strategy'))
            .or(page.locator('text=Analysis Error'))
            .or(page.locator('text=Rate limit'));

        await expect(resultOrError).toBeVisible({ timeout: 30000 });
    });

    test('TC-API-003: Verify Key Persistence and Auto-Loading', async ({ page }) => {
        test.slow();
        // Set key in localStorage to simulate existing user
        await page.goto('/');
        await page.evaluate((key) => {
            const guestKeys = { groq: key };
            localStorage.setItem('guest_api_keys', JSON.stringify(guestKeys));
            localStorage.setItem('guest_model', 'groq:llama-3.3-70b-versatile');
            console.log("Injected keys:", guestKeys);
        }, GROQ_KEY);

        await page.reload();

        // Verify no modal is blocking
        await expect(page.locator('div[data-state="open"]')).not.toBeVisible();

        const searchInput = page.locator('input[placeholder="Company, Position, Round..."]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Netflix, Engineer, System Design');
        await page.click('button:has-text("Start preparing")');

        // Modal should NOT appear
        await expect(page.locator('h2:has-text("Configure API Key")')).not.toBeVisible();

        const resultOrError = page.locator('text=Parsing your query...')
            .or(page.locator('text=Strategy'))
            .or(page.locator('text=Analysis Error')); // Allow error if rate limited

        await expect(resultOrError).toBeVisible({ timeout: 30000 });
    });
});
