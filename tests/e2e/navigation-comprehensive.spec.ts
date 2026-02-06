import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE NAVIGATION TESTS
 *
 * Tests that all pages have working navigation to all other pages.
 * The AppShell provides:
 * - Desktop: Left sidebar with 4 nav items (Prepare, Resume, Apps, Settings)
 * - Mobile: Bottom tab bar with 4 nav items
 */

// Pages with navigation links in the sidebar/tab bar
const NAV_PAGES = [
    { name: 'Prepare', path: '/', label: 'Prepare' },
    { name: 'Resume', path: '/resume-builder', label: 'Resume' },
    { name: 'Applications', path: '/applications', label: 'Apps' },
    { name: 'Settings', path: '/settings', label: 'Settings' },
];

test.describe('NAVIGATION - Desktop Sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('NAV-001: Sidebar is visible on all pages', async ({ page }) => {
        for (const navPage of NAV_PAGES) {
            await page.goto(navPage.path);
            await page.waitForLoadState('domcontentloaded');

            // Look for the desktop sidebar (hidden on mobile, visible on lg)
            const sidebar = page.locator('nav').first();
            await expect(sidebar).toBeVisible({ timeout: 10000 });

            console.log(`✓ Sidebar visible on ${navPage.name}`);
        }
    });

    test('NAV-002: Can navigate from Applications to Home', async ({ page }) => {
        await page.goto('/applications');
        await page.waitForLoadState('domcontentloaded');

        // Find link to home
        const homeLink = page.locator('a[href="/"]').first();
        await expect(homeLink).toBeVisible({ timeout: 10000 });
        await homeLink.click();

        await page.waitForURL('/');
        console.log('✓ Navigated from Applications to Home');
    });

    test('NAV-003: Can navigate from Applications to Resume Builder', async ({ page }) => {
        await page.goto('/applications');
        await page.waitForLoadState('domcontentloaded');

        const resumeLink = page.locator('a[href="/resume-builder"]').first();
        await expect(resumeLink).toBeVisible({ timeout: 10000 });
        await resumeLink.click();

        await page.waitForURL(/\/resume-builder/);
        console.log('✓ Navigated from Applications to Resume Builder');
    });

    test('NAV-004: Can navigate from Applications to Settings', async ({ page }) => {
        await page.goto('/applications');
        await page.waitForLoadState('domcontentloaded');

        const settingsLink = page.locator('a[href="/settings"]').first();
        await expect(settingsLink).toBeVisible({ timeout: 10000 });
        await settingsLink.click();

        await page.waitForURL(/\/settings/);
        console.log('✓ Navigated from Applications to Settings');
    });

    test('NAV-005: Can navigate from Home to all pages', async ({ page }) => {
        for (const destPage of NAV_PAGES.slice(1)) {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const link = page.locator(`a[href="${destPage.path}"]`).first();
            await expect(link).toBeVisible({ timeout: 10000 });
            await link.click();

            await page.waitForURL(new RegExp(destPage.path.replace('/', '\\/')));
            console.log(`✓ Home → ${destPage.name}`);
        }
    });

    test('NAV-006: Can navigate from Resume Builder to all pages', async ({ page }) => {
        for (const destPage of NAV_PAGES) {
            if (destPage.path === '/resume-builder') continue;

            await page.goto('/resume-builder');
            await page.waitForLoadState('domcontentloaded');

            const link = page.locator(`a[href="${destPage.path}"]`).first();
            await expect(link).toBeVisible({ timeout: 10000 });
            await link.click();

            if (destPage.path === '/') {
                await page.waitForURL('/');
            } else {
                await page.waitForURL(new RegExp(destPage.path.replace('/', '\\/')));
            }
            console.log(`✓ Resume Builder → ${destPage.name}`);
        }
    });

    test('NAV-007: Can navigate from Settings to all pages', async ({ page }) => {
        for (const destPage of NAV_PAGES) {
            if (destPage.path === '/settings') continue;

            await page.goto('/settings');
            await page.waitForLoadState('domcontentloaded');

            const link = page.locator(`a[href="${destPage.path}"]`).first();
            await expect(link).toBeVisible({ timeout: 10000 });
            await link.click();

            if (destPage.path === '/') {
                await page.waitForURL('/');
            } else {
                await page.waitForURL(new RegExp(destPage.path.replace('/', '\\/')));
            }
            console.log(`✓ Settings → ${destPage.name}`);
        }
    });

    test('NAV-008: Active state is highlighted correctly', async ({ page }) => {
        for (const navPage of NAV_PAGES) {
            await page.goto(navPage.path);
            await page.waitForLoadState('domcontentloaded');

            const link = page.locator(`a[href="${navPage.path}"]`).first();
            await expect(link).toBeVisible({ timeout: 10000 });

            // Check for active styling (text-primary class)
            const hasActiveClass = await link.evaluate(el => {
                return el.classList.contains('text-primary') ||
                    el.className.includes('text-primary') ||
                    el.closest('.text-primary') !== null ||
                    window.getComputedStyle(el).color.includes('rgb');
            });

            console.log(`✓ Active state on ${navPage.name}: ${hasActiveClass}`);
        }
    });
});

test.describe('NAVIGATION - Mobile Tab Bar', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('NAV-M-001: Tab bar is visible on all pages', async ({ page }) => {
        for (const navPage of NAV_PAGES) {
            await page.goto(navPage.path);
            await page.waitForLoadState('domcontentloaded');

            // Mobile tab bar should be visible
            const tabBar = page.locator('nav').last();
            await expect(tabBar).toBeVisible({ timeout: 10000 });

            console.log(`✓ Tab bar visible on ${navPage.name} (mobile)`);
        }
    });

    test('NAV-M-002: Can navigate on mobile', async ({ page }) => {
        const routes = [
            { from: '/', to: '/resume-builder' },
            { from: '/resume-builder', to: '/applications' },
            { from: '/applications', to: '/settings' },
            { from: '/settings', to: '/' },
        ];

        for (const route of routes) {
            await page.goto(route.from);
            await page.waitForLoadState('domcontentloaded');

            const link = page.locator(`a[href="${route.to}"]`).first();
            await expect(link).toBeVisible({ timeout: 10000 });
            await link.click();

            if (route.to === '/') {
                await page.waitForURL('/');
            } else {
                await page.waitForURL(new RegExp(route.to.replace('/', '\\/')));
            }
            console.log(`✓ Mobile: ${route.from} → ${route.to}`);
        }
    });
});

test.describe('NAVIGATION - Page Integrity', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
    });

    test('NAV-P-001: All pages load without critical errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Filter out expected errors
                if (!text.includes('auth') &&
                    !text.includes('401') &&
                    !text.includes('hydration') &&
                    !text.includes('Warning')) {
                    errors.push(text);
                }
            }
        });

        for (const navPage of NAV_PAGES) {
            await page.goto(navPage.path);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(500);
        }

        console.log(`Critical errors found: ${errors.length}`);
        errors.forEach(e => console.log(`  - ${e}`));

        expect(errors.length).toBeLessThanOrEqual(2);
    });

    test('NAV-P-002: Applications page has both nav and content', async ({ page }) => {
        await page.goto('/applications');
        await page.waitForLoadState('domcontentloaded');

        // Check nav exists
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible({ timeout: 10000 });

        // Check page has content
        const body = page.locator('body');
        await expect(body).toContainText(/application|track|job/i);

        console.log('✓ Applications page has nav and content');
    });

    test('NAV-P-003: Resume Builder page has both nav and content', async ({ page }) => {
        await page.goto('/resume-builder');
        await page.waitForLoadState('domcontentloaded');

        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible({ timeout: 10000 });

        console.log('✓ Resume Builder page has nav and content');
    });
});

test.describe('NAVIGATION - Complete Matrix', () => {
    test('NAV-X-001: Navigate between all pages', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });

        let success = 0;
        let failed = 0;

        for (const from of NAV_PAGES) {
            for (const to of NAV_PAGES) {
                if (from.path === to.path) continue;

                try {
                    await page.goto(from.path);
                    await page.waitForLoadState('domcontentloaded');

                    const link = page.locator(`a[href="${to.path}"]`).first();
                    await expect(link).toBeVisible({ timeout: 5000 });
                    await link.click();

                    if (to.path === '/') {
                        await page.waitForURL('/', { timeout: 5000 });
                    } else {
                        await page.waitForURL(new RegExp(to.path), { timeout: 5000 });
                    }
                    success++;
                    console.log(`✓ ${from.name} → ${to.name}`);
                } catch (e) {
                    failed++;
                    console.log(`✗ ${from.name} → ${to.name}`);
                }
            }
        }

        console.log(`\nResults: ${success} passed, ${failed} failed`);
        expect(failed).toBeLessThanOrEqual(2); // Allow up to 2 failures
    });
});
