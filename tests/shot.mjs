// Quick screenshots for eyeballing: node shot.mjs [url] [name]
import { chromium } from "playwright";
const url = process.argv[2] || "http://127.0.0.1:8777/";
const name = process.argv[3] || "shot";
const views = [
  { n: "desk-light", w: 1366, h: 900, dark: false },
  { n: "desk-dark", w: 1366, h: 900, dark: true },
  { n: "phone-light", w: 390, h: 844, dark: false, mobile: true },
  { n: "phone-dark", w: 390, h: 844, dark: true, mobile: true },
];
const only = process.argv[4];
const browser = await chromium.launch();
for (const v of views) {
  if (only && !v.n.includes(only)) continue;
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.mobile ? 2 : 1, colorScheme: v.dark ? "dark" : "light", isMobile: !!v.mobile, hasTouch: !!v.mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", e => errs.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${name}-${v.n}.png`, fullPage: false });
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  console.log(v.n, "scrollWidth", sw.join("/"), errs.length ? "ERRORS: " + errs.join(" | ") : "no console errors");
  await ctx.close();
}
await browser.close();
