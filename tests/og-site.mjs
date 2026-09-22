// Renders the website's link-preview image (assets/og-site.png) from its own hero.
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "light" });
await p.goto("http://127.0.0.1:8777/", { waitUntil: "networkidle" });
await p.addStyleTag({ content: `
  .hero { padding-top: 34px; } .hero__lede, .hero__warn, .ledger-stats, .slab, .term, .descent__ctl, .hero__fig figcaption { display: none !important; }
  .hero h1 { font-size: 92px; } .hero__grid { gap: 40px; align-items: center; }
  .og-url { margin: 26px 0 0; font-family: var(--mono); font-size: 20px; color: var(--teal); }
  .og-sub { margin: 22px 0 0; font-size: 23px; line-height: 1.45; color: var(--ink-2); max-width: 30em; }` });
await p.evaluate(() => {
  const h1 = document.querySelector(".hero h1");
  h1.insertAdjacentHTML("afterend", '<p class="og-sub">Week maps, every grading formula, a marks calculator, the Sep 2026 exam calendar and every resource worth opening.</p><p class="og-url">angadseth.github.io/converge</p>');
});
await p.waitForTimeout(1200);
await p.screenshot({ path: "../assets/og-site.png" });
await b.close();
console.log("wrote assets/og-site.png");
