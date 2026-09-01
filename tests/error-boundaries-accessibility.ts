import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runMilestone3Verification() {
  console.log('=== SEEP 4.0 Milestone 3: Error Boundaries, Performance & Accessibility Verification ===\n');

  const rootDir = process.cwd();

  // 1. Verify Error Boundary in src/app/login/page.tsx
  console.log('--- 1. Verifying Login Page Error Boundary Wrapping ---');
  const loginPagePath = path.join(rootDir, 'src/app/login/page.tsx');
  assert(fs.existsSync(loginPagePath), 'src/app/login/page.tsx must exist');
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
  assert(
    loginPageContent.includes("import { ErrorBoundary } from '@/components/common/ErrorBoundary'") ||
    loginPageContent.includes('import { ErrorBoundary }'),
    'src/app/login/page.tsx imports ErrorBoundary'
  );
  assert(
    loginPageContent.includes('<ErrorBoundary fallbackTitle="Authentication Interface Error">'),
    'src/app/login/page.tsx wraps login UI with <ErrorBoundary fallbackTitle="Authentication Interface Error">'
  );
  assert(
    loginPageContent.includes('</ErrorBoundary>'),
    'src/app/login/page.tsx contains closing </ErrorBoundary>'
  );

  // 2. Verify Root Next.js App Router Error Boundary (src/app/error.tsx)
  console.log('\n--- 2. Verifying Root App Router Error Boundary (src/app/error.tsx) ---');
  const rootErrorPath = path.join(rootDir, 'src/app/error.tsx');
  assert(fs.existsSync(rootErrorPath), 'src/app/error.tsx must exist');
  const rootErrorContent = fs.readFileSync(rootErrorPath, 'utf8');
  assert(rootErrorContent.includes("'use client'"), "src/app/error.tsx is a client component ('use client')");
  assert(rootErrorContent.includes('reset: () => void') || rootErrorContent.includes('reset'), 'src/app/error.tsx accepts reset callback');
  assert(rootErrorContent.includes('error: Error'), 'src/app/error.tsx accepts error object');
  assert(rootErrorContent.includes('handleNavigationReset') || rootErrorContent.includes("window.location.href = '/'"), 'src/app/error.tsx includes navigation reset');
  assert(rootErrorContent.includes('reset()'), 'src/app/error.tsx provides retry mechanism');
  assert(rootErrorContent.includes('Technical Diagnostic Details') || rootErrorContent.includes('stack'), 'src/app/error.tsx includes diagnostic inspector');

  // 3. Verify Bidder Console Error Boundary (src/app/bidder/error.tsx)
  console.log('\n--- 3. Verifying Bidder Route Error Boundary (src/app/bidder/error.tsx) ---');
  const bidderErrorPath = path.join(rootDir, 'src/app/bidder/error.tsx');
  assert(fs.existsSync(bidderErrorPath), 'src/app/bidder/error.tsx must exist');
  const bidderErrorContent = fs.readFileSync(bidderErrorPath, 'utf8');
  assert(bidderErrorContent.includes("'use client'"), "src/app/bidder/error.tsx is a client component ('use client')");
  assert(bidderErrorContent.includes('reset()'), 'src/app/bidder/error.tsx provides retry button');
  assert(bidderErrorContent.includes('window.location.reload()'), 'src/app/bidder/error.tsx provides hard state resync');
  assert(bidderErrorContent.includes('/login'), 'src/app/bidder/error.tsx provides re-authentication navigation');
  assert(bidderErrorContent.includes('Financial State & Ledger Conserved') || bidderErrorContent.includes('wallet'), 'src/app/bidder/error.tsx provides ledger state reassurance');

  // 4. Verify Admin Console Error Boundary (src/app/admin/error.tsx)
  console.log('\n--- 4. Verifying Admin Route Error Boundary (src/app/admin/error.tsx) ---');
  const adminErrorPath = path.join(rootDir, 'src/app/admin/error.tsx');
  assert(fs.existsSync(adminErrorPath), 'src/app/admin/error.tsx must exist');
  const adminErrorContent = fs.readFileSync(adminErrorPath, 'utf8');
  assert(adminErrorContent.includes("'use client'"), "src/app/admin/error.tsx is a client component ('use client')");
  assert(adminErrorContent.includes('reset()'), 'src/app/admin/error.tsx provides retry render button');
  assert(adminErrorContent.includes('window.location.reload()'), 'src/app/admin/error.tsx provides operator force resync');
  assert(adminErrorContent.includes('/admin'), 'src/app/admin/error.tsx provides reset admin navigation');
  assert(adminErrorContent.includes('Operator Recovery Actions'), 'src/app/admin/error.tsx provides operator recovery tools suite');

  // 5. Verify BiddingPad Keyboard Navigation & Accessibility (src/components/bidder/BiddingPad.tsx)
  console.log('\n--- 5. Verifying BiddingPad Keyboard Navigation & Accessibility ---');
  const biddingPadPath = path.join(rootDir, 'src/components/bidder/BiddingPad.tsx');
  assert(fs.existsSync(biddingPadPath), 'src/components/bidder/BiddingPad.tsx must exist');
  const biddingPadContent = fs.readFileSync(biddingPadPath, 'utf8');

  // Check Hotkey implementations
  assert(biddingPadContent.includes("e.key === '1'") || biddingPadContent.includes("Digit1"), 'BiddingPad implements Hotkey 1 for Increment 1');
  assert(biddingPadContent.includes("e.key === '2'") || biddingPadContent.includes("Digit2"), 'BiddingPad implements Hotkey 2 for Increment 2');
  assert(biddingPadContent.includes("e.key === '3'") || biddingPadContent.includes("Digit3"), 'BiddingPad implements Hotkey 3 for Increment 3');
  assert(biddingPadContent.includes("e.key === '4'") || biddingPadContent.includes("Digit4"), 'BiddingPad implements Hotkey 4 for Increment 4');
  assert(biddingPadContent.includes("e.key === ' '") || biddingPadContent.includes("Space"), 'BiddingPad implements Hotkey Space for Pass');

  // Check input element bypass logic
  assert(
    biddingPadContent.includes("['INPUT', 'TEXTAREA'") && biddingPadContent.includes('isContentEditable'),
    'BiddingPad ignores hotkeys when user is focused inside input/textarea/editable elements'
  );

  // Check ARIA key shortcuts
  assert(biddingPadContent.includes('aria-keyshortcuts='), 'BiddingPad defines aria-keyshortcuts on increment buttons');
  assert(biddingPadContent.includes('aria-keyshortcuts="Space"'), 'BiddingPad defines aria-keyshortcuts="Space" on Pass button');

  // Check ARIA Live Regions
  assert(
    biddingPadContent.includes('aria-live="polite"') && biddingPadContent.includes('aria-atomic="true"'),
    'BiddingPad contains aria-live="polite" dynamic price announcement region'
  );

  // Check Visual Keycap Badges
  assert(biddingPadContent.includes('[Space]'), 'BiddingPad displays visual keycap badge [Space]');
  assert(biddingPadContent.includes('[{shortcutKey}]') || biddingPadContent.includes('[{idx + 1}]'), 'BiddingPad displays visual keycap badges [1], [2], etc.');

  // Check High-Contrast Focus Rings
  assert(
    biddingPadContent.includes('focus-visible:ring-2') && biddingPadContent.includes('focus-visible:ring-gold-400'),
    'BiddingPad applies high-contrast focus rings (focus-visible:ring-2 focus-visible:ring-gold-400 outline-none)'
  );

  console.log('\n=== All Milestone 3 Error Boundaries & Accessibility Verifications Passed! ===');
}

runMilestone3Verification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
