# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wilourin-e2e.spec.ts >> 6. Add to cart
- Location: tests\wilourin-e2e.spec.ts:141:5

# Error details

```
TimeoutError: locator.getAttribute: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('a[href*="/products/"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - text: Delivering to Ahmedabad
    - button "Dismiss announcement" [ref=e3] [cursor=pointer]:
      - img [ref=e4]
  - banner [ref=e7]:
    - generic [ref=e9]:
      - navigation [ref=e10]:
        - link "Men" [ref=e11] [cursor=pointer]:
          - /url: /products?category=men
        - link "Women" [ref=e12] [cursor=pointer]:
          - /url: /products?category=women
        - link "Accessories" [ref=e13] [cursor=pointer]:
          - /url: /products?category=accessories
        - link "Lookbook" [ref=e14] [cursor=pointer]:
          - /url: /lookbook
        - link "About" [ref=e15] [cursor=pointer]:
          - /url: /about
      - link "Wilourin" [ref=e16] [cursor=pointer]:
        - /url: /
      - generic [ref=e17]:
        - button "Search" [ref=e18] [cursor=pointer]:
          - img [ref=e19]
        - link "Wishlist" [ref=e22] [cursor=pointer]:
          - /url: /wishlist
          - img [ref=e23]
        - button "Cart" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
        - link "Account" [ref=e29] [cursor=pointer]:
          - /url: /login
          - img [ref=e30]
  - main [ref=e33]:
    - generic [ref=e34]:
      - generic [ref=e35]:
        - heading "All Products" [level=1] [ref=e36]
        - paragraph [ref=e37]: 0 products
      - generic [ref=e40]:
        - link "View All" [ref=e41] [cursor=pointer]:
          - /url: /products
        - link "Men" [ref=e42] [cursor=pointer]:
          - /url: /products?category=men
        - link "Women" [ref=e43] [cursor=pointer]:
          - /url: /products?category=women
        - link "Accessories" [ref=e44] [cursor=pointer]:
          - /url: /products?category=accessories
        - link "New" [ref=e45] [cursor=pointer]:
          - /url: /products?badge=New+Arrival
        - link "Sale" [ref=e46] [cursor=pointer]:
          - /url: /products?badge=Sale
        - link "XS" [ref=e48] [cursor=pointer]:
          - /url: /products?size=XS&sort=newest
        - link "S" [ref=e49] [cursor=pointer]:
          - /url: /products?size=S&sort=newest
        - link "M" [ref=e50] [cursor=pointer]:
          - /url: /products?size=M&sort=newest
        - link "L" [ref=e51] [cursor=pointer]:
          - /url: /products?size=L&sort=newest
        - link "XL" [ref=e52] [cursor=pointer]:
          - /url: /products?size=XL&sort=newest
        - link "XXL" [ref=e53] [cursor=pointer]:
          - /url: /products?size=XXL&sort=newest
        - generic [ref=e54]:
          - link "New" [ref=e55] [cursor=pointer]:
            - /url: /products?sort=newest
          - link "Low" [ref=e56] [cursor=pointer]:
            - /url: /products?sort=price_asc
          - link "High" [ref=e57] [cursor=pointer]:
            - /url: /products?sort=price_desc
      - generic [ref=e59]:
        - paragraph [ref=e60]: No products found
        - paragraph [ref=e61]: Try adjusting your filters.
        - link "Clear filters" [ref=e62] [cursor=pointer]:
          - /url: /products
  - contentinfo [ref=e63]:
    - generic [ref=e64]:
      - generic [ref=e65]:
        - heading "Wilourin" [level=3] [ref=e66]
        - paragraph [ref=e67]: Premium Indian streetwear crafted for the bold and fearless. Dress the streets.
        - generic [ref=e68]:
          - link "Instagram" [ref=e69] [cursor=pointer]:
            - /url: https://www.instagram.com/wilourin
            - img [ref=e70]
          - link "X (Twitter)" [ref=e73] [cursor=pointer]:
            - /url: https://twitter.com/wilourin
            - img [ref=e74]
          - link "WhatsApp" [ref=e76] [cursor=pointer]:
            - /url: https://wa.me/918140081461
            - img [ref=e77]
      - generic [ref=e79]:
        - heading "Shop" [level=4] [ref=e80]
        - list [ref=e81]:
          - listitem [ref=e82]:
            - link "Men" [ref=e83] [cursor=pointer]:
              - /url: /products?category=men
          - listitem [ref=e84]:
            - link "Women" [ref=e85] [cursor=pointer]:
              - /url: /products?category=women
          - listitem [ref=e86]:
            - link "Accessories" [ref=e87] [cursor=pointer]:
              - /url: /products?category=accessories
          - listitem [ref=e88]:
            - link "New Arrivals" [ref=e89] [cursor=pointer]:
              - /url: /products?badge=New+Arrival
          - listitem [ref=e90]:
            - link "Sale" [ref=e91] [cursor=pointer]:
              - /url: /products?badge=Sale
      - generic [ref=e92]:
        - heading "Help" [level=4] [ref=e93]
        - list [ref=e94]:
          - listitem [ref=e95]:
            - link "About Us" [ref=e96] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e97]:
            - link "Lookbook" [ref=e98] [cursor=pointer]:
              - /url: /lookbook
          - listitem [ref=e99]:
            - link "Size Guide" [ref=e100] [cursor=pointer]:
              - /url: /products#size-guide
          - listitem [ref=e101]:
            - link "Track Order" [ref=e102] [cursor=pointer]:
              - /url: /account
          - listitem [ref=e103]:
            - link "Returns & Exchanges" [ref=e104] [cursor=pointer]:
              - /url: /about#returns
          - listitem [ref=e105]:
            - link "Contact Us" [ref=e106] [cursor=pointer]:
              - /url: /about#contact
      - generic [ref=e107]:
        - heading "Get in Touch" [level=4] [ref=e108]
        - generic [ref=e109]:
          - paragraph [ref=e110]: hello@wilourin.com
          - paragraph [ref=e111]: +91 81400 81461
          - paragraph [ref=e112]: Ahmedabad, Gujarat, India
        - link "Chat on WhatsApp" [ref=e113] [cursor=pointer]:
          - /url: https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20have%20a%20question.
          - img [ref=e114]
          - text: Chat on WhatsApp
    - generic [ref=e117]:
      - paragraph [ref=e118]: © 2026 Wilourin. All rights reserved. Made with love in India.
      - generic [ref=e119]:
        - generic [ref=e120]: UPI
        - generic [ref=e121]: Paytm
        - generic [ref=e122]: Visa
        - generic [ref=e123]: Mastercard
        - generic [ref=e124]: COD
  - generic "Shopping cart" [ref=e125]:
    - generic [ref=e126]:
      - generic [ref=e127]:
        - img [ref=e128]
        - generic [ref=e131]: Your Cart
      - button "Close cart" [ref=e132] [cursor=pointer]:
        - img [ref=e133]
    - generic [ref=e136]:
      - img [ref=e137]
      - paragraph [ref=e140]: Your cart is empty
      - paragraph [ref=e141]: Add some pieces to get started.
      - button "Continue Shopping" [ref=e142] [cursor=pointer]
  - button "Help & FAQ" [ref=e144] [cursor=pointer]:
    - img [ref=e145]
    - generic [ref=e147]: Help
  - generic [ref=e148]:
    - generic [ref=e149]:
      - generic [ref=e150]: Help Centre
      - button "Close" [ref=e151] [cursor=pointer]:
        - img [ref=e152]
    - generic [ref=e155]:
      - paragraph [ref=e156]: Frequently asked questions
      - generic [ref=e157]:
        - button "How long does delivery take?" [ref=e159] [cursor=pointer]:
          - text: How long does delivery take?
          - img [ref=e160]
        - button "What is your return policy?" [ref=e163] [cursor=pointer]:
          - text: What is your return policy?
          - img [ref=e164]
        - button "Are the sizes true to fit?" [ref=e167] [cursor=pointer]:
          - text: Are the sizes true to fit?
          - img [ref=e168]
        - button "How do I track my order?" [ref=e171] [cursor=pointer]:
          - text: How do I track my order?
          - img [ref=e172]
        - button "Do you accept exchanges?" [ref=e175] [cursor=pointer]:
          - text: Do you accept exchanges?
          - img [ref=e176]
        - button "Is COD available?" [ref=e179] [cursor=pointer]:
          - text: Is COD available?
          - img [ref=e180]
    - generic [ref=e182]:
      - paragraph [ref=e183]: Can't find your answer? Chat with us.
      - link "Chat on WhatsApp" [ref=e184] [cursor=pointer]:
        - /url: https://wa.me/918140081461?text=Hi%20Wilourin%2C%20I%20need%20help%20with%20my%20order.
        - img [ref=e185]
        - text: Chat on WhatsApp
  - alert [ref=e187]
  - generic [ref=e188]:
    - generic [ref=e189]:
      - img [ref=e190]
      - paragraph [ref=e192]:
        - text: We use cookies to improve your experience and analyse site traffic. By clicking
        - strong [ref=e193]: Accept
        - text: ", you agree to our use of cookies."
    - generic [ref=e194]:
      - button "Accept" [ref=e195] [cursor=pointer]
      - button "Decline" [ref=e196] [cursor=pointer]
```

# Test source

```ts
  45  |   await emailInput.fill(EXISTING_EMAIL);
  46  |   await passInput.fill(TEST_PASS);
  47  |   await page.screenshot({ path: 'tests/screenshots/02-login-before.png' });
  48  |   await page.locator('button[type="submit"]').first().click();
  49  |   await page.waitForTimeout(4000);
  50  |   await page.screenshot({ path: 'tests/screenshots/02-login-after.png' });
  51  | 
  52  |   const url = page.url();
  53  |   const bodyText = await page.locator('body').innerText();
  54  |   console.log('After login URL:', url);
  55  |   console.log('Body:', bodyText.slice(0, 300));
  56  | });
  57  | 
  58  | // ─── 3. Google OAuth ──────────────────────────────────────────────────────────
  59  | test('3. Google OAuth button', async ({ page }) => {
  60  |   await go(page, '/login');
  61  | 
  62  |   const googleBtn = page.locator([
  63  |     'button:has-text("Google")',
  64  |     'a:has-text("Google")',
  65  |     '[aria-label*="Google" i]',
  66  |     'button:has-text("Continue with Google")',
  67  |     'button:has-text("Sign in with Google")',
  68  |   ].join(', ')).first();
  69  | 
  70  |   await page.screenshot({ path: 'tests/screenshots/03-login-page.png' });
  71  | 
  72  |   const exists = await googleBtn.isVisible();
  73  |   console.log('Google button visible:', exists);
  74  | 
  75  |   if (!exists) {
  76  |     const html = await page.locator('body').innerHTML();
  77  |     console.log('Login page HTML snippet:', html.slice(0, 2000));
  78  |   }
  79  | });
  80  | 
  81  | // ─── 4. Browse Products ───────────────────────────────────────────────────────
  82  | test('4. Browse products', async ({ page }) => {
  83  |   const errors: string[] = [];
  84  |   page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  85  | 
  86  |   await go(page, '/products');
  87  |   await page.screenshot({ path: 'tests/screenshots/04-products.png' });
  88  | 
  89  |   const bodyText = await page.locator('body').innerText();
  90  |   console.log('Products page snippet:', bodyText.slice(0, 500));
  91  | 
  92  |   const cards = await page.locator('a[href*="/products/"]').count();
  93  |   console.log('Product links found:', cards);
  94  |   console.log('Console errors:', errors.slice(0, 5));
  95  | 
  96  |   expect(cards).toBeGreaterThan(0);
  97  | });
  98  | 
  99  | // ─── 5. Filter and Search ─────────────────────────────────────────────────────
  100 | test('5. Filter and search', async ({ page }) => {
  101 |   await go(page, '/products');
  102 | 
  103 |   // Category filter
  104 |   const filterSelects = page.locator('select');
  105 |   const selectCount = await filterSelects.count();
  106 |   console.log('Select dropdowns:', selectCount);
  107 | 
  108 |   if (selectCount > 0) {
  109 |     const firstSelect = filterSelects.first();
  110 |     const options = await firstSelect.locator('option').count();
  111 |     if (options > 1) {
  112 |       await firstSelect.selectOption({ index: 1 });
  113 |       await page.waitForTimeout(1500);
  114 |       await page.screenshot({ path: 'tests/screenshots/05-filter.png' });
  115 |     }
  116 |   }
  117 | 
  118 |   // Search bar
  119 |   const searchIcon = page.locator('[data-testid="search"], [aria-label*="search" i], button[class*="search"]').first();
  120 |   if (await searchIcon.isVisible()) {
  121 |     await searchIcon.click();
  122 |     await page.waitForTimeout(500);
  123 |   }
  124 | 
  125 |   const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  126 |   if (await searchInput.isVisible()) {
  127 |     await searchInput.fill('dress');
  128 |     await searchInput.press('Enter');
  129 |     await page.waitForTimeout(2000);
  130 |     await page.screenshot({ path: 'tests/screenshots/05-search.png' });
  131 |     console.log('Search URL:', page.url());
  132 |   } else {
  133 |     await go(page, '/search?q=dress');
  134 |     await page.screenshot({ path: 'tests/screenshots/05-search-page.png' });
  135 |     const body = await page.locator('body').innerText();
  136 |     console.log('Search page:', body.slice(0, 400));
  137 |   }
  138 | });
  139 | 
  140 | // ─── 6. Add to Cart ───────────────────────────────────────────────────────────
  141 | test('6. Add to cart', async ({ page }) => {
  142 |   await go(page, '/products');
  143 | 
  144 |   const firstProduct = page.locator('a[href*="/products/"]').first();
> 145 |   const href = await firstProduct.getAttribute('href');
      |                                   ^ TimeoutError: locator.getAttribute: Timeout 10000ms exceeded.
  146 |   console.log('Opening product:', href);
  147 |   await firstProduct.click();
  148 |   await page.waitForTimeout(2000);
  149 |   await page.screenshot({ path: 'tests/screenshots/06-product-page.png' });
  150 | 
  151 |   // Select size
  152 |   const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
  153 |   if (await sizeBtn.isVisible()) {
  154 |     await sizeBtn.click();
  155 |     await page.waitForTimeout(300);
  156 |   }
  157 | 
  158 |   const addToCart = page.locator([
  159 |     'button:has-text("Add to Cart")',
  160 |     'button:has-text("Add To Cart")',
  161 |     'button:has-text("ADD TO CART")',
  162 |     '[data-testid="add-to-cart"]',
  163 |   ].join(', ')).first();
  164 | 
  165 |   const exists = await addToCart.isVisible();
  166 |   console.log('Add to cart visible:', exists);
  167 | 
  168 |   if (exists) {
  169 |     await addToCart.click();
  170 |     await page.waitForTimeout(2000);
  171 |     await page.screenshot({ path: 'tests/screenshots/06-after-cart.png' });
  172 | 
  173 |     const cartCountEl = page.locator('[data-testid="cart-count"], span[class*="cart"], .cart-count').first();
  174 |     const drawerEl = page.locator('[class*="cart-drawer"], [class*="CartDrawer"], aside[class*="cart"]').first();
  175 |     console.log('Cart count visible:', await cartCountEl.isVisible());
  176 |     console.log('Cart drawer visible:', await drawerEl.isVisible());
  177 |   }
  178 | });
  179 | 
  180 | // ─── 7. Add to Wishlist ───────────────────────────────────────────────────────
  181 | test('7. Add to wishlist', async ({ page }) => {
  182 |   await go(page, '/products');
  183 |   await page.screenshot({ path: 'tests/screenshots/07-products.png' });
  184 | 
  185 |   // Try heart/wishlist icon on product card
  186 |   const heartBtn = page.locator('button svg[class*="Heart"], button[aria-label*="wishlist" i], button[aria-label*="favorite" i], button[class*="wishlist"], button[class*="heart"]').first();
  187 | 
  188 |   const clicked = await heartBtn.isVisible();
  189 |   if (clicked) {
  190 |     await heartBtn.click();
  191 |     await page.waitForTimeout(1500);
  192 |   }
  193 |   console.log('Heart button found and clicked:', clicked);
  194 | 
  195 |   await go(page, '/wishlist');
  196 |   await page.screenshot({ path: 'tests/screenshots/07-wishlist.png' });
  197 | 
  198 |   const body = await page.locator('body').innerText();
  199 |   console.log('Wishlist page:', body.slice(0, 400));
  200 | 
  201 |   const is404 = /404|page not found/i.test(body);
  202 |   const isError = /500|something went wrong/i.test(body);
  203 |   console.log('Wishlist 404:', is404, '| Error:', isError);
  204 |   expect(is404).toBeFalsy();
  205 | });
  206 | 
  207 | // ─── 8. Discount Code ─────────────────────────────────────────────────────────
  208 | test('8. Apply discount code', async ({ page }) => {
  209 |   // Check cart page first (if exists)
  210 |   await go(page, '/checkout');
  211 |   await page.screenshot({ path: 'tests/screenshots/08-checkout.png' });
  212 | 
  213 |   const discountInput = page.locator([
  214 |     'input[placeholder*="discount" i]',
  215 |     'input[placeholder*="coupon" i]',
  216 |     'input[placeholder*="promo" i]',
  217 |     'input[name*="discount" i]',
  218 |     'input[name*="coupon" i]',
  219 |     'input[name*="code" i]',
  220 |   ].join(', ')).first();
  221 | 
  222 |   const exists = await discountInput.isVisible();
  223 |   console.log('Discount input visible:', exists);
  224 | 
  225 |   if (exists) {
  226 |     await discountInput.fill('WELCOME10');
  227 |     const applyBtn = page.locator('button:has-text("Apply"), button:has-text("APPLY"), button[type="submit"]:near(input)').first();
  228 |     if (await applyBtn.isVisible()) {
  229 |       await applyBtn.click();
  230 |       await page.waitForTimeout(2000);
  231 |     }
  232 |     await page.screenshot({ path: 'tests/screenshots/08-discount-result.png' });
  233 |     const body = await page.locator('body').innerText();
  234 |     console.log('Discount result:', body.slice(0, 400));
  235 |   } else {
  236 |     const body = await page.locator('body').innerText();
  237 |     console.log('Checkout page body:', body.slice(0, 600));
  238 |   }
  239 | });
  240 | 
  241 | // ─── 9. Checkout Flow ─────────────────────────────────────────────────────────
  242 | test('9. Checkout flow and payment', async ({ page }) => {
  243 |   await go(page, '/checkout');
  244 |   await page.screenshot({ path: 'tests/screenshots/09-checkout.png' });
  245 | 
```