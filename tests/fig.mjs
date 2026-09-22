// Screenshot one element: node fig.mjs <selector> <name> [dark] [width]
import { chromium } from "playwright";
const [sel, name, dark, width] = process.argv.slice(2);
const w = parseInt(width || "1366", 10);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 500 ? 2 : 1, colorScheme: dark === "dark" ? "dark" : "light", reducedMotion: "reduce" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push(String(e)));
page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await page.goto(process.env.URL || "http://127.0.0.1:8777/", { waitUntil: "networkidle" });
const el = page.locator(sel).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await el.screenshot({ path: `shots/${name}.png` });
console.log(name, errs.length ? "ERRORS " + errs.join(" | ") : "ok");
await browser.close();
