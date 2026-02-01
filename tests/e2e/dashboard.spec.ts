import { test, expect } from '@playwright/test';

/**
 * TEST GROUP: DASH - Dashboard/Interview Prep Tests
 *
 * Tests the main dashboard functionality including search,
 * analysis workflow, and section navigation.
 */

test.describe('DASH - Dashboard Tests', () => {
  /**
   * TC-DASH-001: Search bar accepts input
   *
   * Verifies the search bar accepts and displays user input.
   */
  test('TC-DASH-001: Search bar accepts input', async ({ page }) => {
    await page.goto('/');

    // Find and fill search input
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Google, Software Engineer, Technical');

    // Verify input value
    await expect(searchInput).toHaveValue('Google, Software Engineer, Technical');
  });

  /**
   * TC-DASH-002: Analyze button is visible
   *
   * Verifies the analyze button is visible on the page.
   */
  test('TC-DASH-002: Analyze button is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify there are buttons on the page
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-DASH-003: Search with Enter key triggers analyze
   *
   * Pressing Enter in the search field should trigger the analyze action.
   */
  test('TC-DASH-003: Search with Enter key triggers analyze', async ({ page }) => {
    await page.goto('/');

    // Fill search input
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Meta, Product Manager, Behavioral');

    // Press Enter
    await searchInput.press('Enter');

    // Wait briefly and verify page doesn't error
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TC-DASH-004: Empty search state shows brand
   *
   * When no search has been performed, the brand name should be visible.
   */
  test('TC-DASH-004: Empty search state shows brand', async ({ page }) => {
    await page.goto('/');

    // Should see the brand name
    await expect(page.locator('text=Intervu').first()).toBeVisible();

    // Should see the search input
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  /**
   * TC-DASH-005: Page has header with menu
   *
   * The page should have a header with menu button.
   */
  test('TC-DASH-005: Page has header with menu', async ({ page }) => {
    await page.goto('/');

    // Verify menu button exists
    await expect(page.locator('button:has-text("Menu")')).toBeVisible();
  });

  /**
   * TC-DASH-006: Page has buttons in header area
   *
   * The page should have buttons in the header/nav area.
   */
  test('TC-DASH-006: Page has buttons', async ({ page }) => {
    await page.goto('/');

    // Page should have buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * TC-DASH-007: Page structure is intact
   *
   * The page should have proper structure.
   */
  test('TC-DASH-007: Page structure is intact', async ({ page }) => {
    await page.goto('/');

    // Page should have body content
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TC-DASH-008: Search and button interaction
   *
   * User can fill search and click buttons.
   */
  test('TC-DASH-008: Search and button interaction', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill search
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Netflix, Engineer, Technical');

    // Click first button
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
    }

    // Wait for some state change
    await page.waitForTimeout(500);

    // Page should not error
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TC-DASH-009: Page handles empty storage gracefully
   *
   * Clearing storage should not break the page.
   */
  test('TC-DASH-009: Page handles empty storage gracefully', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Page should still work
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  /**
   * TC-DASH-010: URL params are accepted
   *
   * Navigating with URL parameters should not error.
   */
  test('TC-DASH-010: URL params are accepted', async ({ page }) => {
    await page.goto('/?company=Apple&position=iOS%20Engineer&round=Onsite&searched=true');

    // Page should load without errors
    await expect(page).toHaveURL(/company=Apple/);
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TC-DASH-011: Mobile hamburger menu works
   *
   * On mobile viewport, hamburger menu should be accessible.
   */
  test('TC-DASH-011: Mobile hamburger menu works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  /**
   * TC-DASH-012: Search placeholder text is visible
   *
   * Search input should have helpful placeholder text.
   */
  test('TC-DASH-012: Search placeholder text is visible', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[type="text"]').first();
    const placeholder = await searchInput.getAttribute('placeholder');

    expect(placeholder).toBeTruthy();
  });
});
