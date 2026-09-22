// Converge checks, for the website (root) and the paper edition (/paper/).
//   node check.mjs                                   local, http://127.0.0.1:8777/
//   node check.mjs https://angadseth.github.io/converge/ --links
// --links also requests every external link on both pages.
import { chromium } from "playwright";

const base = (process.argv.find(a => a.startsWith("http")) || "http://127.0.0.1:8777/").replace(/\?.*$/, "").replace(/\/?$/, "/");
const bust = (process.argv.find(a => a.startsWith("http")) || "").includes("?") ? "?" + process.argv.find(a => a.startsWith("http")).split("?")[1] : "";
const SITE = base + bust, PAPER = base + "paper/" + bust;
const checkLinks = process.argv.includes("--links");
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log("  ok   " + msg); else { failures++; console.log("  FAIL " + msg); } };
const browser = await chromium.launch();

/* ---------- 1. layout in every viewport and theme, both editions ---------- */
const views = [
  { n: "desktop", w: 1440, h: 900 }, { n: "laptop", w: 1280, h: 760 }, { n: "tablet", w: 820, h: 1180, touch: true },
  { n: "phone", w: 390, h: 844, touch: true }, { n: "small phone", w: 360, h: 740, touch: true }, { n: "tiny", w: 320, h: 640, touch: true },
];
for (const [label, url, font] of [["site", SITE, "Bricolage Grotesque"], ["paper", PAPER, "CMU Serif"]]) {
  console.log(`\n[${label}] layout`);
  for (const v of views) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, colorScheme: scheme, isMobile: !!v.touch, hasTouch: !!v.touch, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", e => errs.push(String(e)));
      page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const r = await page.evaluate(f => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, font: document.fonts.check(`16px '${f}'`) }), font);
      const tag = `${label} ${v.n} ${scheme}`;
      ok(r.sw <= r.iw, `${tag}: no sideways scroll (${r.sw} <= ${r.iw})`);
      ok(errs.length === 0, `${tag}: no console errors${errs.length ? " -> " + errs.join(" | ") : ""}`);
      ok(r.font, `${tag}: ${font} loaded`);
      await ctx.close();
    }
  }
}

/* ---------- 2. the website's behaviour ---------- */
console.log("\n[site] behaviour");
const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(SITE, { waitUntil: "networkidle" });

const a = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('a[href^="#"]').forEach(x => { const id = x.getAttribute("href").slice(1); if (id && !document.getElementById(id)) bad.push(x.getAttribute("href")); });
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id);
  return { bad, dup: ids.filter((id, i) => ids.indexOf(id) !== i), chapters: document.querySelectorAll(".chapter").length, toc: document.querySelectorAll(".toc a").length, made: document.querySelector(".foot__made").textContent.trim() };
});
ok(a.bad.length === 0, `every internal link resolves${a.bad.length ? " -> " + a.bad.join(", ") : ""}`);
ok(a.dup.length === 0, `no duplicate ids${a.dup.length ? " -> " + a.dup.join(", ") : ""}`);
ok(a.chapters === 12 && a.toc === 12, `12 chapters, 12 index entries (${a.chapters}, ${a.toc})`);
ok(a.made === "Made by Angad Jangir", `credit reads "${a.made}"`);
ok(await page.locator('a[href="paper/"]').count() >= 2, "links to the paper edition");

await page.locator("#mlt").scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, 200)); await page.waitForTimeout(400);
ok(await page.locator('.toc a[href="#mlt"][aria-current="true"]').count() === 1, "the chapter index marks MLT while you read it");

await page.locator("#fig-descent").scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
ok(/MLP basin/.test(await page.textContent("[data-log]")), "Figure 1 converges in MLP with the defaults");
await page.evaluate(() => { const b = document.querySelector("[data-beta]"); b.value = "0"; b.dispatchEvent(new Event("input", { bubbles: true })); });
await page.waitForTimeout(600);
ok(/MLF basin/.test(await page.textContent("[data-log]")), "no momentum: stuck in MLF");

ok(/Next:/.test(await page.textContent("[data-next]")), "calendar shows the next event");
await page.click('[data-term="2027-01"]');
ok(/2027/.test(await page.textContent("[data-cal-table] tbody")), "switching to Jan 2027 updates the dates");

const fill = async vals => { for (const [k, v] of Object.entries(vals)) await page.fill(`[data-inputs] input[name="${k}"]`, String(v)); };
await page.click('[data-course="mlf"]'); await fill({ gaa: 80, q1: 50, q2: 70, F: 60, bonus: "" });
ok(/T = 61\.5/.test(await page.textContent("[data-total]")), "MLF example gives 61.5");
await page.click('[data-course="mlp"]'); await fill({ gaa: 90, o1: 35, o2: 70, ka: 85, F: 55, bonus: "" });
ok(/T = 63\.5/.test(await page.textContent("[data-total]")), "MLP gives 63.5");
await fill({ o2: 30 });
ok(/No pass grade/.test(await page.textContent("[data-total]")), "MLP without an OPPE of 40 has no pass grade");
await page.click('[data-course="proj"]'); await fill({ nb: 8, m: 5, l: 22, s: 4, V: 30, bonus: 5 });
ok(/T = 69 \+ 5 bonus = 74/.test(await page.textContent("[data-total]")), "project gives 69 + 5 = 74");

await page.check('#elig input[value="theory"]');
for (const [k, v] of Object.entries({ w1: 80, w2: 60, w3: 40, w4: 20, w5: 0, w6: 0, w7: 0, mock: 0 })) await page.fill(`#elig input[name="${k}"]`, String(v));
await page.check('#elig input[name="quiz"]');
ok((await page.textContent("[data-verdict]")) === "Eligible", "eligibility: best 5 average 40 is eligible");
await page.uncheck('#elig input[name="quiz"]');
ok((await page.textContent("[data-verdict]")) === "Not yet eligible", "eligibility: no quiz, not eligible");

await page.fill("#faq-q", "GPU");
ok(await page.locator("#faq details:not([hidden])").count() === 1, "doubts search finds the GPU question");
await page.fill("#faq-q", "");

const th = async () => page.evaluate(() => document.documentElement.getAttribute("data-theme") || "auto");
const t = [await th()]; for (let i = 0; i < 3; i++) { await page.click("#theme-btn"); t.push(await th()); }
ok(t.join(">") === "auto>light>dark>auto", `theme cycles ${t.join(" > ")}`);

await page.check('#readiness input[name="r1"]');
await page.reload({ waitUntil: "networkidle" });
ok(await page.isChecked('#readiness input[name="r1"]'), "readiness ticks survive a reload");

await page.evaluate(() => window.scrollTo(0, document.getElementById("mlf").offsetTop));
await page.waitForTimeout(400);
const tk = await page.evaluate(() => { const e = document.getElementById("ticket"); return { hidden: e.hidden, away: e.classList.contains("is-away"), text: e.textContent.replace(/\s+/g, " ").trim() }; });
ok(!tk.hidden && !tk.away && /Next:/.test(tk.text), `next-exam ticket shows after the hero: "${tk.text}"`);
await ctx.close();

/* storage blocked */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await ctx2.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
const p2 = await ctx2.newPage();
const errs2 = []; p2.on("pageerror", e => errs2.push(String(e)));
await p2.goto(SITE, { waitUntil: "networkidle" });
await p2.click('[data-course="mlp"]'); await p2.fill('[data-inputs] input[name="F"]', "50");
ok(errs2.length === 0, `site works with storage blocked${errs2.length ? " -> " + errs2.join(" | ") : ""}`);
await ctx2.close();

/* ---------- 3. the paper edition still holds together ---------- */
console.log("\n[paper] structure");
const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const p3 = await ctx3.newPage();
await p3.goto(PAPER, { waitUntil: "networkidle" });
const pa = await p3.evaluate(() => {
  const bad = [];
  document.querySelectorAll('a[href^="#"]').forEach(x => { const id = x.getAttribute("href").slice(1); if (id && !document.getElementById(id)) bad.push(x.getAttribute("href")); });
  const cites = [...document.querySelectorAll("a.cite")].map(x => x.getAttribute("href"));
  const refs = [...document.querySelectorAll(".refs li[id]")].map(li => "#" + li.id);
  return { bad, refs: refs.length, unused: refs.filter(r => !cites.includes(r)), sheets: document.querySelectorAll(".sheet").length, count: document.getElementById("page-count").textContent };
});
ok(pa.bad.length === 0, `paper: every internal link resolves${pa.bad.length ? " -> " + pa.bad.join(", ") : ""}`);
ok(pa.unused.length === 0, `paper: all ${pa.refs} references cited`);
ok(String(pa.sheets) === pa.count, `paper: page counter ${pa.count} of ${pa.sheets}`);
await p3.locator("#fig-descent").scrollIntoViewIfNeeded(); await p3.waitForTimeout(600);
ok(/MLP basin/.test(await p3.textContent("[data-log]")), "paper: Figure 1 still runs");
await ctx3.close();

/* ---------- 4. external links on both pages ---------- */
if (checkLinks) {
  console.log("\n[links]");
  const ctx4 = await browser.newContext();
  const p4 = await ctx4.newPage();
  const all = new Set();
  for (const u of [SITE, PAPER]) {
    await p4.goto(u, { waitUntil: "networkidle" });
    (await p4.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map(x => x.href))).forEach(l => all.add(l));
  }
  const links = [...all].filter(l => !l.startsWith(base));
  const results = await Promise.all(links.map(async l => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(l, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36" }, signal: AbortSignal.timeout(25000) });
        if (r.status < 400) return [l, r.status];
        if (r.status === 403 && /medium\.com/.test(l)) return [l, "bot wall (403 to scripts; opens in a browser)"];
        if (attempt) return [l, r.status];
      } catch (e) { if (attempt) return [l, "ERR " + e.name]; }
    }
  }));
  const walled = results.filter(([, s]) => typeof s === "string" && s.startsWith("bot wall"));
  if (walled.length) console.log("  note " + walled.length + " link(s) behind a bot wall: " + walled.map(w => w[0]).join(", "));
  const bad = results.filter(([, s]) => !(typeof s === "string" && s.startsWith("bot wall")) && (typeof s !== "number" || s >= 400));
  ok(bad.length === 0, `${links.length} external links respond${bad.length ? " -> " + bad.map(b => b.join(" ")).join(", ") : ""}`);
  await ctx4.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
