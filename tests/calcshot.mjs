// Fill the calculator and screenshot it for each course.
import { chromium } from "playwright";
const dark = process.argv[2] === "dark", w = parseInt(process.argv[3] || "1366", 10);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 500 ? 2 : 1, colorScheme: dark ? "dark" : "light", reducedMotion: "reduce" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(String(e)));
await page.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
const fill = async (vals) => { for (const [k, v] of Object.entries(vals)) await page.fill(`[data-inputs] input[name="${k}"]`, String(v)); };
await page.click('[data-course="mlf"]'); await fill({ gaa: 80, q1: 50, q2: 70, F: 60 });
const t1 = await page.textContent("[data-total]");
await page.locator("#calc-fig").screenshot({ path: `shots/calc-mlf${dark ? "-dark" : ""}-${w}.png` });
await page.click('[data-course="mlp"]'); await fill({ gaa: 90, o1: 35, o2: 70, ka: 85, F: 55 });
const t2 = await page.textContent("[data-total]");
await page.click('[data-course="proj"]'); await fill({ nb: 8, m: 5, l: 22, s: 4, V: 30, bonus: 5 });
const t3 = await page.textContent("[data-total]");
await page.locator("#calc-fig").screenshot({ path: `shots/calc-proj${dark ? "-dark" : ""}-${w}.png` });
console.log({ t1, t2, t3, errs });
await browser.close();
