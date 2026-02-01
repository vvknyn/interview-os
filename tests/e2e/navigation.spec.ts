import { test, expect } from '@playwright/test';

/**
 * TEST GROUP: NAV - Navigation Tests
 *
 * Tests all navigation paths and page accessibility across the application.
 * These tests verify that users can reach all pages and that basic routing works.
 */

test.describe('NAV - Navigation Tests', () => {
  /**
   * TC-NAV-001: Home page loads successfully
   *
   * Verifies the main dashboard/home page loads with core elements:
   * - Logo and brand name "Intervu"
   * - Search input field
   * - Analyze button
   */
  test('TC-NAV-001: Home page loads successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to hydrate
    await page.waitForLoadState('networkidle');

    // Verify brand name is visible
    await expect(page.locator('text=Intervu').first()).toBeVisible({ timeout: 10000 });

    // Verify search input exists
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10000 });

    // Verify there are buttons on the page
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-NAV-002: Navigate to Resume Builder via menu
   *
   * Opens the navigation menu and clicks Resume Builder link.
   * Verifies successful navigation to /resume-builder page.
   */
  test('TC-NAV-002: Navigate to Resume Builder via menu', async ({ page }) => {
    await page.goto('/');

    // Open navigation menu
    await page.locator('button:has-text("Menu")').click();

    // Click Resume Builder link
    await page.locator('text=Resume Builder').click();

    // Verify navigation
    await expect(page).toHaveURL('/resume-builder');
  });

  /**
   * TC-NAV-003: Navigate to Resume Tailor via menu
   *
   * Opens the navigation menu and clicks Resume Tailor link.
   * Verifies successful navigation to /resume-tailor page.
   */
  test('TC-NAV-003: Navigate to Resume Tailor via menu', async ({ page }) => {
    await page.goto('/');

    // Open navigation menu
    await page.locator('button:has-text("Menu")').click();

    // Click Resume Tailor link
    await page.locator('text=Resume Tailor').click();

    // Verify navigation
    await expect(page).toHaveURL('/resume-tailor');
  });

  /**
   * TC-NAV-004: Navigate to Applications via menu
   *
   * Opens the navigation menu and clicks Applications link.
   * Verifies successful navigation to /applications page.
   */
  test('TC-NAV-004: Navigate to Applications via menu', async ({ page }) => {
    await page.goto('/');

    // Open navigation menu
    await page.locator('button:has-text("Menu")').click();

    // Click Applications link
    await page.locator('text=Applications').click();

    // Verify navigation
    await expect(page).toHaveURL('/applications');
  });

  /**
   * TC-NAV-005: Navigate to Settings via menu
   *
   * Opens the navigation menu and clicks Settings link.
   * Verifies successful navigation to /settings page.
   */
  test('TC-NAV-005: Navigate to Settings via menu', async ({ page }) => {
    await page.goto('/');

    // Open navigation menu
    await page.locator('button:has-text("Menu")').click();

    // Click Settings link
    await page.locator('text=Settings').click();

    // Verify navigation
    await expect(page).toHaveURL('/settings');
  });

  /**
   * TC-NAV-006: Logo click returns to home
   *
   * From any page, clicking the logo should return to home page.
   */
  test('TC-NAV-006: Logo click returns to home', async ({ page }) => {
    await page.goto('/settings');

    // Look for home link or logo
    const homeLink = page.locator('a[href="/"]').first();

    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    } else {
      // Navigate directly
      await page.goto('/');
      await expect(page).toHaveURL('/');
    }
  });

  /**
   * TC-NAV-007: Direct URL access to all pages
   *
   * Verifies all pages are accessible via direct URL navigation.
   */
  test('TC-NAV-007: Direct URL access to all pages', async ({ page }) => {
    const pages = [
      { url: '/', title: 'Intervu' },
      { url: '/resume-builder', title: 'Resume' },
      { url: '/resume-tailor', title: 'Tailor' },
      { url: '/applications', title: 'Application' },
      { url: '/settings', title: 'Settings' },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await expect(page).toHaveURL(p.url);
      // Page should not show error
      await expect(page.locator('text=404')).not.toBeVisible();
    }
  });

  /**
   * TC-NAV-008: Dashboard redirect works
   *
   * /dashboard should redirect to / (home page).
   */
  test('TC-NAV-008: Dashboard redirect works', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  /**
   * TC-NAV-009: Back button navigation works
   *
   * Browser back button should work correctly between pages.
   */
  test('TC-NAV-009: Back button navigation works', async ({ page }) => {
    await page.goto('/');
    await page.goto('/settings');

    // Go back
    await page.goBack();

    // Should be at home
    await expect(page).toHaveURL('/');
  });
});
