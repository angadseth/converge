/* The website's own chrome: theme toggle, chapter index that follows the page,
   reading progress, and the corner ticket for the next exam. */
(function () {
  "use strict";

  var doc = document.documentElement;
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- theme: device, light, dark ---------- */
  var themeBtn = document.getElementById("theme-btn");
  var themeTxt = document.getElementById("theme-txt");
  function label(t) { return t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"; }
  function applyTheme(t) {
    if (t === "light" || t === "dark") doc.setAttribute("data-theme", t); else doc.removeAttribute("data-theme");
    if (themeTxt) themeTxt.textContent = label(t);
    if (themeBtn) themeBtn.setAttribute("aria-label", "Theme: " + label(t) + ". Click to change.");
    store("converge.theme", t === "light" || t === "dark" ? t : null);
  }
  if (themeBtn) {
    applyTheme(doc.getAttribute("data-theme") || "auto");
    themeBtn.addEventListener("click", function () {
      var t = doc.getAttribute("data-theme") || "auto";
      applyTheme(t === "auto" ? "light" : t === "light" ? "dark" : "auto");
    });
  }

  /* ---------- chapter index follows the page ---------- */
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chapter[id]"));
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var bar = document.querySelector(".toc__bar span");
  var current = "";
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var line = window.innerHeight * 0.3, id = "";
      for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].getBoundingClientRect().top <= line) id = chapters[i].id; else break;
      }
      if (id !== current) {
        current = id;
        links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + id ? "true" : "false"); });
      }
      if (bar && chapters.length) {
        var first = chapters[0].getBoundingClientRect().top + window.scrollY;
        var last = chapters[chapters.length - 1];
        var end = last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        var p = (window.scrollY - first) / Math.max(1, end - first);
        bar.style.setProperty("--read", Math.max(0, Math.min(1, p)));
      }
      ticket();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* close the phone index after a jump */
  var tocM = document.querySelector(".toc-m");
  if (tocM) tocM.addEventListener("click", function (e) { if (e.target.closest("a")) tocM.open = false; });

  /* ---------- the ticket: next exam, after the hero, out of the way of the calendar ---------- */
  var tk = document.getElementById("ticket");
  var hero = document.querySelector(".hero");
  var term = document.getElementById("term");
  var tkReady = false;
  function ticket() {
    if (!tk || !tkReady) return;
    var heroGone = hero ? hero.getBoundingClientRect().bottom < 0 : true;
    var termBox = term ? term.getBoundingClientRect() : null;
    var termOn = termBox ? termBox.top < window.innerHeight && termBox.bottom > 0 : false;
    tk.classList.toggle("is-away", !heroGone || termOn);
  }
  if (tk && read("converge.ticket") !== "closed" && typeof window.convergeNext === "function") {
    var nx = window.convergeNext();
    if (nx) {
      var when = nx.days > 1 ? "in " + nx.days + " days" : nx.days === 1 ? "tomorrow" : nx.days === 0 ? "today" : "on now";
      tk.querySelector(".ticket__k").textContent = "Next: " + nx.date;
      tk.querySelector(".ticket__v").textContent = nx.what + " " + when;
      tk.hidden = false;
      tk.classList.add("is-away");
      tkReady = true;
      tk.querySelector(".ticket__x").addEventListener("click", function () { tk.hidden = true; store("converge.ticket", "closed"); });
    }
  }

  onScroll();
})();
