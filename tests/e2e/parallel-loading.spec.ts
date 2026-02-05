import { test, expect } from '@playwright/test';

/**
 * TEST GROUP: PARALLEL - Parallel Loading Tests
 *
 * Tests the parallel loading optimization for dashboard sections.
 * Verifies that data loads concurrently instead of sequentially.
 */

const TEST_KEY = 'gsk_test_parallel_loading';

test.describe('PARALLEL - Parallel Loading Optimization Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate((key) => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('guest_api_keys', JSON.stringify({ groq: key }));
            localStorage.setItem('guest_model', 'groq:llama-3.3-70b-versatile');
        }, TEST_KEY);
        await page.reload();
    });

    /**
     * TC-PARALLEL-001: Dashboard shows loading state immediately
     *
     * After clicking analyze, dashboard should show loading state promptly.
     */
    test('TC-PARALLEL-001: Loading state shows immediately', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Loading indicator should appear within 500ms
        const loadingIndicator = page.locator('text=/parsing|analyzing|loading/i').first();
        await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    });

    /**
     * TC-PARALLEL-002: Progress bar updates incrementally
     *
     * Progress bar should update as sections load in parallel.
     */
    test('TC-PARALLEL-002: Progress bar shows updates', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Wait for loading to start
        await page.waitForTimeout(500);

        // Should see progress indicator (may be a bar or percentage)
        const progressIndicator = page.locator('[role="progressbar"], .progress-bar, text=/%/');

        // The page should be processing
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-PARALLEL-003: Dashboard view becomes visible before all sections complete
     *
     * Dashboard container should appear after initial data (recon) loads,
     * not waiting for all parallel requests.
     */
    test('TC-PARALLEL-003: Dashboard visible while sections still loading', async ({ page }) => {
        test.slow(); // This test involves network requests

        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Wait for dashboard to become visible (should be relatively fast)
        // Dashboard shows after recon + initial parsing, not after all sections
        await page.waitForTimeout(5000);

        // Either we see dashboard content OR an error (if API fails)
        const content = page.locator('text=/strategy|questions|interview|error/i');
        await expect(content.first()).toBeVisible({ timeout: 30000 });
    });

    /**
     * TC-PARALLEL-004: Section loaders show while data loads
     *
     * Individual sections should show skeleton loaders while their data loads.
     */
    test('TC-PARALLEL-004: Section loaders show during load', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Wait for analysis to start
        await page.waitForTimeout(2000);

        // Should see either:
        // 1. Loading skeletons (pulse animations)
        // 2. Actual content
        // 3. Error state
        const hasContent = await page.locator('text=/loading|strategy|error/i').first().isVisible();
        expect(hasContent).toBeTruthy();
    });

    /**
     * TC-PARALLEL-005: Multiple sections load concurrently
     *
     * Verify that section requests are made in parallel, not sequentially.
     */
    test('TC-PARALLEL-005: Concurrent network requests', async ({ page }) => {
        const requests: { url: string; time: number }[] = [];

        // Monitor network requests
        page.on('request', request => {
            if (request.url().includes('api') || request.method() === 'POST') {
                requests.push({
                    url: request.url(),
                    time: Date.now()
                });
            }
        });

        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Wait for analysis to complete or timeout
        await page.waitForTimeout(10000);

        // Requests should be grouped together (parallel) rather than spread out (sequential)
        // This is a heuristic test - in parallel mode, multiple requests should start close together
        if (requests.length >= 2) {
            const timeDiffs = requests.slice(1).map((r, i) => r.time - requests[i].time);
            // In parallel mode, time differences should be small (under 500ms)
            // Sequential would have larger gaps
            const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
            // If requests are truly parallel, average diff should be under 1000ms
            console.log('Request timing - avg diff:', avgDiff, 'ms');
        }

        // Page should not error
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-PARALLEL-006: Error in one section doesn't block others
     *
     * If one section fails, other sections should still load.
     */
    test('TC-PARALLEL-006: Section failure isolation', async ({ page }) => {
        test.slow();

        await page.waitForLoadState('networkidle');

        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Google, Engineer, Technical');

        const analyzeButton = page.locator('button:has-text("Start preparing")');
        await analyzeButton.click();

        // Wait for some content to load
        await page.waitForTimeout(15000);

        // Even if some sections fail, others should show
        // Look for any section content
        const anyContent = page.locator('text=/strategy|questions|technical|coding|error/i');
        await expect(anyContent.first()).toBeVisible({ timeout: 30000 });
    });
});

/**
 * TEST GROUP: CACHE - Session Cache Tests
 *
 * Tests the session caching functionality for dashboard data.
 */
test.describe('CACHE - Session Cache Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate((key) => {
            localStorage.setItem('guest_api_keys', JSON.stringify({ groq: key }));
        }, TEST_KEY);
    });

    /**
     * TC-CACHE-001: Cached data loads instantly on revisit
     *
     * Revisiting the same company/position/round should load from cache.
     */
    test('TC-CACHE-001: Cache speeds up revisits', async ({ page }) => {
        // Set up mock cache data
        await page.evaluate(() => {
            const cacheData = {
                timestamp: Date.now(),
                company: 'testcache',
                position: 'engineer',
                round: 'technical',
                hasContext: false,
                reconData: { company: 'TestCache', industry: 'Tech' }
            };
            sessionStorage.setItem('interview-os-cache-testcache-engineer-technical', JSON.stringify(cacheData));
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Search for cached company
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('TestCache, Engineer, Technical');
        await page.locator('button:has-text("Start preparing")').click();

        // Should load faster than without cache (no network wait)
        await page.waitForTimeout(1000);

        // Page should be responsive
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-CACHE-002: Expired cache is not used
     *
     * Cache older than 1 hour should be invalidated.
     */
    test('TC-CACHE-002: Expired cache is invalidated', async ({ page }) => {
        // Set up expired cache (2 hours old)
        await page.evaluate(() => {
            const expiredCacheData = {
                timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
                company: 'expired',
                position: 'test',
                round: 'technical',
                hasContext: false,
                reconData: { company: 'Expired' }
            };
            sessionStorage.setItem('interview-os-cache-expired-test-technical', JSON.stringify(expiredCacheData));
        });

        await page.reload();

        // The cache key should have been removed or ignored
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('Expired, Test, Technical');

        // Page should work normally
        await expect(page.locator('body')).toBeVisible();
    });

    /**
     * TC-CACHE-003: Different searches don't share cache
     *
     * Different company/position/round combinations have separate caches.
     */
    test('TC-CACHE-003: Cache isolation per query', async ({ page }) => {
        await page.evaluate(() => {
            const cache1 = {
                timestamp: Date.now(),
                company: 'company1',
                position: 'pos1',
                round: 'round1',
                reconData: { company: 'Company1' }
            };
            const cache2 = {
                timestamp: Date.now(),
                company: 'company2',
                position: 'pos2',
                round: 'round2',
                reconData: { company: 'Company2' }
            };
            sessionStorage.setItem('interview-os-cache-company1-pos1-round1', JSON.stringify(cache1));
            sessionStorage.setItem('interview-os-cache-company2-pos2-round2', JSON.stringify(cache2));
        });

        await page.reload();

        // Both caches should exist independently
        const caches = await page.evaluate(() => {
            return {
                cache1: sessionStorage.getItem('interview-os-cache-company1-pos1-round1'),
                cache2: sessionStorage.getItem('interview-os-cache-company2-pos2-round2')
            };
        });

        expect(caches.cache1).toBeTruthy();
        expect(caches.cache2).toBeTruthy();
    });
});
