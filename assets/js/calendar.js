/* Figure 4: the term calendar as an event plot. Dates are copied from the
   programme's academic calendar (study.iitm.ac.in/ds/academic_calendar.html). */
(function () {
  "use strict";

  var root = document.querySelector("[data-cal]");
  if (!root) return;
  var plot = root.querySelector("[data-cal-plot]");
  var tbody = root.querySelector("[data-cal-table] tbody");
  var nextEl = root.querySelector("[data-next]");
  var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-term]"));

  /* rows: 0 = everyone, 1 = MLF and MLT, 2 = MLP */
  var TERMS = {
    "2026-09": [
      { what: "Course registration", row: 0, from: "2026-09-22", to: "2026-09-23" },
      { what: "Term starts", row: 0, from: "2026-10-02" },
      { what: "Drop course window", row: 0, from: "2026-10-23", to: "2026-10-25" },
      { what: "Quiz 1", row: 1, from: "2026-11-15" },
      { what: "OPPE 1", row: 2, from: "2026-11-21", to: "2026-11-22" },
      { what: "Quiz 2", row: 1, from: "2026-12-05" },
      { what: "OPPE 2", row: 2, from: "2026-12-19", to: "2026-12-20" },
      { what: "OPPE 2", row: 2, from: "2027-01-02", to: "2027-01-03" },
      { what: "End term", row: 1, from: "2027-01-10", also: 2 },
      { what: "End term results", row: 0, from: "2027-01-18", to: "2027-01-23" }
    ],
    "2027-01": [
      { what: "Term starts", row: 0, from: "2027-02-05" },
      { what: "Quiz 1", row: 1, from: "2027-03-14" },
      { what: "OPPE 1", row: 2, from: "2027-03-27", to: "2027-03-28" },
      { what: "Quiz 2", row: 1, from: "2027-04-11" },
      { what: "OPPE 2", row: 2, from: "2027-04-25" },
      { what: "OPPE 2", row: 2, from: "2027-05-02" },
      { what: "End term", row: 1, from: "2027-05-09", also: 2 }
    ],
    "2027-05": [
      { what: "Term starts", row: 0, from: "2027-06-04" },
      { what: "Quiz 1", row: 1, from: "2027-07-11" },
      { what: "OPPE 1", row: 2, from: "2027-07-24", to: "2027-07-25" },
      { what: "Quiz 2", row: 1, from: "2027-08-08" },
      { what: "OPPE 2", row: 2, from: "2027-08-22" },
      { what: "OPPE 2", row: 2, from: "2027-08-29" },
      { what: "End term", row: 1, from: "2027-09-05", also: 2 }
    ]
  };
  var ROWS = ["Everyone", "MLF, MLT", "MLP"];
  var FOR = ["Everyone", "MLF, MLT", "MLP"];
  var DAY = 86400000;
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function d(s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function today() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }
  function fmtDay(t) { return WK[t.getUTCDay()] + " " + t.getUTCDate() + " " + MON[t.getUTCMonth()] + " " + t.getUTCFullYear(); }
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  function pickDefault() {
    var t = today().getTime(), keys = Object.keys(TERMS);
    for (var i = 0; i < keys.length; i++) {
      var ev = TERMS[keys[i]], last = ev[ev.length - 1];
      if (d(last.to || last.from).getTime() >= t) return keys[i];
    }
    return keys[keys.length - 1];
  }
  var term = pickDefault();

  function render() {
    var ev = TERMS[term];
    tabs.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-term") === term ? "true" : "false"); });

    /* table */
    tbody.innerHTML = ev.map(function (e) {
      var a = d(e.from), b = e.to ? d(e.to) : null;
      var when = b ? fmtDay(a).replace(" " + a.getUTCFullYear(), a.getUTCFullYear() === b.getUTCFullYear() ? "" : " " + a.getUTCFullYear()) + " – " + fmtDay(b) : fmtDay(a);
      var who = e.also ? "MLF, MLT, MLP" : FOR[e.row];
      return "<tr><td>" + when + "</td><td>" + e.what + "</td><td>" + who + "</td></tr>";
    }).join("");

    /* countdown to the next event */
    var t0 = today().getTime(), next = null;
    for (var i = 0; i < ev.length; i++) {
      var end = d(ev[i].to || ev[i].from).getTime();
      if (end >= t0) { next = ev[i]; break; }
    }
    if (next) {
      var start = d(next.from).getTime(), days = Math.round((start - t0) / DAY);
      nextEl.innerHTML = "<b>Next:</b> " + next.what + " " + (days > 1 ? "in " + days + " days" : days === 1 ? "tomorrow" : days === 0 ? "today" : "is on now") + ", " + fmtDay(d(next.from)) + ".";
    } else {
      nextEl.textContent = "This term is over.";
    }

    drawPlot(ev);
  }

  function drawPlot(ev) {
    var W = Math.round(Math.max(300, Math.min(760, plot.clientWidth || 624)));
    var narrow = W < 480;
    var m = { l: narrow ? 62 : 80, r: 14, t: 16, b: 36 }, rowH = narrow ? 50 : 56;
    var H = m.t + m.b + rowH * ROWS.length;
    var pw = W - m.l - m.r;
    var ink = css("--ink"), ink2 = css("--ink-2"), hair = css("--hair"), run = css("--c-run");
    var colors = [css("--ink-3"), ink, css("--c-mlp")];
    var first = d(ev[0].from).getTime() - 8 * DAY, lastE = ev[ev.length - 1];
    var last = d(lastE.to || lastE.from).getTime() + 8 * DAY;
    function X(t) { return m.l + (t - first) / (last - first) * pw; }
    function Yr(r) { return m.t + rowH * r + rowH / 2; }
    var s = "";
    /* month gridlines and labels */
    var c = new Date(first); c = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1));
    while (c.getTime() < last) {
      var x = X(c.getTime());
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="' + hair + '"/>';
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + (H - m.b) + '" y2="' + (H - m.b + 4) + '" stroke="' + ink + '"/>';
      var lbl = MON[c.getUTCMonth()] + (c.getUTCMonth() === 0 ? " ’" + String(c.getUTCFullYear()).slice(2) : "");
      s += '<text x="' + (x + 3) + '" y="' + (H - m.b + 16) + '" font-size="12" fill="' + ink + '">' + lbl + "</text>";
      c = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1));
    }
    /* row labels and baselines */
    ROWS.forEach(function (r, i) {
      s += '<line x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + Yr(i) + '" y2="' + Yr(i) + '" stroke="' + hair + '" stroke-dasharray="2 4"/>';
      s += '<text x="' + (m.l - 8) + '" y="' + (Yr(i) + 4) + '" font-size="' + (narrow ? 11 : 12.5) + '" text-anchor="end" fill="' + ink + '">' + r + "</text>";
    });
    /* events */
    ev.forEach(function (e) {
      var rows = e.also ? [e.row, e.also] : [e.row];
      rows.forEach(function (r) {
        var a = d(e.from).getTime(), y = Yr(r), col = colors[r];
        if (e.to) {
          var b = d(e.to).getTime() + DAY;
          s += '<rect x="' + X(a) + '" y="' + (y - 7) + '" width="' + Math.max(4, X(b) - X(a)) + '" height="14" fill="' + col + '" fill-opacity="0.85"/>';
        } else {
          var cx = X(a + DAY / 2);
          s += '<path d="M' + cx + " " + (y - 8) + " L" + (cx + 7) + " " + y + " L" + cx + " " + (y + 8) + " L" + (cx - 7) + " " + y + ' Z" fill="' + col + '"/>';
        }
      });
    });
    /* labels above the markers (skip when they would collide) */
    var used = [[], [], []];
    ev.slice().sort(function (a, b) { return (a.to ? 1 : 0) - (b.to ? 1 : 0); }).forEach(function (e) {
      var rows = e.also ? [e.row, e.also] : [e.row];
      rows.forEach(function (r) {
        var x = X(d(e.from).getTime()), txt = e.what.replace("Course registration", "Registration").replace("End term results", "Results").replace("Drop course window", "Drop window");
        var w = txt.length * (narrow ? 5.6 : 6.4);
        var clash = used[r].some(function (u) { return Math.abs(u - x) < w; });
        if (clash) return;
        used[r].push(x);
        s += '<text x="' + x + '" y="' + (Yr(r) - 13) + '" font-size="' + (narrow ? 10.5 : 12) + '" font-style="italic" text-anchor="middle" fill="' + ink2 + '">' + txt + "</text>";
      });
    });
    /* today */
    var t = today().getTime();
    if (t >= first && t <= last) {
      var tx = X(t + DAY / 2);
      s += '<line x1="' + tx + '" x2="' + tx + '" y1="' + (m.t - 6) + '" y2="' + (H - m.b) + '" stroke="' + run + '" stroke-width="1.6"/>';
      s += '<text x="' + (tx + 4) + '" y="' + (H - m.b - 5) + '" font-size="11" fill="' + run + '">today</text>';
    }
    s += '<line x1="' + m.l + '" x2="' + (m.l + pw) + '" y1="' + (H - m.b) + '" y2="' + (H - m.b) + '" stroke="' + ink + '"/>';
    plot.setAttribute("viewBox", "0 0 " + W + " " + H);
    plot.innerHTML = s;
  }

  tabs.forEach(function (b) {
    b.addEventListener("click", function () { term = b.getAttribute("data-term"); render(); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = tabs.indexOf(b) + (e.key === "ArrowRight" ? 1 : -1);
      var n = tabs[(i + tabs.length) % tabs.length]; n.focus(); n.click();
    });
  });
  var lastW = 0, rt = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { var w = plot.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; drawPlot(TERMS[term]); } }, 120);
  });
  new MutationObserver(function () { drawPlot(TERMS[term]); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var re = function () { drawPlot(TERMS[term]); };
    if (mq.addEventListener) mq.addEventListener("change", re); else if (mq.addListener) mq.addListener(re);
  }
  render();
})();
