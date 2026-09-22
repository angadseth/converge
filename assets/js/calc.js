/* Figure 3: the marks calculator. Applies Equations (1)-(4) from the grading documents,
   plots the total against the one score you do not know yet, and solves for each grade. */
(function () {
  "use strict";

  var root = document.querySelector("[data-calc]");
  if (!root) return;

  var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-course]"));
  var inputsEl = root.querySelector("[data-inputs]");
  var totalEl = root.querySelector("[data-total]");
  var noteEl = root.querySelector("[data-note]");
  var plot = root.querySelector("[data-plot]");
  var needBody = root.querySelector("[data-need] tbody");
  var needHead = root.querySelector("[data-need-h]");

  var BANDS = [["S", 90], ["A", 80], ["B", 70], ["C", 60], ["D", 50], ["E", 40]];

  function num(v, max) {
    var x = parseFloat(v);
    if (!isFinite(x)) return null;
    return Math.max(0, Math.min(max, x));
  }
  function theory(v, F) {
    var q1 = v.q1 || 0, q2 = v.q2 || 0;
    return 0.05 * (v.gaa || 0) + Math.max(0.6 * F + 0.25 * Math.max(q1, q2), 0.4 * F + 0.25 * q1 + 0.3 * q2);
  }

  var COURSES = {
    mlf: {
      name: "MLF", color: "--c-mlf", eq: "(1)", x: "F", xMax: 100, xLabel: "end term score F", pass: 40,
      fields: [["gaa", "GAA", 100], ["q1", "Quiz 1", 100], ["q2", "Quiz 2", 100], ["F", "End term F", 100], ["bonus", "Bonus", 5]],
      total: theory,
      notes: function (v) {
        var n = [];
        if (!v.q1 && !v.q2) n.push("Attend at least one quiz, or you cannot sit the end term.");
        return n;
      },
      ok: function (v, T) { return T >= 40; }
    },
    mlt: {
      name: "MLT", color: "--c-mlt", eq: "(2)", x: "F", xMax: 100, xLabel: "end term score F", pass: 40,
      fields: [["gaa", "GAA", 100], ["q1", "Quiz 1", 100], ["q2", "Quiz 2", 100], ["F", "End term F", 100], ["bonus", "Bonus", 5]],
      total: theory,
      notes: function (v) {
        var n = [];
        if (!v.q1 && !v.q2) n.push("Attend at least one quiz, or you cannot sit the end term.");
        n.push("MLT's programming-assignment bonus is 3 marks if your assignment average is at least 40; add it under Bonus.");
        return n;
      },
      ok: function (v, T) { return T >= 40; }
    },
    mlp: {
      name: "MLP", color: "--c-mlp", eq: "(3)", x: "F", xMax: 100, xLabel: "end term score F", pass: 40,
      fields: [["gaa", "GAA", 100], ["o1", "OPPE 1", 100], ["o2", "OPPE 2", 100], ["ka", "KA average", 100], ["F", "End term F", 100], ["bonus", "Bonus", 5]],
      total: function (v, F) { return 0.1 * (v.gaa || 0) + 0.3 * F + 0.2 * (v.o1 || 0) + 0.2 * (v.o2 || 0) + 0.2 * (v.ka || 0); },
      notes: function (v) {
        var n = [];
        var best = Math.max(v.o1 || 0, v.o2 || 0);
        if (v.o1 === null && v.o2 === null) n.push("Enter your OPPE scores when you have them; a grade needs at least 40 in one of them.");
        else if (best < 40) n.push("Neither OPPE is 40 yet, so there is no grade this term: I_OP if your total reaches 40 (35 if you missed both OPPEs), otherwise U (Table 9).");
        return n;
      },
      ok: function (v, T) { return T >= 40 && Math.max(v.o1 || 0, v.o2 || 0) >= 40; }
    },
    proj: {
      name: "MLP Project", color: "--c-proj", eq: "(4)", x: "V", xMax: 50, xLabel: "viva score V", pass: 50,
      fields: [["nb", "Notebook /10", 10], ["m", "Milestones /5", 5], ["l", "Leaderboard /30", 30], ["s", "Submissions /5", 5], ["V", "Viva /50", 50], ["bonus", "Batch bonus", 5]],
      total: function (v, V) { return (v.nb || 0) + (v.m || 0) + (v.l || 0) + (v.s || 0) + V; },
      notes: function (v) {
        var n = [];
        if (v.V !== null && v.V < 25 && v.V >= 15) n.push("A viva between 15 and 24 may still pass with a D or E, at the instructor's discretion.");
        if (v.V !== null && v.V < 15) n.push("A viva below 15 means repeating the project next term.");
        return n;
      },
      ok: function (v, T, V) { return T >= 50 && V >= 25; }
    }
  };

  var state = { course: "mlf", values: {} };
  try {
    var saved = JSON.parse(localStorage.getItem("converge.calc") || "{}");
    if (saved && typeof saved === "object") { state.values = saved.values || {}; if (COURSES[saved.course]) state.course = saved.course; }
  } catch (e) {}
  function save() { try { localStorage.setItem("converge.calc", JSON.stringify(state)); } catch (e) {} }

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, ""); }
  function grade(T) { for (var i = 0; i < BANDS.length; i++) if (T >= BANDS[i][1]) return BANDS[i][0]; return "U"; }

  function buildInputs() {
    var c = COURSES[state.course], vals = state.values[state.course] || {};
    inputsEl.innerHTML = c.fields.map(function (f) {
      var v = vals[f[0]] !== undefined ? vals[f[0]] : "";
      return '<label class="calc__f"><span>' + f[1] + '</span><input type="number" inputmode="decimal" min="0" max="' + f[2] + '" step="any" name="' + f[0] + '" value="' + v + '"></label>';
    }).join("");
    needHead.textContent = state.course === "proj" ? "Viva needed" : "End term needed";
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-course") === state.course ? "true" : "false"); });
  }

  function readValues() {
    var c = COURSES[state.course], v = {}, raw = {};
    c.fields.forEach(function (f) {
      var el = inputsEl.querySelector('input[name="' + f[0] + '"]');
      raw[f[0]] = el ? el.value : "";
      v[f[0]] = num(raw[f[0]], f[2]);
    });
    state.values[state.course] = raw;
    save();
    return v;
  }

  /* smallest x in [0, xMax] with total(x) >= target (total is increasing in x) */
  function solve(c, v, target) {
    if (c.total(v, c.xMax) < target - 1e-9) return null;
    if (c.total(v, 0) >= target) return 0;
    var lo = 0, hi = c.xMax;
    for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (c.total(v, mid) >= target) hi = mid; else lo = mid; }
    return hi;
  }

  function render() {
    var c = COURSES[state.course], v = readValues();
    var bonus = v.bonus || 0, xKey = c.x, x = v[xKey];
    var notes = c.notes(v);

    if (x !== null) {
      var T = c.total(v, x);
      var pass = c.ok(v, T, x);
      var shown = pass ? Math.min(100, T + bonus) : T;
      totalEl.innerHTML = "<var>T</var> = " + fmt(T) + (pass && bonus ? " + " + fmt(bonus) + " bonus = <b>" + fmt(shown) + "</b>" : "") +
        '<span class="calc__grade">' + (pass ? "Grade " + grade(shown) : "No pass grade") + "</span>";
      if (!pass && T >= c.pass) notes.unshift("Your total clears " + c.pass + ", but a condition above is not met.");
    } else {
      totalEl.innerHTML = "Enter " + (xKey === "F" ? "an end term score" : "a viva score") + " to see your total, or read the table below for what you need.";
    }
    noteEl.textContent = notes.join(" ");

    /* what each grade needs */
    var rows = BANDS.map(function (b) {
      var passT = c.pass;
      var needT = Math.max(passT, b[1] - bonus);
      if (state.course === "proj" && b[1] < 50) return null;
      var sx = solve(c, v, needT);
      if (state.course === "proj" && sx !== null) sx = Math.max(sx, 25);
      var cell = sx === null ? '<span class="muted">out of reach</span>' : (sx <= 0 ? "already there" : fmt(Math.ceil(sx * 10) / 10));
      return "<tr><td>" + b[0] + '</td><td class="num">' + b[1] + (bonus ? ' <span class="muted">(' + fmt(needT) + " before bonus)</span>" : "") + '</td><td class="num">' + cell + "</td></tr>";
    }).filter(Boolean);
    needBody.innerHTML = rows.join("");

    drawPlot(c, v, bonus);
  }

  function drawPlot(c, v, bonus) {
    /* draw in real CSS pixels so the axis text stays readable on a phone */
    var W = Math.round(Math.max(300, Math.min(760, plot.clientWidth || 624)));
    var H = W < 480 ? Math.round(W * 0.66) : 280;
    var m = { l: 46, r: 30, t: 12, b: 40 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    var ink = css("--ink"), ink2 = css("--ink-2"), hair = css("--hair"), fill = css("--fill"), col = css(c.color);
    function X(x) { return m.l + x / c.xMax * pw; }
    function Y(t) { return m.t + (1 - t / 100) * ph; }
    var s = "";
    /* failing region */
    s += '<rect x="' + m.l + '" y="' + Y(c.pass) + '" width="' + pw + '" height="' + (Y(0) - Y(c.pass)) + '" fill="' + fill + '"/>';
    /* grade lines */
    BANDS.forEach(function (b) {
      if (state.course === "proj" && b[1] < 50) return;
      s += '<line x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + Y(b[1]) + '" y2="' + Y(b[1]) + '" stroke="' + hair + '" stroke-dasharray="4 4"/>';
      s += '<text x="' + (m.l + pw + 6) + '" y="' + (Y(b[1]) + 4) + '" font-size="12" fill="' + ink2 + '">' + b[0] + "</text>";
    });
    /* the curve(s) */
    var pts = [], ptsB = [];
    for (var i = 0; i <= 100; i++) {
      var x = c.xMax * i / 100, T = c.total(v, x);
      pts.push(X(x).toFixed(1) + "," + Y(Math.min(100, T)).toFixed(1));
      if (bonus && c.ok(v, T, x)) ptsB.push(X(x).toFixed(1) + "," + Y(Math.min(100, T + bonus)).toFixed(1));
    }
    if (ptsB.length > 1) s += '<polyline points="' + ptsB.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="1.4" stroke-dasharray="5 4"/>';
    s += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2.2"/>';
    /* current point */
    var xv = v[c.x];
    if (xv !== null) {
      var Tv = c.total(v, xv);
      s += '<circle cx="' + X(xv) + '" cy="' + Y(Math.min(100, Tv)) + '" r="5" fill="' + ink + '"/>';
    }
    /* axes */
    s += '<rect x="' + (m.l + 0.5) + '" y="' + (m.t + 0.5) + '" width="' + (pw - 1) + '" height="' + (ph - 1) + '" fill="none" stroke="' + ink + '"/>';
    var step = c.xMax === 100 ? 20 : 10;
    for (var tx = 0; tx <= c.xMax; tx += step) {
      s += '<line x1="' + X(tx) + '" x2="' + X(tx) + '" y1="' + (m.t + ph) + '" y2="' + (m.t + ph + 4) + '" stroke="' + ink + '"/>';
      s += '<text x="' + X(tx) + '" y="' + (m.t + ph + 17) + '" font-size="12" text-anchor="middle" fill="' + ink + '">' + tx + "</text>";
    }
    for (var ty = 0; ty <= 100; ty += 20) {
      s += '<line x1="' + (m.l - 4) + '" x2="' + m.l + '" y1="' + Y(ty) + '" y2="' + Y(ty) + '" stroke="' + ink + '"/>';
      s += '<text x="' + (m.l - 7) + '" y="' + (Y(ty) + 4) + '" font-size="12" text-anchor="end" fill="' + ink + '">' + ty + "</text>";
    }
    s += '<text x="' + (m.l + pw / 2) + '" y="' + (H - 6) + '" font-size="13" font-style="italic" text-anchor="middle" fill="' + ink + '">' + c.xLabel + "</text>";
    s += '<text transform="translate(13 ' + (m.t + ph / 2) + ') rotate(-90)" font-size="13" font-style="italic" text-anchor="middle" fill="' + ink + '">total T</text>';
    plot.setAttribute("viewBox", "0 0 " + W + " " + H);
    plot.setAttribute("aria-label", c.name + ": total score plotted against the " + c.xLabel + ", with grade bands");
    plot.innerHTML = s;
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { state.course = t.getAttribute("data-course"); save(); buildInputs(); render(); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : -1);
      var n = tabs[(i + tabs.length) % tabs.length]; n.focus(); n.click();
    });
  });
  inputsEl.addEventListener("input", render);
  var lastW = 0, rt = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { var w = plot.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; render(); } }, 120);
  });

  /* redraw colours when the theme changes */
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", render); else if (mq.addListener) mq.addListener(render);
  }

  buildInputs();
  render();
})();
