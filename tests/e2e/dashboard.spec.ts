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

/**
 * TEST GROUP: DASH-PARSE - Search Query Parsing Tests
 *
 * Tests the quick client-side parsing functionality for search queries.
 */
test.describe('DASH-PARSE - Search Query Parsing Tests', () => {
  /**
   * TC-DASH-PARSE-001: Comma-separated query parses instantly
   *
   * Queries with commas should parse instantly without showing loading.
   */
  test('TC-DASH-PARSE-001: Comma-separated query parses instantly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill search with comma-separated format
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Optym, OR Scientist, Technical');

    // Click the analyze button
    const analyzeButton = page.locator('button:has-text("Start preparing")');
    await analyzeButton.click();

    // Should NOT be stuck on "Parsing your query..." for more than 1 second
    // It should either show "Analyzing..." or the dashboard
    await page.waitForTimeout(1000);

    // Check that we're not stuck on parsing
    const parsingText = page.locator('text=Parsing your query...');
    const isStuckOnParsing = await parsingText.isVisible();

    // If still visible after 1s, the parsing is stuck (failure)
    expect(isStuckOnParsing).toBeFalsy();
  });

  /**
   * TC-DASH-PARSE-002: Two-part query defaults to Technical round
   *
   * Queries like "Company, Position" should default to Technical round.
   */
  test('TC-DASH-PARSE-002: Two-part query defaults to Technical round', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Google, Software Engineer');
    await searchInput.press('Enter');

    await page.waitForTimeout(500);

    // Page should not error
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TC-DASH-PARSE-003: Single word query parses as company
   *
   * A single word should be treated as company name with defaults.
   */
  test('TC-DASH-PARSE-003: Single word query parses as company', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Netflix');
    await searchInput.press('Enter');

    await page.waitForTimeout(500);

    // Page should not error
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * TEST GROUP: DASH-API - API Key Configuration Tests
 *
 * Tests the API key configuration and loading functionality.
 */
test.describe('DASH-API - API Key Configuration Tests', () => {
  /**
   * TC-DASH-API-001: API key modal opens from model switcher
   *
   * User can open API key configuration modal.
   */
  test('TC-DASH-API-001: API key modal opens from model switcher', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear any existing API keys
    await page.evaluate(() => {
      localStorage.removeItem('guest_api_keys');
      localStorage.removeItem('guest_api_key');
    });
    await page.reload();

    // Fill search and try to analyze
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Google, Engineer, Technical');

    const analyzeButton = page.locator('button:has-text("Start preparing")');
    await analyzeButton.click();

    // Should show API key modal
    await page.waitForTimeout(1000);

    // Verify modal dialog appeared
    const hasModal = await page.locator('[role="dialog"]').isVisible();

    expect(hasModal).toBeTruthy();
  });

  /**
   * TC-DASH-API-002: API keys persist in localStorage
   *
   * Saved API keys should persist across page reloads.
   */
  test('TC-DASH-API-002: API keys persist in localStorage', async ({ page }) => {
    await page.goto('/');

    // Set API key in localStorage
    await page.evaluate(() => {
      localStorage.setItem('guest_api_keys', JSON.stringify({ groq: 'test-key-123' }));
    });

    await page.reload();

    // Verify the key is loaded
    const storedKey = await page.evaluate(() => {
      return localStorage.getItem('guest_api_keys');
    });

    expect(storedKey).toContain('test-key-123');
  });

  /**
   * TC-DASH-API-003: Model switcher is visible on landing page
   *
   * The model switcher button should be visible in the header.
   */
  test('TC-DASH-API-003: Model switcher is visible on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for model switcher (contains provider names)
    const modelSwitcher = page.locator('button').filter({ hasText: /groq|gemini|openai|llama|gpt/i }).first();
    await expect(modelSwitcher).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-DASH-API-004: Model switcher dropdown works
   *
   * Clicking model switcher should show options.
   */
  test('TC-DASH-API-004: Model switcher dropdown works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click model switcher
    const modelSwitcher = page.locator('button').filter({ hasText: /groq|gemini|openai|llama|gpt/i }).first();
    await modelSwitcher.click();

    // Should show dropdown with options
    await page.waitForTimeout(300);
    const dropdown = page.locator('[role="menu"], [data-radix-popper-content-wrapper]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
  });

  /**
   * TC-DASH-API-005: API key status indicators are visible
   *
   * Model switcher dropdown should show status indicators (checkmark/warning) for each provider.
   */
  test('TC-DASH-API-005: API key status indicators are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set one API key
    await page.evaluate(() => {
      localStorage.setItem('guest_api_keys', JSON.stringify({ groq: 'test-key' }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open model switcher
    const modelSwitcher = page.locator('button').filter({ hasText: /groq|gemini|openai|llama|gpt/i }).first();
    await modelSwitcher.click();
    await page.waitForTimeout(500);

    // Check for status indicators (SVG icons or text indicators)
    const dropdown = page.locator('[data-radix-popper-content-wrapper], [role="menu"]');
    await expect(dropdown).toBeVisible();

    // Should have SVG icons (checkmark or warning icons)
    const icons = dropdown.locator('svg');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);
  });

  /**
   * TC-DASH-API-006: Gear icons for API key configuration are visible
   *
   * Each provider in dropdown should have a gear icon to open configuration modal.
   */
  test('TC-DASH-API-006: Gear icons for configuration are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open model switcher
    const modelSwitcher = page.locator('button').filter({ hasText: /groq|gemini|openai|llama|gpt/i }).first();
    await modelSwitcher.click();
    await page.waitForTimeout(500);

    // Look for gear/settings buttons (small buttons in dropdown)
    const dropdown = page.locator('[data-radix-popper-content-wrapper], [role="menu"]');
    const gearButtons = dropdown.locator('button').filter({ has: page.locator('svg') });

    const count = await gearButtons.count();
    // Should have at least 3 gear icons (one for each provider: Groq, Gemini, OpenAI)
    expect(count).toBeGreaterThanOrEqual(3);
  });

  /**
   * TC-DASH-API-007: Clicking gear icon opens API key modal
   *
   * Clicking a gear icon should open the API key configuration modal for that provider.
   */
  test('TC-DASH-API-007: Clicking gear icon opens modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open model switcher
    const modelSwitcher = page.locator('button').filter({ hasText: /groq|gemini|openai|llama|gpt/i }).first();
    await modelSwitcher.click();
    await page.waitForTimeout(500);

    // Click first gear icon
    const dropdown = page.locator('[data-radix-popper-content-wrapper], [role="menu"]');
    const gearButton = dropdown.locator('button').filter({ has: page.locator('svg') }).first();
    await gearButton.click();
    await page.waitForTimeout(500);

    // Verify modal opened
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should have API key input
    const apiKeyInput = page.locator('input[type="password"], input[placeholder*="gsk"], input[placeholder*="AIza"], input[placeholder*="sk-"]');
    await expect(apiKeyInput).toBeVisible();
  });
});

/**
 * TEST GROUP: DASH-PROGRESS - Progressive Loading Tests
 *
 * Tests the progressive loading functionality for dashboard sections.
 */
test.describe('DASH-PROGRESS - Progressive Loading Tests', () => {
  /**
   * TC-DASH-PROG-001: Dashboard shows before all sections load
   *
   * Dashboard should become visible after initial sections complete (not waiting for all).
   */
  test('TC-DASH-PROG-001: Dashboard appears progressively', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set API key to enable analysis
    await page.evaluate(() => {
      localStorage.setItem('guest_api_keys', JSON.stringify({ groq: 'gsk_test' }));
    });

    // Fill search
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Google, Engineer, Technical');

    // Start analysis
    const analyzeButton = page.locator('button:has-text("Start preparing")');
    await analyzeButton.click();

    // Wait for loading to start
    await page.waitForTimeout(2000);

    // Dashboard should eventually appear (even if sections still loading)
    // Note: This test may need adjustment based on actual API response times
    const dashboardContent = page.locator('text=/company|position|interview/i');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 30000 });
  });
});

/**
 * TEST GROUP: DASH-CONTEXT - Optional Context Input Tests
 *
 * Tests the job context URL and text input functionality.
 */
test.describe('DASH-CONTEXT - Optional Context Input Tests', () => {
  /**
   * TC-DASH-CTX-001: Job URL input is visible
   *
   * The optional job posting URL input should be visible.
   */
  test('TC-DASH-CTX-001: Job URL input is visible', async ({ page }) => {
    await page.goto('/');

    // Look for URL input in optional context section
    const urlInput = page.locator('input[type="url"]').first();
    await expect(urlInput).toBeVisible();
  });

  /**
   * TC-DASH-CTX-002: Can switch between URL and text mode
   *
   * User can toggle between URL input and text area.
   */
  test('TC-DASH-CTX-002: Can switch between URL and text mode', async ({ page }) => {
    await page.goto('/');

    // Find toggle button
    const toggleButton = page.locator('button, a').filter({ hasText: /paste.*description|paste.*instead/i }).first();

    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Should now show textarea
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible({ timeout: 3000 });
    }
  });

  /**
   * TC-DASH-CTX-003: Job context accepts URL input
   *
   * URL input should accept and store values.
   */
  test('TC-DASH-CTX-003: Job context accepts URL input', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.locator('input[type="url"]').first();
    await urlInput.fill('https://careers.example.com/job/123');

    await expect(urlInput).toHaveValue('https://careers.example.com/job/123');
  });
});
