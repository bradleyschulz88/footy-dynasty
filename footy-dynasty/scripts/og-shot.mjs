// Regenerate the social-share image + promo screenshot from public/promo.html.
// Usage: node scripts/og-shot.mjs   (run from footy-dynasty/)
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto('file://' + process.cwd() + '/public/promo.html', { waitUntil: 'load' });
await page.waitForTimeout(2200); // fonts + count-ups settle
await page.screenshot({ path: 'public/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
console.log('public/og.png written');
await browser.close();
