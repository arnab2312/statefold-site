/* ============================================================
   Statefold marketing site — interactions
   - scroll progress, nav scroll-state, active-nav highlight
   - staggered scroll-reveal + animated counters
   - magnetic buttons, mobile nav
   - a DETERMINISTIC Hive Mind demo (canned answers mirroring the
     real product; no network, no model — true to the design)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hide nav while brand splash is in view ---- */
  var brSection = document.getElementById('brand-reveal');
  var navEl = document.querySelector('[data-nav]');
  if (brSection && navEl && 'IntersectionObserver' in window) {
    var brNavIO = new IntersectionObserver(function (entries) {
      navEl.classList.toggle('nav-hidden', entries[0].isIntersecting);
      document.body.classList.toggle('in-overture', entries[0].isIntersecting);
    }, { threshold: 0.15 });
    brNavIO.observe(brSection);
  }

  /* ---- footer year ---- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---- scroll progress + sticky nav state ---- */
  var bar = document.getElementById('scrollbar');
  var nav = document.querySelector('[data-nav]');
  function onScroll() {
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    document.documentElement.style.setProperty('--page-progress', h > 0 ? (st / h).toFixed(4) : '0');
    if (nav) nav.classList.toggle('scrolled', st > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile nav ---- */
  var burger = document.getElementById('burger');
  var navMobile = document.getElementById('navMobile');
  if (burger && navMobile) {
    burger.addEventListener('click', function () {
      var open = navMobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    navMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- animated counters ([data-count]) ---- */
  function fmt(n, dec) {
    if (dec > 0) return n.toFixed(dec);
    return Math.round(n).toLocaleString();
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = pre + fmt(target, dec) + suf; return; }
    var dur = 1300, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(target * eased, dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = pre + fmt(target, dec) + suf;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---- active nav link by section in view ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var byHash = {};
  navLinks.forEach(function (a) { byHash[a.getAttribute('href')] = a; });
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          var link = byHash['#' + e.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ---- magnetic buttons ---- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var mx = ev.clientX - r.left - r.width / 2;
        var my = ev.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (mx * 0.18) + 'px,' + (my * 0.28) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ============================================================
     HIVE MIND DEMO — deterministic answer router
     Mirrors the product's real hive_answer() legs: a verified query
     (exact, provably-correct), a graph match, a hybrid semantic
     search, or an honest abstain when confidence is too low. Canned
     but faithful — no network, no model.
     ============================================================ */
  var KB = {
    exfil: {
      leg: 'verified',
      head: '<b>2 identities</b> run an exfil-capable agent with a vuln on the same device — verified query, not a guess.',
      rows: ['FIN\\a.rao · WS-FIN-118 · CVE-2025-31337 (critical)', 'ENG\\j.park · WS-ENG-204 · CVE-2025-40410 (high)']
    },
    cost: {
      leg: 'graph',
      head: 'Estimated AI billing: <b>$0.53</b> across 7 models.',
      rows: ['claude-3.5-sonnet · $0.32', 'gpt-4o · $0.11', 'titan-text · $0.06', 'cohere-command · $0.04']
    },
    tokens: {
      leg: 'graph',
      head: 'Token usage: <b>75,533 tokens</b> across 7 models (22,513 in · 53,020 out).',
      rows: ['claude-3.5-sonnet · 41,208', 'gpt-4o · 18,442', 'amazon.titan · 9,310', 'others · 6,573']
    },
    license: {
      leg: 'graph',
      head: 'License usage across <b>9 license pools</b> / seats.',
      rows: ['GitHub Copilot Business · 14 seats', 'Cursor Pro · 9 seats', 'ChatGPT Enterprise · 22 seats', 'Unlicensed (shadow AI) · 6 seats']
    },
    who: {
      leg: 'graph',
      head: '<b>EXEC\\t.vance, ENG\\s.okafor, ENG\\j.park</b> and 7 others use Cursor.',
      rows: ['runs on WS-ENG-221, WS-ENG-204', 'privilege: Standard user', 'last seen 4 min ago']
    },
    alert: {
      leg: 'graph',
      head: 'Recent alerts — the latest security responses across the fleet.',
      rows: ['WS-FIN-118 · BLOCK · secret → Bedrock', 'WS-ENG-204 · REDACT · PII in prompt', 'WS-OPS-009 · ALERT · MCP exfil attempt']
    },
    prompt: {
      leg: 'graph',
      head: '<b>234 prompts &amp; questions</b> captured — most recent shown.',
      rows: ['ENG\\j.park → Cursor · "refactor the auth guard…"', 'FIN\\a.rao → ChatGPT · "summarize Q3 variance…"', 'OPS\\m.diaz → Claude · "write a PowerShell cleanup…"']
    },
    code: {
      leg: 'graph',
      head: '<b>86 code generations</b> captured — most recent shown.',
      rows: ['Cursor · completion in payments.py', 'Copilot · suggestion in handler.ts', 'Claude · script in deploy.ps1']
    },
    mcp: {
      leg: 'graph',
      head: '<b>47 MCP queries</b> captured across connected servers.',
      rows: ['filesystem.read · 18', 'github.search · 14', 'postgres.query · 9', 'shell.exec · 6']
    },
    snapshot: {
      leg: 'graph',
      head: '<b>23 snapshots</b> retained for forensic review.',
      rows: ['WS-ENG-221 · screen-share capture', 'WS-FIN-118 · clipboard event', 'WS-OPS-009 · paste to web AI']
    },
    governance: {
      leg: 'graph',
      head: 'Governance: an agent runs only if the <b>agent</b> and its <b>privilege</b> are both approved.',
      rows: ['12 agents approved', '3 pending decision', '2 halted + killed (unapproved)', 'grants auto-expire in 72h']
    },
    swarm: {
      leg: 'semantic',
      head: 'Found related evidence across the knowledge substrate — the <b>Hive Mind</b> is your own model; the <b>Swarm</b> keeps teaching it.',
      rows: ['memory and intelligence as one', 'taught only by your own AI usage', 'flags activity that reads unlike anything seen before', 'no external LLM, ever']
    },
    abstain: {
      leg: 'abstain',
      head: 'I don’t have enough evidence to answer that confidently.',
      rows: []
    }
  };

  function route(q) {
    var s = (q || '').toLowerCase();
    if (/exfil/.test(s)) return KB.exfil;
    if (/token/.test(s)) return KB.tokens;
    if (/cost|bill|spend|\$|price/.test(s)) return KB.cost;
    if (/licen|seat/.test(s)) return KB.license;
    if (/swarm|slm|model|train/.test(s)) return KB.swarm;
    if (/snapshot|screenshot/.test(s)) return KB.snapshot;
    if (/mcp/.test(s)) return KB.mcp;
    if (/code|completion/.test(s)) return KB.code;
    if (/prompt|question/.test(s)) return KB.prompt;
    if (/alert|block|redact|incident|anomal/.test(s)) return KB.alert;
    if (/govern|approv|privilege|kill/.test(s)) return KB.governance;
    if (/\bwho\b|uses|cursor|copilot|chatgpt|claude/.test(s)) return KB.who;
    return KB.abstain;
  }

  var LEG_LABEL = { verified: 'Verified', graph: 'Graph match', semantic: 'Semantic search', abstain: 'Low confidence' };

  var log = document.getElementById('demoLog');
  var form = document.getElementById('demoForm');
  var input = document.getElementById('demoText');
  var suggest = document.getElementById('demoSuggest');

  function bubble(role, html) {
    var d = document.createElement('div');
    d.className = 'bub ' + role;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function answer(q) {
    if (!q.trim()) return;
    bubble('user', escapeHtml(q));
    var typing = bubble('hive', '<span class="frow">…thinking</span>');
    setTimeout(function () {
      var a = route(q);
      var leg = a.leg || 'graph';
      var html = '<span class="leg leg-' + leg + '">' + LEG_LABEL[leg] + '</span><br>' + a.head;
      if (a.rows && a.rows.length) {
        html += a.rows.map(function (r) { return '<span class="frow">' + r + '</span>'; }).join('');
      }
      typing.innerHTML = html;
      typing.classList.toggle('abstain', leg === 'abstain');
      log.scrollTop = log.scrollHeight;
    }, 380);
  }

  function escapeHtml(t) {
    return t.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  if (form && input && log) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value;
      input.value = '';
      answer(q);
    });
  }
  if (suggest) {
    suggest.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { answer(b.textContent); });
    });
  }

  /* ============================================================
     ENDPOINT FEED WIDGET — live detection ticker in hero
     ============================================================ */
  var hfRows = document.getElementById('hfRows');
  if (hfRows && !reduce) {
    var FEED = [
      { v:'BLOCK',  bg:'rgba(255,255,255,.16)', fg:'#ffffff', type:'Aadhaar number',  surface:'ChatGPT'   },
      { v:'REDACT', bg:'rgba(242,242,242,.12)', fg:'#f2f2f2', type:'Credit card',     surface:'Cursor IDE' },
      { v:'ALERT',  bg:'rgba(207,207,207,.10)', fg:'#cfcfcf', type:'API key in prompt',surface:'Bedrock'  },
      { v:'ALLOW',  bg:'rgba(128,128,128,.10)', fg:'#808080', type:'Public question', surface:'Copilot'   },
      { v:'BLOCK',  bg:'rgba(255,255,255,.16)', fg:'#ffffff', type:'PAN India',       surface:'MCP server' },
      { v:'REDACT', bg:'rgba(242,242,242,.12)', fg:'#f2f2f2', type:'SSN pattern',     surface:'VS Code'   },
      { v:'ALERT',  bg:'rgba(207,207,207,.10)', fg:'#cfcfcf', type:'Agent spawn',     surface:'Clipboard' },
      { v:'BLOCK',  bg:'rgba(255,255,255,.16)', fg:'#ffffff', type:'Secret key',      surface:'ChatGPT'   },
      { v:'ALLOW',  bg:'rgba(128,128,128,.10)', fg:'#808080', type:'Internal doc ref',surface:'Copilot'   },
      { v:'REDACT', bg:'rgba(242,242,242,.12)', fg:'#f2f2f2', type:'Employee ID',     surface:'Cursor IDE' },
    ];
    var SHOW = 4;
    var feedHead = 0;

    function renderFeed() {
      var rows = '';
      for (var i = 0; i < SHOW; i++) {
        var e = FEED[(feedHead + i) % FEED.length];
        rows += '<div class="hf-row" style="animation-delay:' + (i * 55) + 'ms">' +
          '<span class="hf-badge" style="background:' + e.bg + ';color:' + e.fg + '">' + e.v + '</span>' +
          '<span class="hf-type">' + e.type + '</span>' +
          '<span class="hf-surface">' + e.surface + '</span>' +
          '</div>';
      }
      hfRows.innerHTML = rows;
    }

    renderFeed();
    setInterval(function () {
      feedHead = (feedHead + 1) % FEED.length;
      renderFeed();
    }, 2200);
  }

  /* ============================================================
     SIGNATURE INTERACTIONS — custom cursor + hero spotlight.
     Only enabled for a fine pointer (real mouse) with no reduced-
     motion preference; touch/trackpad-only and accessibility
     preferences get the untouched default cursor and no listeners
     at all — nothing below runs for them.
     ============================================================ */
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* Native pointer only: the cinematic system does not chase the cursor. */
  if (false && finePointer && !reduce) {
    document.documentElement.classList.add('has-custom-cursor');

    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var ringX = 0, ringY = 0, mouseX = 0, mouseY = 0, ringRaf = null;

    function moveCursor(e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (dot) dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
      if (!ringRaf) ringRaf = requestAnimationFrame(tickRing);
    }
    function tickRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ring) ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      if (Math.abs(mouseX - ringX) > 0.3 || Math.abs(mouseY - ringY) > 0.3) {
        ringRaf = requestAnimationFrame(tickRing);
      } else {
        ringRaf = null;
      }
    }
    window.addEventListener('mousemove', moveCursor, { passive: true });

    var hoverables = 'a, button, .card, .cap, .persona, .steps li, .sp, .t-item, .demo-suggest button, input';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) document.documentElement.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) document.documentElement.classList.remove('cursor-hover');
    });

    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      heroEl.addEventListener('mouseenter', function () { heroEl.classList.add('spotlight-on'); });
      heroEl.addEventListener('mouseleave', function () { heroEl.classList.remove('spotlight-on'); });
      heroEl.addEventListener('mousemove', function (e) {
        var r = heroEl.getBoundingClientRect();
        var mx = ((e.clientX - r.left) / r.width) * 100;
        var my = ((e.clientY - r.top) / r.height) * 100;
        heroEl.style.setProperty('--mx', mx + '%');
        heroEl.style.setProperty('--my', my + '%');
      }, { passive: true });
    }
  }

  /* chapter rail — quiet until a section becomes the current scene */
  var chapterLinks = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  if (chapterLinks.length && 'IntersectionObserver' in window) {
    var chapterMap = {};
    chapterLinks.forEach(function (link) { chapterMap[link.getAttribute('data-chapter')] = link; });
    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          chapterLinks.forEach(function (link) { link.classList.remove('active'); });
          if (chapterMap[entry.target.id]) chapterMap[entry.target.id].classList.add('active');
          document.body.setAttribute('data-scene', entry.target.id);
        }
      });
    }, { rootMargin: '-36% 0px -58% 0px', threshold: 0 });
    chapterLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('data-chapter'));
      if (section) chapterObserver.observe(section);
    });
  }

  /* The architecture reads like a score: one passage becomes current. */
  var systemFlow = document.querySelector('.system-flow');
  var flowStages = Array.prototype.slice.call(document.querySelectorAll('.flow-stage'));
  if (systemFlow && flowStages.length && 'IntersectionObserver' in window) {
    var visibleFlowStages = [];
    var flowObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var existing = visibleFlowStages.indexOf(entry.target);
        if (entry.isIntersecting && existing < 0) visibleFlowStages.push(entry.target);
        if (!entry.isIntersecting && existing >= 0) visibleFlowStages.splice(existing, 1);
      });
      if (!visibleFlowStages.length) return;
      var trigger = window.innerHeight * .38;
      var activeStage = visibleFlowStages.slice().sort(function (a, b) {
        return Math.abs(a.getBoundingClientRect().top - trigger) - Math.abs(b.getBoundingClientRect().top - trigger);
      })[0];
      var stageIndex = flowStages.indexOf(activeStage);
      flowStages.forEach(function (stage) { stage.classList.remove('is-active'); });
      activeStage.classList.add('is-active');
      systemFlow.style.setProperty('--flow-progress', ((stageIndex / Math.max(1, flowStages.length - 1)) * 100).toFixed(1) + '%');
    }, { rootMargin:'-30% 0px -48% 0px',threshold:0 });
    flowStages.forEach(function (stage) { flowObserver.observe(stage); });
    flowStages[0].classList.add('is-active');
    systemFlow.style.setProperty('--flow-progress', '0%');
  }

  /* ============================================================
     THE STATEFOLD — an authored, projected governance surface.
     A single sheet changes state as signals become context,
     decisions, actions, proof and intelligence. The visual is the
     product architecture, not a cloud of decorative particles.
     ============================================================ */
  var fieldCanvas = document.getElementById('statefoldField');
  var spatialStage = document.querySelector('[data-spatial]');
  if (fieldCanvas && spatialStage) {
    var fctx = fieldCanvas.getContext('2d', { alpha: true });
    var fieldAccent = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim() || '180,241,60';
    var fieldVisible = true;
    var fieldFrame = 0;
    var fieldStart = performance.now();
    var fieldMouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var fieldSize = { w: 0, h: 0, dpr: 1 };
    var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.connection && navigator.connection.saveData);
    var foldColumns = lowPower ? 26 : 42;
    var foldRows = lowPower ? 7 : 11;
    var foldStops = [
      { y:-72,z:155 }, { y:74,z:34 }, { y:-42,z:-98 }, { y:34,z:82 },
      { y:-88,z:-36 }, { y:52,z:128 }, { y:-18,z:4 }
    ];

    function resizeField() {
      var r = spatialStage.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
      fieldSize.w = Math.max(1, r.width);
      fieldSize.h = Math.max(1, r.height);
      fieldSize.dpr = dpr;
      fieldCanvas.width = Math.round(fieldSize.w * dpr);
      fieldCanvas.height = Math.round(fieldSize.h * dpr);
      fieldCanvas.style.width = fieldSize.w + 'px';
      fieldCanvas.style.height = fieldSize.h + 'px';
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fieldCanvas.classList.add('ready');
      if (reduce) renderField(performance.now());
    }

    function rotatePoint(p, ry, rx, rz) {
      var cy = Math.cos(ry), sy = Math.sin(ry);
      var cx = Math.cos(rx), sx = Math.sin(rx);
      var x = p.x * cy - p.z * sy;
      var z = p.x * sy + p.z * cy;
      var y = p.y * cx - z * sx;
      z = p.y * sx + z * cx;
      var cz = Math.cos(rz || 0), sz = Math.sin(rz || 0);
      return { x: x * cz - y * sz, y: x * sz + y * cz, z: z };
    }
    function projectPoint(p) {
      var camera = 960;
      var scale = camera / (camera + p.z);
      return { x: fieldSize.w * .5 + p.x * scale, y: fieldSize.h * .49 + p.y * scale, z: p.z, s: scale };
    }
    function line(a, b, alpha, width, color) {
      fctx.beginPath();
      fctx.moveTo(a.x, a.y);
      fctx.lineTo(b.x, b.y);
      fctx.lineWidth = width || 1;
      fctx.strokeStyle = color || ('rgba(255,255,255,' + alpha + ')');
      fctx.stroke();
    }
    function foldPoint(u, v, time, progress) {
      var safeU = Number.isFinite(u) ? Math.min(1, Math.max(0, u)) : 0;
      var scaled = safeU * (foldStops.length - 1);
      var index = Math.max(0, Math.min(foldStops.length - 2, Math.floor(scaled)));
      var local = scaled - index;
      var a = foldStops[index] || foldStops[0], b = foldStops[index + 1] || a;
      var pulse = Math.sin(time * .00028 + safeU * 7.4) * (3 + progress * 3);
      var width = 172 - Math.abs(safeU - .5) * 28;
      return {
        x:(safeU - .5) * 780,
        y:a.y + (b.y - a.y) * local + v * width + pulse,
        z:a.z + (b.z - a.z) * local + Math.sin(v * Math.PI) * 26 + progress * Math.sin(safeU * Math.PI * 6) * 12
      };
    }
    function polygon(points, fill, stroke) {
      fctx.beginPath();
      fctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) fctx.lineTo(points[i].x, points[i].y);
      fctx.closePath();
      fctx.fillStyle = fill; fctx.fill();
      if (stroke) { fctx.strokeStyle = stroke; fctx.lineWidth = .65; fctx.stroke(); }
    }

    function renderField(now) {
      if (!fieldVisible) { fieldFrame = 0; return; }
      fctx.clearRect(0, 0, fieldSize.w, fieldSize.h);
      fieldMouse.x += (fieldMouse.tx - fieldMouse.x) * .045;
      fieldMouse.y += (fieldMouse.ty - fieldMouse.y) * .045;
      var elapsed = reduce ? 0 : now - fieldStart;
      var stageRect = spatialStage.getBoundingClientRect();
      var stageTop = window.pageYOffset + stageRect.top;
      var pageProgress = Math.min(1, Math.max(0,
        (window.pageYOffset + window.innerHeight - stageTop) /
        (Math.max(1, spatialStage.offsetHeight) + window.innerHeight)
      ));
      var ry = -.2 + fieldMouse.x * .14 + pageProgress * .08;
      var rx = .77 + fieldMouse.y * .08;
      var rz = -.12 + Math.sin(elapsed * .00008) * .018;
      var cells = [];
      for (var col = 0; col < foldColumns; col++) {
        for (var row = 0; row < foldRows; row++) {
          var u0 = col / foldColumns, u1 = (col + 1) / foldColumns;
          var v0 = row / foldRows * 2 - 1, v1 = (row + 1) / foldRows * 2 - 1;
          var raw = [foldPoint(u0,v0,elapsed,pageProgress),foldPoint(u1,v0,elapsed,pageProgress),foldPoint(u1,v1,elapsed,pageProgress),foldPoint(u0,v1,elapsed,pageProgress)];
          var rotated = raw.map(function (p) { return rotatePoint(p,ry,rx,rz); });
          var avgZ = (rotated[0].z + rotated[1].z + rotated[2].z + rotated[3].z) / 4;
          cells.push({ z:avgZ, points:rotated.map(projectPoint), col:col, row:row });
        }
      }
      cells.sort(function (a,b) { return b.z - a.z; });
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var light = Math.max(0,Math.min(1,(cell.z + 220) / 500));
        var ridge = cell.col % Math.max(1,Math.floor(foldColumns / 6)) === 0;
        var alpha = .028 + light * .12 + (ridge ? .035 : 0);
        polygon(cell.points,'rgba(255,255,255,' + alpha + ')','rgba(255,255,255,' + (.025 + light * .055) + ')');
      }

      /* The chartreuse seam is the unbroken decision history. */
      var previous = null;
      for (var seam = 0; seam <= 120; seam++) {
        var su = seam / 120;
        var sp = projectPoint(rotatePoint(foldPoint(su,0,elapsed,pageProgress),ry,rx,rz));
        if (previous) line(previous,sp,.9,1.45,'rgba(' + fieldAccent + ',.76)');
        previous = sp;
      }
      for (var signal = 0; signal < 8; signal++) {
        var travel = (elapsed * .000075 + signal / 8) % 1;
        var lane = ((signal % 3) - 1) * .36;
        var signalPoint = projectPoint(rotatePoint(foldPoint(travel,lane,elapsed,pageProgress),ry,rx,rz));
        fctx.beginPath();fctx.arc(signalPoint.x,signalPoint.y,2.1 + signalPoint.s,0,Math.PI * 2);
        fctx.fillStyle = 'rgba(' + fieldAccent + ',' + (.55 + signalPoint.s * .22) + ')';fctx.fill();
      }
      fieldFrame = reduce ? 0 : requestAnimationFrame(renderField);
    }

    if (!reduce) {
      spatialStage.addEventListener('pointermove', function (e) {
        var r = spatialStage.getBoundingClientRect();
        fieldMouse.tx = ((e.clientX - r.left) / r.width - .5) * 2;
        fieldMouse.ty = ((e.clientY - r.top) / r.height - .5) * 2;
      }, { passive: true });
      spatialStage.addEventListener('pointerleave', function () { fieldMouse.tx = 0; fieldMouse.ty = 0; });
    }
    if ('ResizeObserver' in window) new ResizeObserver(resizeField).observe(spatialStage);
    else window.addEventListener('resize', resizeField, { passive: true });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        fieldVisible = entries[0].isIntersecting;
        if (fieldVisible && !fieldFrame) fieldFrame = requestAnimationFrame(renderField);
      }, { rootMargin: '180px 0px' }).observe(spatialStage);
    }
    resizeField();
    if (!reduce) fieldFrame = requestAnimationFrame(renderField);
  }

  /* Static editorial surfaces replace repeated template-like card tilts. */
  if (false && finePointer && !reduce) {
    var tiltTargets = document.querySelectorAll('.card, .cap, .persona, .sp');
    tiltTargets.forEach(function (target) {
      target.addEventListener('pointermove', function (e) {
        var r = target.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var ry = (px - .5) * 6;
        var rx = (.5 - py) * 5;
        target.style.setProperty('--glow-x', (px * 100) + '%');
        target.style.setProperty('--glow-y', (py * 100) + '%');
        target.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      }, { passive: true });
      target.addEventListener('pointerleave', function () { target.style.transform = ''; });
    });
  }
})();
