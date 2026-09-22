/* The PDF-viewer chrome: page counter, contents drawer, zoom, theme and print. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var sheets = Array.prototype.slice.call(document.querySelectorAll(".sheet"));
  var pageInput = document.getElementById("page-input");
  var pageCount = document.getElementById("page-count");
  var outline = document.getElementById("outline");
  var outlineBtn = document.getElementById("outline-btn");
  var outlineList = document.getElementById("outline-list");
  var scrim = document.getElementById("scrim");
  var progress = document.querySelector(".bar__progress");

  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- pages ---------- */
  pageCount.textContent = sheets.length;
  pageInput.max = sheets.length;
  sheets.forEach(function (s, i) {
    s.setAttribute("data-page", i + 1);
    var folio = s.querySelector(".sheet__folio");
    if (folio) folio.textContent = i + 1;
  });

  var current = 1;
  function setCurrent(n) {
    if (n === current) return;
    current = n;
    if (document.activeElement !== pageInput) pageInput.value = n;
    var links = outlineList.querySelectorAll("a[data-page]");
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute("aria-current", links[i].getAttribute("data-page") === String(n) && links[i].classList.contains("top") ? "true" : "false");
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var mid = window.innerHeight * 0.35, n = 1;
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getBoundingClientRect().top <= mid) n = i + 1; else break;
      }
      setCurrent(n);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.setProperty("--read", max > 0 ? Math.min(1, window.scrollY / max) : 0);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  function goToPage(n) {
    n = Math.max(1, Math.min(sheets.length, n | 0));
    var s = sheets[n - 1];
    if (s) s.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  pageInput.addEventListener("change", function () { goToPage(parseInt(pageInput.value, 10)); });
  pageInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { goToPage(parseInt(pageInput.value, 10)); pageInput.blur(); } });

  /* ---------- contents drawer, built from the section headings ---------- */
  function buildOutline() {
    var html = "";
    sheets.forEach(function (s, i) {
      var page = i + 1;
      var heads = s.querySelectorAll("h1.title, h2.sec, h3.subsec");
      if (!heads.length) return;
      heads.forEach(function (h) {
        if (!h.id) return;
        var isSub = h.classList.contains("subsec");
        var numEl = h.querySelector(".sec__n, .subsec__n");
        var num = numEl ? numEl.textContent.trim() : "";
        var text = h.classList.contains("title") ? "Title and abstract" : (h.getAttribute("data-short") || h.textContent.replace(num, "").trim());
        html += '<li class="' + (isSub ? "sub" : "") + '"><a href="#' + h.id + '" data-page="' + page + '" class="' + (isSub ? "" : "top") + '">' +
          '<span class="num">' + num + "</span><span>" + text + '</span><span class="pg">' + page + "</span></a></li>";
      });
    });
    outlineList.innerHTML = html;
  }
  buildOutline();

  function setOutline(open) {
    outline.hidden = false; scrim.hidden = false;
    outline.classList.toggle("is-open", open);
    scrim.classList.toggle("is-on", open && window.innerWidth < 1500);
    outlineBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) setTimeout(function () { if (!outline.classList.contains("is-open")) { outline.hidden = true; scrim.hidden = true; } }, 220);
    else { var a = outline.querySelector('a[aria-current="true"]') || outline.querySelector("a"); if (a) a.focus({ preventScroll: true }); }
  }
  outlineBtn.addEventListener("click", function () { setOutline(!outline.classList.contains("is-open")); });
  scrim.addEventListener("click", function () { setOutline(false); });
  outlineList.addEventListener("click", function (e) { if (e.target.closest("a") && window.innerWidth < 1500) setOutline(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && outline.classList.contains("is-open")) { setOutline(false); outlineBtn.focus(); }
  });

  /* ---------- zoom (changes the paper's type size, like a PDF viewer's zoom) ---------- */
  var zoomLevels = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
  var zoom = parseFloat(read("converge.zoom")) || 1;
  var zoomLabel = document.getElementById("zoom-level");
  function applyZoom(z) {
    zoom = z;
    doc.style.setProperty("--zoom", z);
    zoomLabel.textContent = Math.round(z * 100) + "%";
    store("converge.zoom", z === 1 ? null : String(z));
    window.dispatchEvent(new Event("resize"));
  }
  function step(dir) {
    var i = zoomLevels.indexOf(zoom);
    if (i < 0) i = 2;
    applyZoom(zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, i + dir))]);
  }
  document.getElementById("zoom-in").addEventListener("click", function () { step(1); });
  document.getElementById("zoom-out").addEventListener("click", function () { step(-1); });
  zoomLabel.textContent = Math.round(zoom * 100) + "%";

  /* ---------- theme: device → light → dark → device ---------- */
  var themeBtn = document.getElementById("theme-btn");
  var themeLabel = document.getElementById("theme-label");
  function themeText(t) { return t === "light" ? "Theme: light" : t === "dark" ? "Theme: dark" : "Theme: follows your device"; }
  function applyTheme(t) {
    if (t === "light" || t === "dark") doc.setAttribute("data-theme", t); else doc.removeAttribute("data-theme");
    themeBtn.title = themeText(t); themeLabel.textContent = themeText(t);
    store("converge.theme", t === "light" || t === "dark" ? t : null);
  }
  applyTheme(doc.getAttribute("data-theme") || "auto");
  themeBtn.addEventListener("click", function () {
    var t = doc.getAttribute("data-theme") || "auto";
    applyTheme(t === "auto" ? "light" : t === "light" ? "dark" : "auto");
  });

  /* ---------- citation previews: hover or focus [n] to read the reference in place ---------- */
  var tip = document.createElement("div");
  tip.className = "cite-tip";
  tip.setAttribute("role", "tooltip");
  tip.id = "cite-tip";
  tip.hidden = true;
  document.body.appendChild(tip);
  var tipTimer = 0;
  function showTip(a) {
    var ref = document.getElementById((a.getAttribute("href") || "").slice(1));
    if (!ref) return;
    var body = ref.querySelector("span:not(.lbl)");
    tip.innerHTML = '<span class="cite-tip__n">' + ref.querySelector(".lbl").textContent + "</span> " + (body ? body.innerHTML : "");
    tip.hidden = false;
    var r = a.getBoundingClientRect(), w = Math.min(420, window.innerWidth - 24);
    tip.style.width = w + "px";
    var left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
    tip.style.left = left + "px";
    var h = tip.offsetHeight;
    var top = r.top - h - 8 < 56 ? r.bottom + 8 : r.top - h - 8;
    tip.style.top = (top + window.scrollY) + "px";
    a.setAttribute("aria-describedby", "cite-tip");
  }
  function hideTip() { tip.hidden = true; }
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a.cite");
      if (a) { clearTimeout(tipTimer); tipTimer = setTimeout(function () { showTip(a); }, 180); }
      else if (!e.target.closest || !e.target.closest(".cite-tip")) { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 160); }
    });
  }
  document.addEventListener("focusin", function (e) { var a = e.target.closest && e.target.closest("a.cite"); if (a) showTip(a); else hideTip(); });
  window.addEventListener("scroll", function () { if (!tip.hidden && !tip.matches(":hover")) hideTip(); }, { passive: true });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });

  /* ---------- print ---------- */
  document.getElementById("print-btn").addEventListener("click", function () { window.print(); });

  onScroll();
})();
