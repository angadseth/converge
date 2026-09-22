// Screenshot every sheet: node pages.mjs <light|dark> <width> [url]
import { chromium } from "playwright";
const [scheme = "light", width = "1366", url = "http://127.0.0.1:8777/"] = process.argv.slice(2);
const w = parseInt(width, 10);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: "reduce", isMobile: w < 500, hasTouch: w < 500 });
const p = await c.newPage();
await p.goto(url, { waitUntil: "networkidle" });
await p.addStyleTag({ content: ".bar{position:static!important}" });
const n = await p.locator(".sheet").count();
for (let i = 1; i <= n; i++) {
  const el = p.locator(`#p${i}`);
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
  await el.screenshot({ path: `shots/page-${scheme}-${w}-${String(i).padStart(2, "0")}.png` });
}
console.log("pages", n);
await b.close();
