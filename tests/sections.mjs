// Screenshot every section of the website: node sections.mjs <light|dark> <width> [url]
import { chromium } from "playwright";
const [scheme = "light", width = "1366", url = "http://127.0.0.1:8777/"] = process.argv.slice(2);
const w = parseInt(width, 10);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", isMobile: w < 500, hasTouch: w < 500, deviceScaleFactor: 1 });
const p = await c.newPage();
await p.goto(url, { waitUntil: "networkidle" });
await p.addStyleTag({ content: ".top{position:static!important} .ticket{display:none!important}" });
const sel = ["section.hero", "#courses", "#order", "#before", "#mlf", "#mlt", "#mlp", "#project", "#assess", "#calc", "#resources", "#doubts", "#glossary", "footer.foot"];
for (const [i, s] of sel.entries()) {
  const el = p.locator(s).first();
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  await el.screenshot({ path: `shots/sec-${scheme}-${w}-${String(i).padStart(2, "0")}.png` });
}
console.log("done", sel.length);
await b.close();
