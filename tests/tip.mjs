// Hover a citation and screenshot the preview.
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on("pageerror", e => errs.push(String(e)));
await p.goto("http://127.0.0.1:8777/#fit", { waitUntil: "networkidle" });
const a = p.locator('#prop-requisites a.cite').first();
await a.scrollIntoViewIfNeeded(); await a.hover(); await p.waitForTimeout(500);
const shown = await p.locator("#cite-tip:not([hidden])").count();
await p.screenshot({ path: "shots/tip.png", clip: { x: 200, y: 0, width: 880, height: 800 } });
console.log({ shown, text: (await p.textContent("#cite-tip")).slice(0, 80), errs });
await b.close();
