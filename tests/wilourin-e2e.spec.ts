import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const TEST_EMAIL = `test_e2e_wilourin_${Date.now()}@mailinator.com`;
const TEST_PASS = 'TestPass123!';
const EXISTING_EMAIL = 'test_e2e_wilourin@mailinator.com';

async function go(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // let JS hydrate
}

// ─── 1. Signup ────────────────────────────────────────────────────────────────
test('1. Signup with email', async ({ page }) => {
  await go(page, '/signup');

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
  const confirmPass = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]').first();

  if (await nameInput.isVisible()) await nameInput.fill('E2E Test User');
  await emailInput.fill(TEST_EMAIL);
  await passInput.fill(TEST_PASS);
  if (await confirmPass.isVisible()) await confirmPass.fill(TEST_PASS);

  await page.screenshot({ path: 'tests/screenshots/01-signup-before.png' });
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/screenshots/01-signup-after.png' });

  const url = page.url();
  const bodyText = await page.locator('body').innerText();
  console.log('After signup URL:', url);
  console.log('Body:', bodyText.slice(0, 400));
});

// ─── 2. Login ─────────────────────────────────────────────────────────────────
test('2. Login with email', async ({ page }) => {
  await go(page, '/login');

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();

  await emailInput.fill(EXISTING_EMAIL);
  await passInput.fill(TEST_PASS);
  await page.screenshot({ path: 'tests/screenshots/02-login-before.png' });
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/screenshots/02-login-after.png' });

  const url = page.url();
  const bodyText = await page.locator('body').innerText();
  console.log('After login URL:', url);
  console.log('Body:', bodyText.slice(0, 300));
});

// ─── 3. Google OAuth ──────────────────────────────────────────────────────────
test('3. Google OAuth button', async ({ page }) => {
  await go(page, '/login');

  const googleBtn = page.locator([
    'button:has-text("Google")',
    'a:has-text("Google")',
    '[aria-label*="Google" i]',
    'button:has-text("Continue with Google")',
    'button:has-text("Sign in with Google")',
  ].join(', ')).first();

  await page.screenshot({ path: 'tests/screenshots/03-login-page.png' });

  const exists = await googleBtn.isVisible();
  console.log('Google button visible:', exists);

  if (!exists) {
    const html = await page.locator('body').innerHTML();
    console.log('Login page HTML snippet:', html.slice(0, 2000));
  }
});

// ─── 4. Browse Products ───────────────────────────────────────────────────────
test('4. Browse products', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await go(page, '/products');
  await page.screenshot({ path: 'tests/screenshots/04-products.png' });

  const bodyText = await page.locator('body').innerText();
  console.log('Products page snippet:', bodyText.slice(0, 500));

  const cards = await page.locator('a[href*="/products/"]').count();
  console.log('Product links found:', cards);
  console.log('Console errors:', errors.slice(0, 5));

  expect(cards).toBeGreaterThan(0);
});

// ─── 5. Filter and Search ─────────────────────────────────────────────────────
test('5. Filter and search', async ({ page }) => {
  await go(page, '/products');

  // Category filter
  const filterSelects = page.locator('select');
  const selectCount = await filterSelects.count();
  console.log('Select dropdowns:', selectCount);

  if (selectCount > 0) {
    const firstSelect = filterSelects.first();
    const options = await firstSelect.locator('option').count();
    if (options > 1) {
      await firstSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/05-filter.png' });
    }
  }

  // Search bar
  const searchIcon = page.locator('[data-testid="search"], [aria-label*="search" i], button[class*="search"]').first();
  if (await searchIcon.isVisible()) {
    await searchIcon.click();
    await page.waitForTimeout(500);
  }

  const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('dress');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/05-search.png' });
    console.log('Search URL:', page.url());
  } else {
    await go(page, '/search?q=dress');
    await page.screenshot({ path: 'tests/screenshots/05-search-page.png' });
    const body = await page.locator('body').innerText();
    console.log('Search page:', body.slice(0, 400));
  }
});

// ─── 6. Add to Cart ───────────────────────────────────────────────────────────
test('6. Add to cart', async ({ page }) => {
  await go(page, '/products');

  const firstProduct = page.locator('a[href*="/products/"]').first();
  const href = await firstProduct.getAttribute('href');
  console.log('Opening product:', href);
  await firstProduct.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/screenshots/06-product-page.png' });

  // Select size
  const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
  if (await sizeBtn.isVisible()) {
    await sizeBtn.click();
    await page.waitForTimeout(300);
  }

  const addToCart = page.locator([
    'button:has-text("Add to Cart")',
    'button:has-text("Add To Cart")',
    'button:has-text("ADD TO CART")',
    '[data-testid="add-to-cart"]',
  ].join(', ')).first();

  const exists = await addToCart.isVisible();
  console.log('Add to cart visible:', exists);

  if (exists) {
    await addToCart.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/06-after-cart.png' });

    const cartCountEl = page.locator('[data-testid="cart-count"], span[class*="cart"], .cart-count').first();
    const drawerEl = page.locator('[class*="cart-drawer"], [class*="CartDrawer"], aside[class*="cart"]').first();
    console.log('Cart count visible:', await cartCountEl.isVisible());
    console.log('Cart drawer visible:', await drawerEl.isVisible());
  }
});

// ─── 7. Add to Wishlist ───────────────────────────────────────────────────────
test('7. Add to wishlist', async ({ page }) => {
  await go(page, '/products');
  await page.screenshot({ path: 'tests/screenshots/07-products.png' });

  // Try heart/wishlist icon on product card
  const heartBtn = page.locator('button svg[class*="Heart"], button[aria-label*="wishlist" i], button[aria-label*="favorite" i], button[class*="wishlist"], button[class*="heart"]').first();

  const clicked = await heartBtn.isVisible();
  if (clicked) {
    await heartBtn.click();
    await page.waitForTimeout(1500);
  }
  console.log('Heart button found and clicked:', clicked);

  await go(page, '/wishlist');
  await page.screenshot({ path: 'tests/screenshots/07-wishlist.png' });

  const body = await page.locator('body').innerText();
  console.log('Wishlist page:', body.slice(0, 400));

  const is404 = /404|page not found/i.test(body);
  const isError = /500|something went wrong/i.test(body);
  console.log('Wishlist 404:', is404, '| Error:', isError);
  expect(is404).toBeFalsy();
});

// ─── 8. Discount Code ─────────────────────────────────────────────────────────
test('8. Apply discount code', async ({ page }) => {
  // Check cart page first (if exists)
  await go(page, '/checkout');
  await page.screenshot({ path: 'tests/screenshots/08-checkout.png' });

  const discountInput = page.locator([
    'input[placeholder*="discount" i]',
    'input[placeholder*="coupon" i]',
    'input[placeholder*="promo" i]',
    'input[name*="discount" i]',
    'input[name*="coupon" i]',
    'input[name*="code" i]',
  ].join(', ')).first();

  const exists = await discountInput.isVisible();
  console.log('Discount input visible:', exists);

  if (exists) {
    await discountInput.fill('WELCOME10');
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("APPLY"), button[type="submit"]:near(input)').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'tests/screenshots/08-discount-result.png' });
    const body = await page.locator('body').innerText();
    console.log('Discount result:', body.slice(0, 400));
  } else {
    const body = await page.locator('body').innerText();
    console.log('Checkout page body:', body.slice(0, 600));
  }
});

// ─── 9. Checkout Flow ─────────────────────────────────────────────────────────
test('9. Checkout flow and payment', async ({ page }) => {
  await go(page, '/checkout');
  await page.screenshot({ path: 'tests/screenshots/09-checkout.png' });

  const body = await page.locator('body').innerText();
  console.log('Checkout page:', body.slice(0, 600));

  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
  const emailInput = page.locator('input[type="email"]').first();
  const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="phone" i]').first();
  const addressInput = page.locator('input[name="address"], textarea[name="address"], input[placeholder*="address" i]').first();

  if (await nameInput.isVisible()) await nameInput.fill('Test User');
  if (await emailInput.isVisible()) await emailInput.fill('test@example.com');
  if (await phoneInput.isVisible()) await phoneInput.fill('9999999999');
  if (await addressInput.isVisible()) await addressInput.fill('123 Test Street, Ahmedabad');

  await page.screenshot({ path: 'tests/screenshots/09-filled.png' });

  const paytmBtn = page.locator([
    'button:has-text("Paytm")',
    'button:has-text("Pay")',
    '[class*="paytm"]',
    '[data-testid*="pay"]',
    'button:has-text("Place Order")',
  ].join(', ')).first();

  const payVisible = await paytmBtn.isVisible();
  console.log('Pay button visible:', payVisible, '| URL:', page.url());
});

// ─── 10. Account Page Tabs ────────────────────────────────────────────────────
test('10. Account page all tabs', async ({ page }) => {
  await go(page, '/account');
  await page.screenshot({ path: 'tests/screenshots/10-account.png' });

  const body = await page.locator('body').innerText();
  console.log('Account page:', body.slice(0, 500));
  console.log('Account URL:', page.url());

  // If redirected to login, note it
  if (page.url().includes('/login')) {
    console.log('Account requires login — skipping tab test');
    return;
  }

  const tabs = page.locator('[role="tab"], button[class*="tab"], nav[class*="tab"] a, [class*="TabTrigger"]');
  const tabCount = await tabs.count();
  console.log('Tab count:', tabCount);

  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i);
    const label = await tab.innerText().catch(() => '');
    if (!label.trim()) continue;

    await tab.click().catch(() => {});
    await page.waitForTimeout(800);

    const tabBody = await page.locator('body').innerText();
    const hasError = /500|something went wrong|TypeError/i.test(tabBody);
    const isBlank = tabBody.trim().length < 50;
    console.log(`Tab "${label}": ${hasError ? 'ERROR' : isBlank ? 'BLANK' : 'OK'}`);
  }
  await page.screenshot({ path: 'tests/screenshots/10-account-tabs.png' });
});

// ─── 11. Admin Panel ──────────────────────────────────────────────────────────
test('11. Admin panel sections', async ({ page }) => {
  const sections = [
    '/admin',
    '/admin/products',
    '/admin/orders',
    '/admin/customers',
    '/admin/settings',
    '/admin/discounts',
    '/admin/lookbook',
    '/admin/loyalty',
    '/admin/categories',
    '/admin/homepage',
    '/admin/advisor',
    '/admin/media',
    '/admin/size-guides',
  ];

  const broken: string[] = [];

  for (const section of sections) {
    await go(page, section);

    const bodyText = await page.locator('body').innerText();
    const has500 = /500|internal server error/i.test(bodyText);
    const hasJSError = /TypeError|ReferenceError|SyntaxError/i.test(bodyText);
    const is404 = await page.locator('h1:has-text("404")').count() > 0;
    const redirectedToLogin = page.url().includes('/login');

    if (has500 || hasJSError) broken.push(`${section} — server/JS error`);
    else if (is404) broken.push(`${section} — 404`);
    else if (redirectedToLogin) console.log(`${section} — auth required`);
    else console.log(`${section} — OK`);
  }

  await page.screenshot({ path: 'tests/screenshots/11-admin-last.png' });
  if (broken.length > 0) console.error('Broken admin sections:', broken);
});

// ─── 12. AI Advisor Chat ──────────────────────────────────────────────────────
test('12. AI Advisor chat', async ({ page }) => {
  await go(page, '/');
  await page.screenshot({ path: 'tests/screenshots/12-home.png' });

  // Look for floating advisor/chat button
  const advisorBtn = page.locator([
    'button:has-text("Advisor")',
    'button:has-text("AI Advisor")',
    'a:has-text("Advisor")',
    '[data-testid*="advisor"]',
    '[class*="advisor"]',
    '[class*="chat-btn"]',
    '[class*="chatbot"]',
  ].join(', ')).first();

  let chatOpened = false;
  if (await advisorBtn.isVisible()) {
    await advisorBtn.click();
    await page.waitForTimeout(1000);
    chatOpened = true;
  }

  // Check /admin/advisor
  const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="ask" i]').first();
  if (!chatOpened || !(await chatInput.isVisible())) {
    await go(page, '/admin/advisor');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'tests/screenshots/12-advisor.png' });
  const body = await page.locator('body').innerText();
  console.log('Advisor page:', body.slice(0, 500));

  const chatInputFinal = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="ask" i]').first();
  const visible = await chatInputFinal.isVisible();
  console.log('Chat input visible:', visible);

  if (visible) {
    await chatInputFinal.fill('What products do you recommend?');
    const sendBtn = page.locator('button[type="submit"], button:has-text("Send")').first();
    if (await sendBtn.isVisible()) await sendBtn.click();
    else await chatInputFinal.press('Enter');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/12-advisor-response.png' });
    const afterBody = await page.locator('body').innerText();
    console.log('After send:', afterBody.slice(-400));
  }
});

// ─── 13. Newsletter Signup ────────────────────────────────────────────────────
test('13. Newsletter signup', async ({ page }) => {
  await go(page, '/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/screenshots/13-footer.png' });

  const newsletterInput = page.locator([
    'footer input[type="email"]',
    'input[placeholder*="newsletter" i]',
    'input[placeholder*="subscribe" i]',
    'input[placeholder*="your email" i]',
    'form[id*="newsletter"] input',
    'section[class*="newsletter"] input',
  ].join(', ')).first();

  const exists = await newsletterInput.isVisible();
  console.log('Newsletter input visible:', exists);

  if (exists) {
    await newsletterInput.fill('newsletter_test@example.com');
    const submitBtn = page.locator('button:has-text("Subscribe"), button:has-text("SUBSCRIBE"), footer button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'tests/screenshots/13-after-subscribe.png' });
      const body = await page.locator('body').innerText();
      console.log('After subscribe:', body.slice(-500));
    }
  } else {
    const footerText = await page.locator('footer').innerText().catch(() => '');
    console.log('Footer text:', footerText.slice(0, 500));
    const body = await page.locator('body').innerText();
    const mentions = /newsletter|subscribe/i.test(body);
    console.log('Newsletter mention found:', mentions);
  }
});

// ─── 14. Lookbook Submission ──────────────────────────────────────────────────
test('14. Lookbook submission', async ({ page }) => {
  await go(page, '/lookbook');
  await page.screenshot({ path: 'tests/screenshots/14-lookbook.png' });

  const body = await page.locator('body').innerText();
  console.log('Lookbook page:', body.slice(0, 600));

  const is404 = /404|page not found/i.test(body);
  const hasError = /500|something went wrong/i.test(body);
  console.log('404:', is404, '| Error:', hasError);

  expect(is404).toBeFalsy();
  expect(hasError).toBeFalsy();

  const form = page.locator('form').first();
  const hasForm = await form.isVisible();
  console.log('Form on lookbook:', hasForm);

  if (hasForm) {
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const captionInput = page.locator('textarea, input[placeholder*="caption" i]').first();

    if (await nameInput.isVisible()) await nameInput.fill('Test User');
    if (await emailInput.isVisible()) await emailInput.fill('test@example.com');
    if (await captionInput.isVisible()) await captionInput.fill('Test caption for E2E');

    await page.screenshot({ path: 'tests/screenshots/14-lookbook-form.png' });
    console.log('Form filled successfully');
  }
});
