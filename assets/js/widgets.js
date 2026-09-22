/* Small interactive pieces: the readiness check. Everything stays in this browser. */
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
})();
