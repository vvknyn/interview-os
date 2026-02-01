#!/usr/bin/env npx ts-node

/**
 * Intervu E2E Test Runner
 *
 * This script runs the Playwright test suite and generates a report.
 * Use this to run specific test groups or all tests.
 *
 * Usage:
 *   npx ts-node scripts/run-tests.ts                    # Run all tests
 *   npx ts-node scripts/run-tests.ts --group NAV        # Run navigation tests
 *   npx ts-node scripts/run-tests.ts --group AUTH       # Run auth tests
 *   npx ts-node scripts/run-tests.ts --test TC-NAV-001  # Run specific test
 *
 * Test Groups:
 *   NAV      - Navigation tests
 *   AUTH     - Authentication tests
 *   DASH     - Dashboard tests
 *   RESUME   - Resume Builder tests
 *   TAILOR   - Resume Tailor tests
 *   APPS     - Application Tracker tests
 *   SETTINGS - Settings page tests
 *   MOBILE   - Mobile responsive tests
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_GROUPS: Record<string, string> = {
  NAV: 'navigation.spec.ts',
  AUTH: 'auth.spec.ts',
  DASH: 'dashboard.spec.ts',
  RESUME: 'resume-builder.spec.ts',
  TAILOR: 'resume-tailor.spec.ts',
  APPS: 'applications.spec.ts',
  SETTINGS: 'settings.spec.ts',
  MOBILE: 'mobile.spec.ts',
};

function parseArgs(): { group?: string; test?: string; all: boolean } {
  const args = process.argv.slice(2);
  const result: { group?: string; test?: string; all: boolean } = { all: true };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--group' && args[i + 1]) {
      result.group = args[i + 1].toUpperCase();
      result.all = false;
      i++;
    } else if (args[i] === '--test' && args[i + 1]) {
      result.test = args[i + 1];
      result.all = false;
      i++;
    }
  }

  return result;
}

function runTests(options: { group?: string; test?: string; all: boolean }): boolean {
  let command = 'npx playwright test';

  if (options.test) {
    // Run specific test by name
    command += ` --grep "${options.test}"`;
    console.log(`\n🧪 Running test: ${options.test}\n`);
  } else if (options.group) {
    // Run specific test group
    const testFile = TEST_GROUPS[options.group];
    if (!testFile) {
      console.error(`❌ Unknown test group: ${options.group}`);
      console.log(`Available groups: ${Object.keys(TEST_GROUPS).join(', ')}`);
      return false;
    }
    command += ` tests/e2e/${testFile}`;
    console.log(`\n🧪 Running test group: ${options.group} (${testFile})\n`);
  } else {
    console.log('\n🧪 Running all E2E tests...\n');
  }

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    return false;
  }
}

function printReport(): void {
  const reportPath = path.join(process.cwd(), 'test-results', 'results.json');

  if (fs.existsSync(reportPath)) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      const stats = report.stats || {};

      console.log('\n' + '='.repeat(60));
      console.log('📊 TEST RESULTS SUMMARY');
      console.log('='.repeat(60));
      console.log(`  Total:    ${stats.expected || 0}`);
      console.log(`  Passed:   ${(stats.expected || 0) - (stats.unexpected || 0) - (stats.flaky || 0)}`);
      console.log(`  Failed:   ${stats.unexpected || 0}`);
      console.log(`  Flaky:    ${stats.flaky || 0}`);
      console.log(`  Skipped:  ${stats.skipped || 0}`);
      console.log(`  Duration: ${((stats.duration || 0) / 1000).toFixed(2)}s`);
      console.log('='.repeat(60));

      if (stats.unexpected > 0) {
        console.log('\n❌ FAILED TESTS:');
        // Print failed test details from report
        if (report.suites) {
          for (const suite of report.suites) {
            printFailedTests(suite, '');
          }
        }
      }

      console.log(`\n📄 Full HTML report: test-results/html-report/index.html`);
    } catch (e) {
      console.log('Could not parse test results.');
    }
  }
}

function printFailedTests(suite: any, indent: string): void {
  if (suite.specs) {
    for (const spec of suite.specs) {
      if (spec.ok === false) {
        console.log(`${indent}  • ${spec.title}`);
        if (spec.tests) {
          for (const test of spec.tests) {
            if (test.status === 'unexpected') {
              console.log(`${indent}    File: ${suite.file}`);
              if (test.results?.[0]?.error?.message) {
                console.log(`${indent}    Error: ${test.results[0].error.message.split('\n')[0]}`);
              }
            }
          }
        }
      }
    }
  }

  if (suite.suites) {
    for (const childSuite of suite.suites) {
      printFailedTests(childSuite, indent + '  ');
    }
  }
}

// Main execution
const options = parseArgs();
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           INTERVU E2E TEST SUITE                           ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const success = runTests(options);
printReport();

if (!success) {
  console.log('\n❌ Some tests failed. Please review the report above.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
