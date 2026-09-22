// Renders tests/og.html to assets/og.png (1200x630), the link-preview image.
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await p.goto("http://127.0.0.1:8777/tests/og.html", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.screenshot({ path: "../assets/og.png" });
await b.close();
console.log("wrote assets/og.png");
