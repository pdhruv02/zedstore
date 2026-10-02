import { chromium, expect } from '@playwright/test';

const base = process.env.NABZ_TEST_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({headless: true});
const names = ['hero', 'products', 'fit', 'story', 'contact'];
const viewports = [
  {name: 'desktop', width: 1600, height: 900},
  {name: 'laptop', width: 1366, height: 768},
  {name: 'mobile', width: 390, height: 844},
  {name: 'small-mobile', width: 375, height: 667},
  {name: 'landscape', width: 844, height: 390},
];
for (const viewport of viewports) {
  const mobile = viewport.width <= 960;
  const page = await browser.newPage({viewport: {width: viewport.width, height: viewport.height}, isMobile: mobile, hasTouch: mobile});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base + '/assets/') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(base, {waitUntil: 'networkidle'});
  await expect(page.locator('[data-nabz-entry]')).toHaveCount(0);
  const active = page.locator(`[data-${mobile ? 'mobile' : 'deck'}-state="active"]`);
  const navigate = async index => {
    if (mobile) await page.locator(`[data-mobile-chapter="${index}"]`).click();
    else if (index === 0) await page.getByRole('link', {name: 'NABZ home'}).click();
    else await page.locator(`.nabz-site-header__nav a[href="#${names[index]}"]`).click();
    await expect(active).toHaveAttribute('id', names[index]);
    await expect(active).toHaveCSS('opacity', '1');
  };
  await expect(active).toHaveAttribute('id', 'hero');
  await expect(page.locator('.nabz-identity h1')).toBeVisible();
  const box = await active.boundingBox();
  if (box.height < 180 || box.width < 300) throw new Error(`${viewport.name}: collapsed chapter`);
  await navigate(1);
  await expect(page.locator('[data-product-card]')).toHaveCount(6);
  await expect(page.locator('[data-product-select]')).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const select = page.locator(`[data-product-select="${i}"]`);
    await select.click();
    await expect(select).toHaveAttribute('aria-pressed', 'true');
    const card = page.locator(`[data-product-card][data-product-index="${i}"]`);
    await expect(card).toHaveClass(/is-active/);
    await expect.poll(() => card.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(active).toHaveAttribute('id', 'products');
  }
  await page.screenshot({path: `nabz-${viewport.name}-surface.png`});
  await navigate(2);
  if (mobile) {
    await page.getByRole('tab', {name: 'System', exact: true}).click();
    await expect(page.locator('[data-fit-story-panel="solution"]')).toBeVisible();
    await expect(page.locator('[data-fit-story-panel="solution"]')).toHaveAttribute('aria-hidden', 'false');
    await page.screenshot({path: `nabz-${viewport.name}-system.png`});
    await page.getByRole('tab', {name: 'Illustration', exact: true}).click();
  } else {
    await page.getByRole('tab', {name: 'The system', exact: true}).click();
    await expect(page.locator('[data-fit-story-panel="solution"]')).toBeVisible();
  }
  await page.locator('[data-size="L"]').click();
  await page.locator('[data-length="Extended"]').click();
  await expect(page.locator('[data-fit-output]')).toHaveText('L · Extended · 29.25"');
  await page.locator('[data-size="S"]').click();
  await expect(page.locator('[data-length="Extended"]')).toBeDisabled();
  await expect(page.locator('[data-fit-output]')).toHaveText('S · Standard · 26.75"');
  await page.screenshot({path: `nabz-${viewport.name}-fit.png`});
  await navigate(3);
  const video = page.locator('[data-story-video]');
  await expect.poll(() => video.evaluate(video => video.readyState)).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', {name: 'Play NABZ brand film'}).click();
  await expect.poll(() => video.evaluate(video => video.currentTime)).toBeGreaterThan(0);
  await expect(page.locator('[data-story-play]')).toBeHidden();
  await navigate(4);
  await expect.poll(() => video.evaluate(video => video.paused)).toBe(true);
  await page.locator('input[name="contact[name]"]').fill('Render test');
  await page.locator('input[name="contact[email]"]').fill('render-test@example.com');
  await page.locator('textarea').fill('Local render verification.');
  await page.getByRole('button', {name: /Send message/}).click();
  await expect(page.locator('.nabz-static-form-note')).toContainText('has not been sent');
  await page.screenshot({path: `nabz-${viewport.name}-contact.png`});
  await navigate(0);
  await page.screenshot({path: `nabz-${viewport.name}-smoke.png`});
  if (!mobile) {
    await page.getByRole('button', {name: 'Previous chapter'}).click();
    await expect(active).toHaveAttribute('id', 'contact');
    await page.getByRole('button', {name: 'Next chapter'}).click();
    await expect(active).toHaveAttribute('id', 'hero');
    await page.setViewportSize({width: 390, height: 844});
    await page.locator('[data-mobile-chapter="3"]').click();
    await expect(page.locator('[data-mobile-state="active"]')).toHaveAttribute('id', 'story');
    await page.setViewportSize({width: viewport.width, height: viewport.height});
    await expect(page.locator('[data-deck-state="active"]')).toHaveAttribute('id', 'story');
    await page.setViewportSize({width: 1366, height: 560});
    await expect(page.locator('[data-nabz-chapter][inert]')).toHaveCount(0);
    await expect(page.locator('[data-deck-state]')).toHaveCount(0);
  }
  if (errors.length) throw new Error(`${viewport.name}: ${errors.join('; ')}`);
  console.log(`${viewport.name}: navigation, six products, fit, video, contact, and responsive state passed`);
  await page.close();
}
await browser.close();
console.log('NABZ browser checks passed.');
