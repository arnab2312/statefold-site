/* Statefold spatial product scenes — canvas depth with no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GREEN = '180,241,60';

  function seeded(i, salt) {
    var x = Math.sin(i * 937.17 + salt * 71.39) * 43758.5453;
    return x - Math.floor(x);
  }
  function canvasSize(canvas) {
    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    var ctx = canvas.getContext('2d', { alpha: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: box.width, h: box.height };
  }
  function observeScene(canvas, render) {
    var size = canvasSize(canvas), frame = 0, visible = true;
    function resize() { size = canvasSize(canvas); render(performance.now(), size, true); }
    function tick(now) {
      if (!visible) { frame = 0; return; }
      render(now, size, false);
      if (!reduce) frame = requestAnimationFrame(tick);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !frame) frame = requestAnimationFrame(tick);
      }, { rootMargin: '160px 0px' }).observe(canvas);
    }
    render(performance.now(), size, true);
    if (!reduce) frame = requestAnimationFrame(tick);
  }

  /* A quiet projected governance lattice behind the architecture narrative. */
  var lattice = document.querySelector('[data-governance-lattice]');
  if (lattice) {
    var latticeNodes = [];
    for (var row = 0; row < 7; row++) for (var col = 0; col < 10; col++) {
      var n = row * 10 + col;
      latticeNodes.push({
        x: (col - 4.5) * 72 + (seeded(n, 1) - .5) * 15,
        y: (row - 3) * 54 + (seeded(n, 2) - .5) * 12,
        z: (seeded(n, 3) - .5) * 150,
        hot: seeded(n, 4) > .88,
        phase: seeded(n, 5) * Math.PI * 2
      });
    }
    observeScene(lattice, function (now, s) {
      var ctx = s.ctx, w = s.w, h = s.h, t = reduce ? 0 : now * .00011;
      ctx.clearRect(0, 0, w, h);
      var projected = latticeNodes.map(function (n) {
        var a = t + n.phase * .08, x = n.x * Math.cos(a) - n.z * Math.sin(a), z = n.x * Math.sin(a) + n.z * Math.cos(a);
        var scale = 640 / (640 + z);
        return { x: w * .62 + x * scale, y: h * .48 + n.y * scale, z: z, hot: n.hot };
      });
      for (var i = 0; i < projected.length; i++) {
        var p = projected[i], right = i % 10 !== 9 ? projected[i + 1] : null, down = i < 60 ? projected[i + 10] : null;
        [right, down].forEach(function (q) {
          if (!q) return;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(8,9,11,.075)'; ctx.lineWidth = .65; ctx.stroke();
        });
      }
      projected.forEach(function (p) {
        var a = p.hot ? .8 : .28;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.hot ? 2.1 : 1.05, 0, Math.PI * 2);
        ctx.fillStyle = p.hot ? 'rgba(' + GREEN + ',' + a + ')' : 'rgba(8,9,11,' + a + ')'; ctx.fill();
        if (p.hot) { ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(' + GREEN + ',.20)'; ctx.stroke(); }
      });
    });
  }

  /* Sparse endpoint constellation: signals resolve to one governance path. */
  var constellation = document.querySelector('[data-endpoint-constellation]');
  if (constellation) {
    var stars = [];
    for (var i = 0; i < 88; i++) stars.push({ x: seeded(i, 7), y: seeded(i, 8), z: seeded(i, 9), hot: seeded(i, 10) > .9, phase: seeded(i, 11) * Math.PI * 2 });
    observeScene(constellation, function (now, s) {
      var ctx = s.ctx, w = s.w, h = s.h, t = reduce ? 0 : now * .000075;
      ctx.clearRect(0, 0, w, h);
      var pts = stars.map(function (n) {
        var orbit = t + n.phase, driftX = Math.sin(orbit) * .028, driftY = Math.cos(orbit * .71) * .022;
        return { x: w * (.18 + (n.x + driftX) * .72), y: h * (.12 + (n.y + driftY) * .76), hot: n.hot, z: n.z };
      });
      for (var a = 0; a < pts.length; a++) for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 105) {
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - d / 105) * .13) + ')'; ctx.lineWidth = .55; ctx.stroke();
        }
      }
      var core = { x: w * .67, y: h * .5 };
      pts.forEach(function (p, index) {
        if (p.hot) {
          var travel = (t * 1.6 + index / pts.length) % 1;
          var sx = p.x + (core.x - p.x) * travel, sy = p.y + (core.y - p.y) * travel;
          ctx.beginPath(); ctx.arc(sx, sy, 1.7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(' + GREEN + ',.92)'; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.hot ? 2 : 1, 0, Math.PI * 2);
        ctx.fillStyle = p.hot ? 'rgba(' + GREEN + ',.88)' : 'rgba(255,255,255,.58)'; ctx.fill();
      });
      ctx.beginPath(); ctx.arc(core.x, core.y, 18, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(' + GREEN + ',.46)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(core.x, core.y, 3.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(' + GREEN + ',1)'; ctx.fill();
    });
  }

  /* Small, scroll-driven depth shifts never displace reading flow. */
  if (!reduce) {
    var depth = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
    var depthFrame = 0;
    function updateDepth() {
      depthFrame = 0;
      var middle = window.innerHeight * .5;
      depth.forEach(function (el) {
        var rect = el.getBoundingClientRect(), strength = Number(el.getAttribute('data-depth')) || 8;
        var shift = Math.max(-strength, Math.min(strength, (middle - (rect.top + rect.height * .5)) / window.innerHeight * strength * 1.25));
        el.style.setProperty('--depth-shift', shift.toFixed(2) + 'px');
      });
    }
    function requestDepth() { if (!depthFrame) depthFrame = requestAnimationFrame(updateDepth); }
    window.addEventListener('scroll', requestDepth, { passive: true });
    window.addEventListener('resize', requestDepth, { passive: true });
    requestDepth();
  }

  var lens = document.querySelector('.kernel-lens');
  var lab = document.querySelector('.kernel-lab');
  if (lens && lab && !reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    lab.addEventListener('pointermove', function (e) {
      var r = lab.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      lens.style.rotate = (y * -4).toFixed(2) + 'deg ' + (x * 7).toFixed(2) + 'deg';
    }, { passive: true });
    lab.addEventListener('pointerleave', function () { lens.style.rotate = ''; });
  }
})();
