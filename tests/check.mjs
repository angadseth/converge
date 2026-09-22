// Converge checks. Run against the local server or the live site:
//   node check.mjs                       (http://127.0.0.1:8777/)
//   node check.mjs https://angadseth.github.io/converge/ --links
// --links also requests every external link on the page.
import { chromium } from "playwright";

const url = process.argv.find(a => a.startsWith("http")) || "http://127.0.0.1:8777/";
const checkLinks = process.argv.includes("--links");
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log("  ok   " + msg); else { failures++; console.log("  FAIL " + msg); } };

const browser = await chromium.launch();

/* ---------- 1. layout in every viewport and theme ---------- */
const views = [
  { n: "desktop", w: 1440, h: 900 }, { n: "laptop", w: 1280, h: 760 }, { n: "tablet", w: 820, h: 1180, touch: true },
  { n: "phone", w: 390, h: 844, touch: true }, { n: "small phone", w: 360, h: 740, touch: true }, { n: "tiny", w: 320, h: 640, touch: true },
];
for (const v of views) {
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, colorScheme: scheme, isMobile: !!v.touch, hasTouch: !!v.touch, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
      const wide = [...document.querySelectorAll(".sheet *")].filter(el => {
        const b = el.getBoundingClientRect(); return b.width > 0 && b.right > iw + 1 && !el.closest(".tbl__wrap, pre, .eq__body");
      }).slice(0, 3).map(el => el.tagName + "." + el.className);
      return { sw, iw, wide, fonts: document.fonts.check("16px 'CMU Serif'"), sheets: document.querySelectorAll(".sheet").length };
    });
    const tag = `${v.n} ${scheme}`;
    ok(r.sw <= r.iw, `${tag}: no sideways scroll (${r.sw} <= ${r.iw})${r.wide.length ? " offenders " + r.wide.join(", ") : ""}`);
    ok(errs.length === 0, `${tag}: no console errors${errs.length ? " -> " + errs.join(" | ") : ""}`);
    ok(r.fonts, `${tag}: CMU Serif loaded`);
    await ctx.close();
  }
}

/* ---------- 2. structure and behaviour ---------- */
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });

const anchors = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('a[href^="#"]').forEach(a => { const id = a.getAttribute("href").slice(1); if (id && !document.getElementById(id)) bad.push(a.getAttribute("href")); });
  const cites = [...document.querySelectorAll("a.cite")].map(a => a.getAttribute("href"));
  const refs = [...document.querySelectorAll(".refs li[id]")].map(li => "#" + li.id);
  const unused = refs.filter(r => !cites.includes(r));
  const ids = [...document.querySelectorAll("[id]")].map(e => e.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  return { bad, cites: cites.length, refs: refs.length, unused, dup };
});
ok(anchors.bad.length === 0, `every internal link resolves${anchors.bad.length ? " -> " + anchors.bad.join(", ") : ""}`);
ok(anchors.dup.length === 0, `no duplicate ids${anchors.dup.length ? " -> " + anchors.dup.join(", ") : ""}`);
ok(anchors.refs >= 45, `${anchors.refs} references, ${anchors.cites} citations`);
ok(anchors.unused.length === 0, `every reference is cited somewhere${anchors.unused.length ? " -> uncited " + anchors.unused.join(", ") : ""}`);

const count = await page.textContent("#page-count");
const sheets = await page.locator(".sheet").count();
ok(String(sheets) === count, `page counter shows ${count} of ${sheets} sheets`);
const outlineItems = await page.locator("#outline-list a").count();
ok(outlineItems >= 20, `contents drawer lists ${outlineItems} headings`);
await page.click("#outline-btn");
ok(await page.locator("#outline.is-open").count() === 1, "contents drawer opens");
await page.keyboard.press("Escape");
ok(await page.locator("#outline.is-open").count() === 0, "Escape closes it");

// page jump
await page.fill("#page-input", "9"); await page.press("#page-input", "Enter"); await page.waitForTimeout(700);
const inView = await page.evaluate(() => { const b = document.getElementById("p9").getBoundingClientRect(); return b.top < 200 && b.bottom > 0; });
ok(inView, "typing a page number jumps to that page");

// Figure 1 runs to the MLP basin with the defaults
await page.locator("#fig-descent").scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
const log = await page.textContent("[data-log]");
ok(/MLP basin/.test(log), `Figure 1 default run converges in MLP: "${log}"`);
await page.evaluate(() => { const b = document.querySelector("[data-beta]"); b.value = "0"; b.dispatchEvent(new Event("input", { bubbles: true })); });
await page.waitForTimeout(600);
ok(/MLF basin/.test(await page.textContent("[data-log]")), "with no momentum it gets stuck in MLF");
await page.evaluate(() => { const b = document.querySelector("[data-beta]"); b.value = "0.9"; const e = document.querySelector("[data-eta]"); e.value = "0.9"; e.dispatchEvent(new Event("input", { bubbles: true })); });
await page.waitForTimeout(600);
ok(/Diverged|bouncing/.test(await page.textContent("[data-log]")), "with a huge learning rate it diverges");

// calculator maths, straight from Equations (1), (3), (4)
const fill = async vals => { for (const [k, v] of Object.entries(vals)) await page.fill(`[data-inputs] input[name="${k}"]`, String(v)); };
await page.click('[data-course="mlf"]'); await fill({ gaa: 80, q1: 50, q2: 70, F: 60, bonus: "" });
ok(/T = 61\.5/.test(await page.textContent("[data-total]")), "MLF example gives T = 61.5 (Section 4.4)");
await fill({ gaa: 100, q1: 0, q2: 0, F: 100 });
ok(/T = 65(?![.\d])/.test(await page.textContent("[data-total]")), "MLF with no quizzes: 5 + 60 = 65");
await page.click('[data-course="mlt"]'); await fill({ gaa: 60, q1: 90, q2: 40, F: 70, bonus: 3 });
ok(/T = 67\.5 \+ 3 bonus = 70\.5/.test(await page.textContent("[data-total]")), "MLT: 3 + max(42+22.5, 28+22.5+12) = 67.5, +3 bonus");
await page.click('[data-course="mlp"]'); await fill({ gaa: 90, o1: 35, o2: 70, ka: 85, F: 55, bonus: "" });
ok(/T = 63\.5/.test(await page.textContent("[data-total]")), "MLP: 9 + 16.5 + 7 + 14 + 17 = 63.5");
await fill({ o2: 30 });
ok(/No pass grade/.test(await page.textContent("[data-total]")), "MLP with both OPPEs below 40 gets no pass grade");
await page.click('[data-course="proj"]'); await fill({ nb: 8, m: 5, l: 22, s: 4, V: 24, bonus: 5 });
ok(/No pass grade/.test(await page.textContent("[data-total]")), "project with viva 24 does not pass");
await fill({ V: 30 });
ok(/T = 69 \+ 5 bonus = 74/.test(await page.textContent("[data-total]")), "project: 8+5+22+4+30 = 69, +5 = 74");

// eligibility
const setElig = async (vals, quiz, course) => {
  await page.check(`#elig input[value="${course}"]`);
  for (const [k, v] of Object.entries(vals)) await page.fill(`#elig input[name="${k}"]`, String(v));
  if (course === "theory") { if (quiz) await page.check('#elig input[name="quiz"]'); else await page.uncheck('#elig input[name="quiz"]'); }
};
await setElig({ w1: 80, w2: 60, w3: 40, w4: 20, w5: 0, w6: 0, w7: 0, mock: 0 }, true, "theory");
ok((await page.textContent("[data-verdict]")) === "Eligible", "best 5 = (80+60+40+20+0)/5 = 40: eligible");
await setElig({ w1: 79 }, true, "theory");
ok((await page.textContent("[data-verdict]")) === "Not yet eligible", "39.8: not eligible");
await setElig({ w1: 80 }, false, "theory");
ok((await page.textContent("[data-verdict]")) === "Not yet eligible", "no quiz attended: not eligible for MLF/MLT");
await setElig({}, false, "mlp");
ok((await page.textContent("[data-verdict]")) === "Eligible", "MLP needs no quiz");

// doubts search
await page.fill("#faq-q", "GPU");
const visible = await page.locator("#faq details:not([hidden])").count();
ok(visible === 1, `searching "GPU" leaves ${visible} doubt`);
await page.fill("#faq-q", "zzzz");
ok(await page.locator("#faq-empty:not([hidden])").count() === 1, "no match shows the empty message");
await page.fill("#faq-q", "");

// theme cycle and zoom
const theme = async () => page.evaluate(() => document.documentElement.getAttribute("data-theme") || "auto");
const t0 = await theme(); await page.click("#theme-btn"); const t1 = await theme(); await page.click("#theme-btn"); const t2 = await theme(); await page.click("#theme-btn"); const t3 = await theme();
ok(t0 === "auto" && t1 === "light" && t2 === "dark" && t3 === "auto", `theme cycles auto > light > dark > auto (${[t0, t1, t2, t3].join(" > ")})`);
await page.click("#zoom-in");
ok((await page.textContent("#zoom-level")) === "110%", "zoom in to 110%");
await page.click("#zoom-out");

// readiness check persists
await page.check('#readiness input[name="r1"]'); await page.check('#readiness input[name="r2"]');
await page.reload({ waitUntil: "networkidle" });
ok(await page.isChecked('#readiness input[name="r2"]'), "readiness ticks survive a reload");
ok(/2 of 10/.test(await page.textContent("#ready-out")), "readiness verdict counts 2 of 10");
await ctx.close();

/* ---------- 3. storage blocked: the page must still work ---------- */
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await ctx2.addInitScript(() => {
  Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
});
const p2 = await ctx2.newPage();
const errs2 = []; p2.on("pageerror", e => errs2.push(String(e)));
await p2.goto(url, { waitUntil: "networkidle" });
await p2.click('[data-course="mlp"]');
await p2.fill('[data-inputs] input[name="F"]', "50");
ok(errs2.length === 0, `works with storage blocked${errs2.length ? " -> " + errs2.join(" | ") : ""}`);
await ctx2.close();

/* ---------- 4. external links ---------- */
if (checkLinks) {
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(url, { waitUntil: "networkidle" });
  const links = await p3.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="http"]')].map(a => a.href))]);
  const results = await Promise.all(links.map(async l => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(l, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36" }, signal: AbortSignal.timeout(25000) });
        if (r.status < 400 || r.status === 403 && /medium\.com|kaggle\.com/.test(l)) return [l, r.status];
        if (attempt) return [l, r.status];
      } catch (e) { if (attempt) return [l, "ERR " + e.name]; }
    }
  }));
  const bad = results.filter(([, s]) => typeof s !== "number" || s >= 400);
  ok(bad.length === 0, `${links.length} external links respond${bad.length ? " -> " + bad.map(b => b.join(" ")).join(", ") : ""}`);
  await ctx3.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
