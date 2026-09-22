import { chromium } from "playwright";
const b = await chromium.launch();
for (const [w, dark] of [[1366, false], [390, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: dark ? "dark" : "light", deviceScaleFactor: 1 });
  await p.goto("https://angadseth.github.io/tds-field-guide/", { waitUntil: "networkidle" });
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 0, y = 0; y < Math.min(h, 9000); i++, y += 1800) {
    await p.evaluate(yy => window.scrollTo(0, yy), y); await p.waitForTimeout(250);
    await p.screenshot({ path: `shots/tds-${w}-${i}.png`, clip: { x: 0, y, width: w, height: 1800 }, fullPage: true });
  }
  console.log(w, "height", h);
  await p.close();
}
await b.close();
