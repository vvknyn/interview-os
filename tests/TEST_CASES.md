# Intervu E2E Test Suite

## Overview

This test suite covers all user-facing functionality of the Intervu application using Playwright.

## Running Tests

```bash
# Install dependencies (first time only)
npm install
npx playwright install chromium

# Run all tests
npm test

# Run specific test groups
npm run test:nav       # Navigation tests
npm run test:auth      # Authentication tests
npm run test:dash      # Dashboard tests
npm run test:resume    # Resume Builder tests
npm run test:tailor    # Resume Tailor tests
npm run test:apps      # Application Tracker tests
npm run test:settings  # Settings tests
npm run test:mobile    # Mobile responsive tests

# Run with UI (visual mode)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run specific test case by ID
npx playwright test --grep "TC-NAV-001"

# Build and test (CI mode)
npm run build:test

# View test report
npm run test:report
```

---

## Test Groups & Cases

### NAV - Navigation Tests (`navigation.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-NAV-001 | Home page loads successfully |
| TC-NAV-002 | Navigate to Resume Builder via menu |
| TC-NAV-003 | Navigate to Resume Tailor via menu |
| TC-NAV-004 | Navigate to Applications via menu |
| TC-NAV-005 | Navigate to Settings via menu |
| TC-NAV-006 | Logo click returns to home |
| TC-NAV-007 | Direct URL access to all pages |
| TC-NAV-008 | Dashboard redirect works |
| TC-NAV-009 | Back button navigation works |

---

### AUTH - Authentication Tests (`auth.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-AUTH-001 | Sign in modal opens from menu |
| TC-AUTH-002 | Sign in form has all required fields |
| TC-AUTH-003 | OAuth buttons are visible |
| TC-AUTH-004 | Auth modal can be closed |
| TC-AUTH-005 | Guest mode allows access to all features |
| TC-AUTH-006 | Sign in with empty credentials shows feedback |
| TC-AUTH-007 | Password field hides input |
| TC-AUTH-008 | Menu shows sign in for unauthenticated users |

---

### DASH - Dashboard Tests (`dashboard.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-DASH-001 | Search bar accepts input |
| TC-DASH-002 | Analyze button is clickable |
| TC-DASH-003 | Search with Enter key triggers analyze |
| TC-DASH-004 | Empty search state shows initial view |
| TC-DASH-005 | Clear button resets search |
| TC-DASH-006 | Refresh button is functional |
| TC-DASH-007 | Export PDF button exists |
| TC-DASH-008 | Sidebar sections are navigable |
| TC-DASH-009 | Resume required message appears without resume |
| TC-DASH-010 | URL params restore search state |
| TC-DASH-011 | Mobile hamburger menu works |
| TC-DASH-012 | Search placeholder text is visible |

---

### RESUME - Resume Builder Tests (`resume-builder.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-RESUME-001 | Resume builder page loads |
| TC-RESUME-002 | Profile form fields are editable |
| TC-RESUME-003 | Experience section allows adding entries |
| TC-RESUME-004 | Skills section is present |
| TC-RESUME-005 | Live preview panel exists |
| TC-RESUME-006 | Export DOCX button is present |
| TC-RESUME-007 | Print/PDF button is present |
| TC-RESUME-008 | Tailor link navigates to resume-tailor |
| TC-RESUME-009 | Back navigation works |
| TC-RESUME-010 | Mobile view has edit/preview toggle |
| TC-RESUME-011 | Education section is present |
| TC-RESUME-012 | AI writing assistant button exists |
| TC-RESUME-013 | Form inputs have labels |
| TC-RESUME-014 | Clear/Reset button exists |

---

### TAILOR - Resume Tailor Tests (`resume-tailor.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-TAILOR-001 | Resume tailor page loads |
| TC-TAILOR-002 | Job URL input field exists |
| TC-TAILOR-003 | Job description textarea exists |
| TC-TAILOR-004 | Analyze button exists |
| TC-TAILOR-005 | Page handles no resume state |
| TC-TAILOR-006 | Back navigation works |
| TC-TAILOR-007 | Generate recommendations button exists |
| TC-TAILOR-008 | Save version button exists |
| TC-TAILOR-009 | Textarea accepts job description input |
| TC-TAILOR-010 | Page responsive on mobile |

---

### APPS - Application Tracker Tests (`applications.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-APPS-001 | Applications page loads |
| TC-APPS-002 | Add application button exists |
| TC-APPS-003 | Add application modal opens |
| TC-APPS-004 | Application form has company field |
| TC-APPS-005 | Application form has position field |
| TC-APPS-006 | Application form has status selector |
| TC-APPS-007 | Modal can be closed |
| TC-APPS-008 | Empty state shows helpful message |
| TC-APPS-009 | Cover letter section exists in form |
| TC-APPS-010 | Back navigation works |
| TC-APPS-011 | Page responsive on mobile |
| TC-APPS-012 | Save button exists in form |

---

### SETTINGS - Settings Page Tests (`settings.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-SETTINGS-001 | Settings page loads |
| TC-SETTINGS-002 | Tab navigation exists |
| TC-SETTINGS-003 | Stories tab is accessible |
| TC-SETTINGS-004 | Resume tab is accessible |
| TC-SETTINGS-005 | Models tab is accessible |
| TC-SETTINGS-006 | API key input exists |
| TC-SETTINGS-007 | Save button exists |
| TC-SETTINGS-008 | Back navigation works |
| TC-SETTINGS-009 | Sources tab is accessible |
| TC-SETTINGS-010 | Resume textarea accepts input |
| TC-SETTINGS-011 | Provider selection works |
| TC-SETTINGS-012 | Page responsive on mobile |

---

### MOBILE - Mobile Responsive Tests (`mobile.spec.ts`)

| Test ID | Description |
|---------|-------------|
| TC-MOBILE-001 | Home page renders correctly on mobile |
| TC-MOBILE-002 | Mobile menu is accessible |
| TC-MOBILE-003 | Resume builder mobile tabs work |
| TC-MOBILE-004 | All pages are scrollable on mobile |
| TC-MOBILE-005 | Touch targets are adequately sized |
| TC-MOBILE-006 | Forms are usable on mobile |
| TC-MOBILE-007 | Modals are mobile-friendly |
| TC-MOBILE-008 | Navigation works on mobile |

---

## Test Reports

After running tests, reports are generated in:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `playwright-report/results.json`

To view the HTML report:
```bash
npm run test:report
```

---

## CI/CD Integration

For automated testing in CI/CD pipelines:

```bash
# Build and run all tests
npm run build:test

# This will:
# 1. Build the Next.js app
# 2. Start the server
# 3. Run all E2E tests
# 4. Exit with code 0 if all pass, 1 if any fail
```

---

## Adding New Tests

1. Create test in appropriate file under `tests/e2e/`
2. Use the naming convention: `TC-{GROUP}-{NUMBER}`
3. Add JSDoc comment describing the test
4. Update this documentation

Example:
```typescript
/**
 * TC-NAV-010: New navigation test
 *
 * Description of what this test verifies.
 */
test('TC-NAV-010: New navigation test', async ({ page }) => {
  // Test implementation
});
```
