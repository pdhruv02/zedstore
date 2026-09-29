import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const rect = async (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON());

async function assertHeroVisible(page, label) {
  const home = page.locator('.nabz-clean-home');
  const active = page.locator('[data-nabz-chapter][data-deck-state="active"], [data-nabz-chapter][data-mobile-state="active"]').first();
  const headline = page.locator('.nabz-identity h1');
  const homeBox = await rect(home);
  const activeBox = await rect(active);
  const headlineBox = await rect(headline);
  const activeVisibility = await active.evaluate((el) => ({ visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity }));
  const text = (await headline.textContent())?.replace(/\s+/g, ' ').trim() || '';
  console.log(label, { homeBox, activeBox, headlineBox, activeVisibility, text });
  if (homeBox.height < 300) throw new Error(`${label}: home deck collapsed (${homeBox.height}px)`);
  if (activeBox.height < 250 || activeBox.width < 250) throw new Error(`${label}: active chapter has no usable box`);
  if (activeVisibility.visibility === 'hidden' || Number(activeVisibility.opacity) < 0.5) throw new Error(`${label}: active chapter is hidden`);
  if (headlineBox.height < 20 || !text.includes('The space between')) throw new Error(`${label}: hero headline is not visibly rendered`);
}

const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await desktop.goto(base, { waitUntil: 'networkidle' });
await desktop.waitForTimeout(3300);
await assertHeroVisible(desktop, 'desktop');
const desktopUi = desktop.locator('.nabz-deck-ui');
const mobileUiOnDesktop = desktop.locator('[data-mobile-deck-ui]');
if (!(await desktopUi.isVisible())) throw new Error('desktop: desktop chapter controls are missing');
if (await mobileUiOnDesktop.isVisible()) throw new Error('desktop: mobile dock leaked into desktop layout');
if ((await desktopUi.locator('[data-deck-count]').textContent())?.trim() !== '01 / 05') throw new Error('desktop: chapter count is wrong');
if (await desktopUi.locator('button').count() !== 2) throw new Error('desktop: expected exactly two arrow controls');
await desktopUi.locator('[data-deck-next]').click();
await desktop.waitForTimeout(1000);
if (await desktop.locator('[data-nabz-chapter][data-deck-state="active"]').getAttribute('id') !== 'products') throw new Error('desktop: next chapter control does not work');
await desktopUi.locator('[data-deck-previous]').click();
await desktop.waitForTimeout(1000);
if (await desktop.locator('[data-nabz-chapter][data-deck-state="active"]').getAttribute('id') !== 'hero') throw new Error('desktop: previous chapter control does not work');
await desktop.screenshot({ path: 'nabz-desktop-smoke.png', fullPage: true });
await desktop.close();

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await mobile.goto(base, { waitUntil: 'networkidle' });
await mobile.waitForTimeout(600);
await assertHeroVisible(mobile, 'mobile');
const mobileUi = mobile.locator('[data-mobile-deck-ui]');
if (!(await mobileUi.isVisible())) throw new Error('mobile: mobile dock is missing');
if (await mobile.locator('.nabz-deck-ui').isVisible()) throw new Error('mobile: desktop chapter controls leaked into mobile layout');
if (await mobileUi.locator('[data-mobile-chapter]').count() !== 5) throw new Error('mobile: expected five chapter buttons');
await mobileUi.locator('[data-mobile-chapter="4"]').click();
await mobile.waitForTimeout(650);
if (await mobile.locator('[data-nabz-chapter][data-mobile-state="active"]').getAttribute('id') !== 'contact') throw new Error('mobile: contact chapter navigation does not work');
await mobileUi.locator('[data-mobile-chapter="0"]').click();
await mobile.waitForTimeout(650);
if (await mobile.locator('[data-nabz-chapter][data-mobile-state="active"]').getAttribute('id') !== 'hero') throw new Error('mobile: identity chapter navigation does not work');
await mobile.screenshot({ path: 'nabz-mobile-smoke.png', fullPage: true });
await mobile.close();

await browser.close();
console.log('Browser smoke test passed.');
