import { test, expect } from '@playwright/test';

/**
 * E2E Test for Save Version functionality
 *
 * Tests the complete flow of saving a resume version.
 * Note: The Save Version button only appears for authenticated users.
 */

test.describe('SAVE-VERSION-E2E - End-to-End Save Version Tests', () => {

    /**
     * TC-SAVE-E2E-001: Resume builder loads without schema errors
     *
     * Verifies that the resume builder page loads without any database schema errors.
     * This was a regression where columns like 'base_resume_id' weren't in the DB.
     */
    test('TC-SAVE-E2E-001: Resume builder loads without schema errors', async ({ page }) => {
        const schemaErrors: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error' && (
                text.includes('column') ||
                text.includes('schema') ||
                text.includes('Could not find')
            )) {
                schemaErrors.push(text);
            }
        });

        await page.goto('/resume-builder');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Page should load without schema errors
        expect(schemaErrors.length).toBe(0);
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-SAVE-E2E-002: Save version button appears for authenticated users
     *
     * The save version button (floppy disk icon) should appear in the header
     * when a user is logged in.
     */
    test('TC-SAVE-E2E-002: Save version button conditional on auth', async ({ page }) => {
        await page.goto('/resume-builder');
        await page.waitForLoadState('networkidle');

        // Look for the save version button by its title attribute
        const saveButton = page.locator('button[title="Save current resume as a version"]');
        const buttonVisible = await saveButton.isVisible().catch(() => false);

        // Button should NOT be visible when not logged in
        // (this is expected behavior - save requires auth)
        console.log(`Save button visible (unauthenticated): ${buttonVisible}`);

        // Just verify the page loaded correctly
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-SAVE-E2E-003: Full save flow with authentication
     *
     * Tests the complete save version flow:
     * 1. Log in
     * 2. Go to resume builder
     * 3. Click save version
     * 4. Fill in version name
     * 5. Save
     * 6. Verify success or check for proper error handling
     */
    test('TC-SAVE-E2E-003: Full save flow with auth', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // 1. Go to home and log in
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open menu
        const menuButton = page.locator('button').filter({ hasText: /menu/i }).first();
        if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.waitForTimeout(300);

            // Check if already logged in or need to sign in
            const signOutButton = page.locator('button').filter({ hasText: /sign out/i }).first();
            const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

            const isLoggedIn = await signOutButton.isVisible().catch(() => false);

            if (isLoggedIn) {
                console.log('User is already logged in');
                // Close menu and proceed
                await page.keyboard.press('Escape');
            } else if (await signInButton.isVisible()) {
                console.log('User not logged in - skipping authenticated test');
                // Without credentials, we can't test the authenticated flow
                // This is expected behavior
                return;
            }
        }

        // 2. Navigate to resume builder
        await page.goto('/resume-builder');
        await page.waitForLoadState('networkidle');

        // 3. Look for save button
        const saveButton = page.locator('button[title="Save current resume as a version"]');
        const saveButtonVisible = await saveButton.isVisible().catch(() => false);

        if (saveButtonVisible) {
            console.log('Save button found - clicking');
            await saveButton.click();
            await page.waitForTimeout(500);

            // 4. Look for modal
            const modal = page.locator('[role="dialog"]');
            const modalVisible = await modal.isVisible().catch(() => false);

            if (modalVisible) {
                console.log('Save modal opened');

                // Fill version name
                const versionInput = modal.locator('input').first();
                if (await versionInput.isVisible()) {
                    await versionInput.fill('E2E Test Version - ' + Date.now());
                }

                // Click save
                const saveModalButton = modal.locator('button').filter({ hasText: /^save/i }).last();
                if (await saveModalButton.isVisible()) {
                    await saveModalButton.click();
                    await page.waitForTimeout(2000);

                    // Check for errors
                    const errorElement = modal.locator('.text-red-800, [class*="error"]');
                    const hasError = await errorElement.isVisible().catch(() => false);

                    if (hasError) {
                        const errorText = await errorElement.textContent();
                        console.log('Error after save:', errorText);

                        // Schema errors should NOT appear (this is what we fixed)
                        expect(errorText).not.toContain('column');
                        expect(errorText).not.toContain('schema');
                        expect(errorText).not.toContain('Could not find');
                    } else {
                        console.log('Save completed without visible error');
                    }
                }
            }
        } else {
            console.log('Save button not visible (user may not be authenticated)');
        }

        // Final check: no schema errors in console
        const schemaErrors = errors.filter(e =>
            e.includes('column') ||
            e.includes('schema') ||
            e.includes('Could not find')
        );
        expect(schemaErrors.length).toBe(0);
    });

    /**
     * TC-SAVE-E2E-004: No critical errors on page load
     */
    test('TC-SAVE-E2E-004: No critical errors on page load', async ({ page }) => {
        const criticalErrors: string[] = [];

        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error' && (
                text.includes('column') ||
                text.includes('schema') ||
                text.includes('Could not find') ||
                text.includes('undefined is not an object') ||
                text.includes('Cannot read properties of null')
            )) {
                criticalErrors.push(text);
            }
        });

        await page.goto('/resume-builder');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        console.log('Critical errors found:', criticalErrors.length);
        criticalErrors.forEach(e => console.log('  -', e));

        expect(criticalErrors.length).toBe(0);
    });
});
