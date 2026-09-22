/* Small interactive pieces: readiness check, eligibility check, doubts search. Everything stays in this browser. */
(function () {
  "use strict";

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- readiness check (Table 4) ---------- */
  var form = document.getElementById("readiness");
  if (form) {
    var boxes = Array.prototype.slice.call(form.querySelectorAll('input[type="checkbox"]'));
    var out = document.getElementById("ready-out");
    var saved = {};
    try { saved = JSON.parse(read("converge.ready") || "{}") || {}; } catch (e) { saved = {}; }
    boxes.forEach(function (b) { if (saved[b.name]) b.checked = true; });

    var verdict = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      var state = {};
      boxes.forEach(function (b) { if (b.checked) state[b.name] = 1; });
      store("converge.ready", JSON.stringify(state));
      var msg;
      if (n === 0) msg = "Nothing ticked yet.";
      else if (n <= 4) msg = n + " of 10. Spend the week before the term on the unticked lines; the links below are enough.";
      else if (n <= 7) msg = n + " of 10. You are ready to start. Revise the unticked lines during the first two weeks.";
      else if (n < 10) msg = n + " of 10. You are ready.";
      else msg = "10 of 10. You are ready.";
      out.textContent = msg;
      form.setAttribute("data-score", String(n));
    };
    form.addEventListener("change", verdict);
    verdict();
  }

  /* ---------- end term eligibility (Propositions 2 and 3) ---------- */
  var elig = document.getElementById("elig");
  if (elig) {
    var names = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "mock"];
    var stampEl = elig.querySelector("[data-verdict]");
    var detailEl = elig.querySelector("[data-detail]");
    var quizBox = elig.querySelector('input[name="quiz"]');

    try {
      var prev = JSON.parse(read("converge.elig") || "{}") || {};
      names.forEach(function (n) { if (prev[n] !== undefined && prev[n] !== "") elig.elements[n].value = prev[n]; });
      if (prev.quiz) quizBox.checked = true;
      if (prev.course === "mlp") elig.querySelector('input[value="mlp"]').checked = true;
    } catch (e) {}

    var score = function (v) {
      var x = parseFloat(v);
      if (!isFinite(x)) return null;
      return Math.max(0, Math.min(100, x));
    };
    var fmt1 = function (x) { return (Math.round(x * 10) / 10).toString(); };

    var update = function () {
      var course = elig.querySelector('input[name="ecourse"]:checked').value;
      elig.setAttribute("data-course", course);
      quizBox.disabled = course === "mlp";
      var raw = names.map(function (n) { return elig.elements[n].value; });
      var save = { course: course, quiz: quizBox.checked };
      names.forEach(function (n, i) { save[n] = raw[i]; });
      store("converge.elig", JSON.stringify(save));

      var entered = raw.filter(function (v) { return score(v) !== null; }).length;
      if (!entered) { stampEl.textContent = ""; detailEl.textContent = "Enter at least one score."; return; }
      var vals = raw.map(function (v) { var s = score(v); return s === null ? 0 : s; }).sort(function (a, b) { return b - a; });
      var best5 = vals.slice(0, 5);
      var avg = best5.reduce(function (a, b) { return a + b; }, 0) / 5;
      var needQuiz = course === "theory";
      var okAvg = avg >= 40, okQuiz = !needQuiz || quizBox.checked;
      var ok = okAvg && okQuiz;
      stampEl.textContent = ok ? "Eligible" : "Not yet eligible";
      stampEl.setAttribute("data-ok", ok ? "true" : "false");

      var parts = ["Best 5 average: " + fmt1(avg) + " (needs 40)."];
      if (!okAvg) {
        var gap = 40 * 5 - best5.reduce(function (a, b) { return a + b; }, 0);
        parts.push("You are " + fmt1(gap) + " marks short across your best five.");
      }
      if (needQuiz && !quizBox.checked) parts.push("You must also attend at least one quiz.");
      if (entered < 8 && ok) parts.push("Missing scores were counted as zero.");
      detailEl.textContent = parts.join(" ");
    };
    elig.addEventListener("input", update);
    elig.addEventListener("change", update);
    update();
  }

  /* ---------- Appendix A: search the doubts ---------- */
  var q = document.getElementById("faq-q");
  var faq = document.getElementById("faq");
  if (q && faq) {
    var items = Array.prototype.slice.call(faq.querySelectorAll("details"));
    var count = document.getElementById("faq-count");
    var empty = document.getElementById("faq-empty");
    var norm = function (t) { return t.toLowerCase().replace(/\s+/g, " "); };
    var texts = items.map(function (d) { return norm(d.textContent); });
    var filter = function () {
      var words = norm(q.value).trim().split(" ").filter(Boolean);
      var shown = 0;
      items.forEach(function (d, i) {
        var hit = words.every(function (w) { return texts[i].indexOf(w) !== -1; });
        d.hidden = !hit;
        if (hit) shown++;
        if (words.length && hit && shown <= 3) d.open = true;
        if (!words.length) d.open = false;
      });
      count.textContent = words.length ? shown + " of " + items.length : items.length + " doubts";
      empty.hidden = shown !== 0;
    };
    q.addEventListener("input", filter);
    filter();
  }
})();
