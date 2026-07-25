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
      { v:'BLOCK',  bg:'rgba(255,92,103,.14)', fg:'#ff5c67', type:'Aadhaar number',  surface:'ChatGPT'   },
      { v:'REDACT', bg:'rgba(255,155,87,.14)', fg:'#ff9b57', type:'Credit card',     surface:'Cursor IDE' },
      { v:'ALERT',  bg:'rgba(240,194,75,.16)', fg:'#f0c24b', type:'API key in prompt',surface:'Bedrock'  },
      { v:'ALLOW',  bg:'rgba(62,217,140,.14)', fg:'#3ed98c', type:'Public question', surface:'Copilot'   },
      { v:'BLOCK',  bg:'rgba(255,92,103,.14)', fg:'#ff5c67', type:'PAN India',       surface:'MCP server' },
      { v:'REDACT', bg:'rgba(255,155,87,.14)', fg:'#ff9b57', type:'SSN pattern',     surface:'VS Code'   },
      { v:'ALERT',  bg:'rgba(240,194,75,.16)', fg:'#f0c24b', type:'Agent spawn',     surface:'Clipboard' },
      { v:'BLOCK',  bg:'rgba(255,92,103,.14)', fg:'#ff5c67', type:'Secret key',      surface:'ChatGPT'   },
      { v:'ALLOW',  bg:'rgba(62,217,140,.14)', fg:'#3ed98c', type:'Internal doc ref',surface:'Copilot'   },
      { v:'REDACT', bg:'rgba(255,155,87,.14)', fg:'#ff9b57', type:'Employee ID',     surface:'Cursor IDE' },
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
})();
