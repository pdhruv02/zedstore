import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

async function assertVisiblePage(page, label) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3300);
  const state = await page.evaluate(() => {
    const home = document.querySelector('.nabz-clean-home');
    const active = document.querySelector('[data-nabz-chapter][data-deck-state="active"], [data-nabz-chapter][data-mobile-state="active"]');
    const headline = document.querySelector('.nabz-identity h1');
    const ui = document.querySelector('.nabz-deck-ui');
    const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
    const style = (el) => el ? getComputedStyle(el) : null;
    return {
      home: rect(home),
      active: rect(active),
      headline: rect(headline),
      ui: rect(ui),
      activeDisplay: style(active)?.display,
      activeVisibility: style(active)?.visibility,
      activeOpacity: style(active)?.opacity,
      text: headline?.textContent?.replace(/\s+/g, ' ').trim() || '',
      bodyClass: document.body.className,
    };
  });
  console.log(label, JSON.stringify(state));
  if (!state.home || state.home.height < 300) throw new Error(`${label}: home deck collapsed (${state.home?.height ?? 'missing'}px)`);
  if (!state.active || state.active.height < 250 || state.active.width < 250) throw new Error(`${label}: active chapter has no usable box`);
  if (state.activeVisibility === 'hidden' || Number(state.activeOpacity) < 0.5) throw new Error(`${label}: active chapter is hidden`);
  if (!state.headline || state.headline.height < 20 || !state.text.includes('The space between')) throw new Error(`${label}: hero headline is not visibly rendered`);
  if (!state.ui || state.ui.width < 20 || state.ui.height < 20) throw new Error(`${label}: chapter navigation is missing`);
}

const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await assertVisiblePage(desktop, 'desktop');
await desktop.screenshot({ path: 'nabz-desktop-smoke.png', fullPage: true });
await desktop.close();

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await assertVisiblePage(mobile, 'mobile');
await mobile.screenshot({ path: 'nabz-mobile-smoke.png', fullPage: true });
await mobile.close();

await browser.close();
console.log('Browser smoke test passed.');
