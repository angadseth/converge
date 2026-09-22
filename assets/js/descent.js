/* Figure 1: gradient descent with momentum on a loss surface with three basins.
   The contours are drawn with marching squares and coloured with viridis, the way
   plt.contour would draw them. Click the plot to start a run from that point. */
(function () {
  "use strict";

  var root = document.querySelector("[data-descent]");
  if (!root) return;
  var canvas = root.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var etaIn = root.querySelector("[data-eta]");
  var betaIn = root.querySelector("[data-beta]");
  var etaOut = root.querySelector("[data-eta-out]");
  var betaOut = root.querySelector("[data-beta-out]");
  var logEl = root.querySelector("[data-log]");
  var runBtn = root.querySelector("[data-run]");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the surface ---------- */
  var X0 = -3.2, X1 = 3.2, Y0 = -2, Y1 = 2;
  var WELLS = [
    { k: "MLF", cx: -1.9, cy: 0.95, a: 0.55, s: 0.42, c: "--c-mlf" },
    { k: "MLT", cx: -0.2, cy: -0.1, a: 0.85, s: 0.48, c: "--c-mlt" },
    { k: "MLP", cx: 1.85, cy: -0.85, a: 1.35, s: 0.6, c: "--c-mlp" }
  ];
  function f(x, y) {
    var v = 0.075 * ((x - 1.4) * (x - 1.4) + 1.5 * (y + 0.4) * (y + 0.4));
    for (var i = 0; i < WELLS.length; i++) {
      var w = WELLS[i], dx = x - w.cx, dy = y - w.cy;
      v -= w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s));
    }
    return v + 0.04 * Math.sin(1.7 * x) * Math.cos(1.3 * y);
  }
  function grad(x, y) {
    var h = 1e-4;
    return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
  }

  /* the local minimum of each well, found once by plain descent from its centre */
  WELLS.forEach(function (w) {
    var x = w.cx, y = w.cy;
    for (var i = 0; i < 400; i++) { var g = grad(x, y); x -= 0.05 * g[0]; y -= 0.05 * g[1]; }
    w.mx = x; w.my = y;
  });

  /* ---------- viridis ---------- */
  var VIR = ["#440154", "#482475", "#414487", "#355f8d", "#2a788e", "#21918c", "#22a884", "#44bf70", "#7ad151", "#bddf26", "#fde725"];
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  var VIRGB = VIR.map(hex);
  function viridis(t) {
    t = Math.max(0, Math.min(1, t)) * (VIRGB.length - 1);
    var i = Math.min(VIRGB.length - 2, Math.floor(t)), u = t - i, a = VIRGB[i], b = VIRGB[i + 1];
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * u) + "," + Math.round(a[1] + (b[1] - a[1]) * u) + "," + Math.round(a[2] + (b[2] - a[2]) * u) + ")";
  }

  /* ---------- layout ---------- */
  var M = { l: 40, r: 58, t: 10, b: 34 };
  var cssW = 624, cssH = 360, dpr = 1, plotW = 0, plotH = 0;
  var fieldCache = null;          // offscreen canvas with contours, axes and labels
  var state = { start: [-2.9, 1.75], path: [], i: 0, raf: 0, result: null };

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function sx(x) { return M.l + (x - X0) / (X1 - X0) * plotW; }
  function sy(y) { return M.t + (1 - (y - Y0) / (Y1 - Y0)) * plotH; }
  function ix(px) { return X0 + (px - M.l) / plotW * (X1 - X0); }
  function iy(py) { return Y0 + (1 - (py - M.t) / plotH) * (Y1 - Y0); }

  function size() {
    cssW = Math.max(280, canvas.clientWidth || 624);
    var narrow = cssW < 460;
    M = narrow ? { l: 30, r: 42, t: 8, b: 28 } : { l: 40, r: 58, t: 10, b: 34 };
    cssH = Math.round(cssW * (narrow ? 0.68 : 360 / 624));
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.aspectRatio = cssW + " / " + cssH;
    plotW = cssW - M.l - M.r;
    plotH = cssH - M.t - M.b;
    fieldCache = null;
  }

  /* ---------- marching squares ---------- */
  function contours(ctx2, levels, lo, hi, dark) {
    var nx = Math.max(60, Math.round(plotW / 4)), ny = Math.max(40, Math.round(plotH / 4));
    var gx = [], v = [];
    for (var j = 0; j <= ny; j++) {
      var row = [];
      for (var i = 0; i <= nx; i++) row.push(f(X0 + (X1 - X0) * i / nx, Y0 + (Y1 - Y0) * j / ny));
      v.push(row);
    }
    function px(i) { return sx(X0 + (X1 - X0) * i / nx); }
    function py(j) { return sy(Y0 + (Y1 - Y0) * j / ny); }
    ctx2.lineWidth = 1.15;
    ctx2.lineJoin = "round";
    levels.forEach(function (L) {
      var t = (L - lo) / (hi - lo);
      ctx2.strokeStyle = viridis(dark ? 0.18 + 0.82 * t : t);
      ctx2.beginPath();
      for (var j = 0; j < ny; j++) {
        for (var i = 0; i < nx; i++) {
          var a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
          var code = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          if (code === 0 || code === 15) continue;
          var x0 = px(i), x1 = px(i + 1), y0 = py(j), y1 = py(j + 1);
          var top = [x0 + (x1 - x0) * (L - a) / (b - a), y0];
          var right = [x1, y0 + (y1 - y0) * (L - b) / (c - b)];
          var bottom = [x0 + (x1 - x0) * (L - d) / (c - d), y1];
          var left = [x0, y0 + (y1 - y0) * (L - a) / (d - a)];
          var segs;
          switch (code) {
            case 1: case 14: segs = [[left, bottom]]; break;
            case 2: case 13: segs = [[bottom, right]]; break;
            case 3: case 12: segs = [[left, right]]; break;
            case 4: case 11: segs = [[top, right]]; break;
            case 5: segs = [[left, top], [bottom, right]]; break;
            case 6: case 9: segs = [[top, bottom]]; break;
            case 7: case 8: segs = [[left, top]]; break;
            case 10: segs = [[top, right], [left, bottom]]; break;
          }
          for (var s = 0; s < segs.length; s++) { ctx2.moveTo(segs[s][0][0], segs[s][0][1]); ctx2.lineTo(segs[s][1][0], segs[s][1][1]); }
        }
      }
      ctx2.stroke();
    });
  }

  function drawField() {
    var off = document.createElement("canvas");
    off.width = canvas.width; off.height = canvas.height;
    var c = off.getContext("2d");
    c.scale(dpr, dpr);
    var dark = isDark();
    var ink = css("--ink") || "#000", ink2 = css("--ink-2") || "#333", page = css("--page") || "#fff";
    var small = cssW < 460;
    var PF = css("--plot-font") || "'CMU Serif', serif";
    var fs = small ? 10 : 12;
    c.fillStyle = page; c.fillRect(0, 0, cssW, cssH);

    var lo = -1.25, hi = 1.9, levels = [];
    for (var k = 0; k < 16; k++) levels.push(lo + (hi - lo) * (k + 0.5) / 16);
    c.save();
    c.beginPath(); c.rect(M.l, M.t, plotW, plotH); c.clip();
    contours(c, levels, lo, hi, dark);
    c.restore();

    /* spines and ticks */
    c.strokeStyle = ink; c.lineWidth = 1; c.strokeRect(M.l + 0.5, M.t + 0.5, plotW - 1, plotH - 1);
    c.fillStyle = ink; c.font = fs + "px " + PF; c.textAlign = "center"; c.textBaseline = "top";
    for (var x = -3; x <= 3; x++) {
      var X = Math.round(sx(x)) + 0.5;
      c.beginPath(); c.moveTo(X, M.t + plotH); c.lineTo(X, M.t + plotH + 4); c.stroke();
      c.fillText(x < 0 ? "−" + (-x) : String(x), X, M.t + plotH + 6);
    }
    c.textAlign = "right"; c.textBaseline = "middle";
    for (var y = -2; y <= 2; y++) {
      var Y = Math.round(sy(y)) + 0.5;
      c.beginPath(); c.moveTo(M.l - 4, Y); c.lineTo(M.l, Y); c.stroke();
      c.fillText(y < 0 ? "−" + (-y) : String(y), M.l - 6, Y);
    }
    c.font = "italic " + (fs + 1) + "px " + PF;
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.fillText("w₁", M.l + plotW / 2, cssH - 3);
    c.save(); c.translate(small ? 9 : 12, M.t + plotH / 2); c.rotate(-Math.PI / 2); c.fillText("w₂", 0, 0); c.restore();

    /* colour bar */
    var cbX = M.l + plotW + (small ? 10 : 14), cbW = small ? 8 : 11;
    for (var p = 0; p < plotH; p++) {
      c.fillStyle = viridis(dark ? 0.18 + 0.82 * (1 - p / plotH) : 1 - p / plotH);
      c.fillRect(cbX, M.t + p, cbW, 1.2);
    }
    c.strokeStyle = ink; c.strokeRect(cbX + 0.5, M.t + 0.5, cbW - 1, plotH - 1);
    c.fillStyle = ink; c.font = fs + "px " + PF; c.textAlign = "left"; c.textBaseline = "middle";
    [-1, 0, 1].forEach(function (L) {
      var yy = M.t + (1 - (L - lo) / (hi - lo)) * plotH;
      c.beginPath(); c.moveTo(cbX + cbW, yy); c.lineTo(cbX + cbW + 3, yy); c.stroke();
      c.fillText(L < 0 ? "−" + (-L) : String(L), cbX + cbW + 5, yy);
    });
    c.save(); c.translate(cssW - 4, M.t + plotH / 2); c.rotate(-Math.PI / 2);
    c.font = "italic " + fs + "px " + PF; c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillText("loss", 0, 0); c.restore();

    /* basin labels: an x marker at each minimum, like plt.plot(..., "x") */
    WELLS.forEach(function (w) {
      var X = sx(w.mx), Y = sy(w.my), r = small ? 4 : 5;
      c.strokeStyle = css(w.c) || "#000"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X - r, Y - r); c.lineTo(X + r, Y + r); c.moveTo(X + r, Y - r); c.lineTo(X - r, Y + r); c.stroke();
      c.font = "bold " + (fs + 1) + "px " + PF; c.textAlign = "left"; c.textBaseline = "bottom";
      c.lineWidth = 3.5; c.strokeStyle = page; c.lineJoin = "round";
      c.strokeText(w.k, X + r + 3, Y - 2); c.fillStyle = ink; c.fillText(w.k, X + r + 3, Y - 2);
    });

    /* legend, top right, matplotlib's framed box */
    if (!small) {
      var lx = M.l + plotW - 168, ly = M.t + 8, lw = 160, lh = 44;
      c.globalAlpha = 0.85; c.fillStyle = page; c.fillRect(lx, ly, lw, lh); c.globalAlpha = 1;
      c.strokeStyle = dark ? "#555" : "#cccccc"; c.lineWidth = 1; c.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
      c.strokeStyle = css("--c-run") || "#d62728"; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(lx + 10, ly + 14); c.lineTo(lx + 34, ly + 14); c.stroke();
      c.fillStyle = css("--c-run") || "#d62728"; c.beginPath(); c.arc(lx + 22, ly + 14, 2.2, 0, 7); c.fill();
      c.strokeStyle = ink2; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(lx + 18, ly + 27); c.lineTo(lx + 26, ly + 35); c.moveTo(lx + 26, ly + 27); c.lineTo(lx + 18, ly + 35); c.stroke();
      c.fillStyle = ink; c.font = "12px " + PF; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText("gradient descent", lx + 42, ly + 14);
      c.fillText("local minimum", lx + 42, ly + 31);
    }
    fieldCache = off;
  }

  /* ---------- the run ---------- */
  function simulate(x, y, eta, beta) {
    var pts = [[x, y]], vx = 0, vy = 0, n;
    for (n = 1; n <= 600; n++) {
      var g = grad(x, y);
      vx = beta * vx - eta * g[0]; vy = beta * vy - eta * g[1];
      x += vx; y += vy;
      if (!isFinite(x) || x < X0 || x > X1 || y < Y0 || y > Y1) {
        pts.push([x, y]);
        return { pts: pts, end: "off", n: n };
      }
      pts.push([x, y]);
      if (Math.hypot(vx, vy) < 2e-4 && Math.hypot(g[0], g[1]) < 2e-3) break;
    }
    var best = null, bd = 1e9;
    WELLS.forEach(function (w) { var d = Math.hypot(x - w.mx, y - w.my); if (d < bd) { bd = d; best = w.k; } });
    return { pts: pts, end: n > 600 ? "bouncing" : (bd < 0.6 ? best : "elsewhere"), n: Math.min(n, 600), loss: f(x, y) };
  }

  function message(r) {
    var steps = r.n + (r.n === 1 ? " step" : " steps");
    switch (r.end) {
      case "MLP": return "Converged in the MLP basin after " + steps + ". Loss " + fmt(r.loss) + ".";
      case "MLT": return "Stopped in the MLT basin after " + steps + ". A little more momentum carries you through.";
      case "MLF": return "Stuck in the MLF basin after " + steps + ". Raise the momentum β.";
      case "off": return "Diverged: the run left the map after " + steps + ". Lower the learning rate η.";
      case "bouncing": return "Still bouncing after 600 steps: η is too high to settle.";
      default: return "Stopped after " + steps + " at loss " + fmt(r.loss) + ".";
    }
  }
  function fmt(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(3); }

  function draw(upto) {
    if (!fieldCache) drawField();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fieldCache, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pts = state.path, run = css("--c-run") || "#d62728", ink = css("--ink") || "#000", page = css("--page") || "#fff";
    if (!pts.length) return;
    var n = Math.min(upto, pts.length - 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(M.l, M.t, plotW, plotH); ctx.clip();
    ctx.strokeStyle = run; ctx.lineWidth = 1.7; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (var i = 1; i <= n; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    ctx.stroke();
    ctx.fillStyle = run;
    for (var k = 1; k <= n; k += (n > 120 ? 3 : 2)) { ctx.beginPath(); ctx.arc(sx(pts[k][0]), sy(pts[k][1]), 1.9, 0, 7); ctx.fill(); }
    ctx.restore();
    /* start: open circle; current: filled */
    ctx.lineWidth = 2; ctx.strokeStyle = run; ctx.fillStyle = page;
    ctx.beginPath(); ctx.arc(sx(pts[0][0]), sy(pts[0][1]), 5, 0, 7); ctx.fill(); ctx.stroke();
    var cur = pts[n];
    if (cur[0] >= X0 && cur[0] <= X1 && cur[1] >= Y0 && cur[1] <= Y1) {
      ctx.fillStyle = run; ctx.strokeStyle = page; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx(cur[0]), sy(cur[1]), 4.5, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = ink;
  }

  function start(x, y) {
    cancelAnimationFrame(state.raf);
    state.start = [x, y];
    var eta = parseFloat(etaIn.value), beta = parseFloat(betaIn.value);
    var r = simulate(x, y, eta, beta);
    state.path = r.pts; state.result = r;
    if (reduceMotion) { draw(r.pts.length); logEl.textContent = message(r); return; }
    logEl.textContent = "Descending…";
    var i = 0, perFrame = Math.max(1, Math.round(r.pts.length / 150));
    function tick() {
      i += perFrame;
      draw(i);
      if (i < r.pts.length - 1) state.raf = requestAnimationFrame(tick);
      else logEl.textContent = message(r);
    }
    tick();
  }

  function paintSlider(input) {
    var min = parseFloat(input.min), max = parseFloat(input.max), v = parseFloat(input.value);
    input.style.setProperty("--p", ((v - min) / (max - min) * 100) + "%");
  }
  function syncOutputs() {
    etaOut.textContent = parseFloat(etaIn.value).toFixed(2);
    betaOut.textContent = parseFloat(betaIn.value).toFixed(2);
    paintSlider(etaIn); paintSlider(betaIn);
  }

  var sliderTimer = 0;
  function onSlide() {
    syncOutputs();
    clearTimeout(sliderTimer);
    sliderTimer = setTimeout(function () { start(state.start[0], state.start[1]); }, 160);
  }
  etaIn.addEventListener("input", onSlide);
  betaIn.addEventListener("input", onSlide);
  runBtn.addEventListener("click", function () { start(state.start[0], state.start[1]); });

  canvas.addEventListener("click", function (e) {
    var r = canvas.getBoundingClientRect();
    var px = (e.clientX - r.left) * (cssW / r.width), py = (e.clientY - r.top) * (cssH / r.height);
    if (px < M.l || px > M.l + plotW || py < M.t || py > M.t + plotH) return;
    start(ix(px), iy(py));
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { var w = canvas.clientWidth; if (Math.abs(w - cssW) > 2) { size(); draw(state.path.length); } }, 120);
  });
  /* redraw when the theme changes (toolbar button or the OS setting) */
  new MutationObserver(function () { fieldCache = null; draw(state.path.length); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () { fieldCache = null; draw(state.path.length); };
    if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }

  function boot() {
    size();
    syncOutputs();
    draw(0);
    var started = false;
    var go = function () { if (!started) { started = true; start(state.start[0], state.start[1]); } };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { go(); io.disconnect(); } }, { threshold: 0.35 });
      io.observe(canvas);
    } else go();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
})();
