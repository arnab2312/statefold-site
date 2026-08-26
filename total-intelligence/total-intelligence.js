(function () {
  'use strict';

  var reduceQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = !!(reduceQuery && reduceQuery.matches);
  var nav = document.querySelector('[data-nav]');
  var overture = document.getElementById('brand-reveal');
  var hero = document.getElementById('intelligence');
  var progress = document.getElementById('scrollProgress');
  var year = document.getElementById('year');
  var menuButton = document.getElementById('menuButton');
  var mobileMenu = document.getElementById('mobileMenu');
  var overtureEnter = overture && overture.querySelector('.overture-enter');
  var signalMotion = document.getElementById('signalMotion');
  var signalTrack = document.querySelector('.signal-track');

  if (reduceQuery) {
    var syncMotionPreference = function (event) { reduce = event.matches; };
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', syncMotionPreference);
    else if (reduceQuery.addListener) reduceQuery.addListener(syncMotionPreference);
  }

  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    if (!menuButton || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileMenu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
    });
    var desktopQuery = window.matchMedia('(min-width: 1101px)');
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', closeMenu);
    else if (desktopQuery.addListener) desktopQuery.addListener(closeMenu);
  }

  if (overtureEnter) {
    overtureEnter.addEventListener('click', function () {
      window.setTimeout(function () {
        if (hero) hero.focus({ preventScroll: true });
      }, reduce ? 0 : 700);
    });
  }

  if (signalMotion && signalTrack) {
    signalTrack.classList.add('motion-enabled');
    signalMotion.classList.add('motion-control-ready');
    signalMotion.addEventListener('click', function () {
      var paused = signalTrack.classList.toggle('motion-paused');
      signalMotion.setAttribute('aria-pressed', String(paused));
      signalMotion.setAttribute('aria-label', paused ? 'Resume moving AI estate list' : 'Pause moving AI estate list');
      signalMotion.querySelector('span').textContent = paused ? 'Resume' : 'Pause';
    });
  }

  function updateScroll() {
    var top = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (nav) {
      var overtureActive = !!(overture && hero && hero.getBoundingClientRect().top > 1);
      nav.classList.toggle('nav-suppressed', overtureActive);
      nav.classList.toggle('scrolled', !overtureActive && top > 10);
      if (overtureActive) nav.setAttribute('aria-hidden', 'true');
      else nav.removeAttribute('aria-hidden');
      if ('inert' in nav) nav.inert = overtureActive;
    }
    if (progress) progress.style.width = (height > 0 ? top / height * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -40px' });
    reveals.forEach(function (node) { revealObserver.observe(node); });
  } else {
    reveals.forEach(function (node) { node.classList.add('in'); });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) { link.classList.remove('active'); });
        var active = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-42% 0px -52%' });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* Five concrete surfaces, one governing loop. All panels remain readable if JS is unavailable. */
  var scenarioDeck = document.getElementById('governancePortfolio');
  var scenarioTablist = document.getElementById('scenarioTabs');
  var scenarioTabs = Array.prototype.slice.call(document.querySelectorAll('[data-case]'));
  var scenarioPanels = Array.prototype.slice.call(document.querySelectorAll('[data-case-panel]'));

  function chooseScenario(name, focus) {
    scenarioTabs.forEach(function (tab) {
      var selected = tab.getAttribute('data-case') === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected && focus) tab.focus();
    });
    scenarioPanels.forEach(function (panel) {
      var selected = panel.getAttribute('data-case-panel') === name;
      panel.hidden = !selected;
    });
  }

  if (scenarioDeck && scenarioTablist && scenarioTabs.length && scenarioPanels.length) {
    scenarioDeck.classList.add('scenario-enabled');
    scenarioTablist.hidden = false;
    scenarioPanels.forEach(function (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'case-tab-' + panel.getAttribute('data-case-panel'));
    });
    scenarioTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { chooseScenario(tab.getAttribute('data-case'), false); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % scenarioTabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + scenarioTabs.length) % scenarioTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = scenarioTabs.length - 1;
        else return;
        event.preventDefault();
        chooseScenario(scenarioTabs[next].getAttribute('data-case'), true);
      });
    });
    chooseScenario('prompt', false);
  }

  /* One evidence graph, viewed through five decisions. */
  var ROLE_DATA = {
    leadership: {
      kicker: 'MD / Board / Executive Committee',
      title: 'See adoption, value and exposure in the same frame.',
      description: 'Know where AI is creating leverage, where accountability is missing and whether the organisation’s controls are working in practice.',
      question: '“Where is AI creating value without an accountable owner?”',
      view: 'LEADERSHIP VIEW',
      decision: 'Scale what is governed. Intervene where value and accountability diverge.',
      signals: [['Adoption','Business-aligned',82],['Accountability','Owner-resolved',68],['Control efficacy','Evidence-bound',74]]
    },
    technology: {
      kicker: 'CTO / CIO / AI Platform / Engineering',
      title: 'Scale AI without losing operational control.',
      description: 'See the models, agents, tools, routes, owners, reliability and cost behind adoption—then give teams a governed path to move faster.',
      question: '“Which AI routes are approved, reliable and worth standardising?”',
      view: 'TECHNOLOGY VIEW',
      decision: 'Standardise governed routes. Resolve duplication and unowned dependencies.',
      signals: [['AI estate','Surface-resolved',88],['Approved routes','Policy-bound',72],['Reliability + cost','Joined',78]]
    },
    security: {
      kicker: 'CISO / Security Engineering / SOC',
      title: 'See the path from prompt to enterprise exposure.',
      description: 'Join AI interactions to identity, privilege, sensitive data, vulnerable software, destinations and the controls that actually acted.',
      question: '“Which agent identities can reach sensitive data through an exposed tool?”',
      view: 'SECURITY VIEW',
      decision: 'Break the reachable path at the strongest verified control point.',
      signals: [['Prompt exposure','Classified',76],['Attack paths','Context-joined',81],['Response','Receipt-backed',69]]
    },
    risk: {
      kicker: 'CRO / Model Risk / Enterprise Risk',
      title: 'Turn AI inventory into accountable risk decisions.',
      description: 'Connect each use case, model and agent to an owner, purpose, risk position, exception, control and continuously updated evidence.',
      question: '“Which high-impact AI uses have unresolved ownership or expired exceptions?”',
      view: 'RISK VIEW',
      decision: 'Prioritise material risk where ownership, evidence or efficacy is incomplete.',
      signals: [['Ownership','Resolved',74],['Risk decisions','Current',66],['Exceptions','Time-bound',71]]
    },
    compliance: {
      kicker: 'Compliance / Privacy / Internal Audit',
      title: 'Move from sampled evidence to continuous assurance.',
      description: 'Trace obligations to controls, deployments, real events and verified outcomes without rebuilding the story for every review.',
      question: '“Can this control be traced from policy intent to a proven outcome?”',
      view: 'COMPLIANCE VIEW',
      decision: 'Export the evidence chain. Keep unsupported coverage explicit.',
      signals: [['Control mapping','Traceable',83],['Evidence','Review-ready',77],['Coverage gaps','Disclosed',72]]
    }
  };

  var roleTabs = Array.prototype.slice.call(document.querySelectorAll('[data-role]'));
  var roleKicker = document.getElementById('roleKicker');
  var roleTitle = document.getElementById('roleTitle');
  var roleDescription = document.getElementById('roleDescription');
  var roleQuestion = document.getElementById('roleQuestion');
  var roleView = document.getElementById('roleView');
  var roleDecision = document.getElementById('roleDecision');
  var roleSignals = document.getElementById('roleSignals');

  function chooseRole(name, focus) {
    var role = ROLE_DATA[name];
    if (!role) return;
    roleTabs.forEach(function (tab) {
      var selected = tab.getAttribute('data-role') === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected && focus) tab.focus();
    });
    roleKicker.textContent = role.kicker;
    roleTitle.textContent = role.title;
    roleDescription.textContent = role.description;
    roleQuestion.textContent = role.question;
    roleView.textContent = role.view;
    roleDecision.textContent = role.decision;
    roleSignals.innerHTML = role.signals.map(function (signal) {
      return '<div><span>' + signal[0] + '</span><b>' + signal[1] + '</b><i style="--fill:' + signal[2] + '%"></i></div>';
    }).join('');
  }

  roleTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { chooseRole(tab.getAttribute('data-role'), false); });
    tab.addEventListener('keydown', function (event) {
      var next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % roleTabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + roleTabs.length) % roleTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = roleTabs.length - 1;
      else return;
      event.preventDefault();
      chooseRole(roleTabs[next].getAttribute('data-role'), true);
    });
  });
  if (roleTabs.length) chooseRole('leadership', false);

  /* Deterministic Hive illustration. It never calls a network or model. */
  var HIVE = {
    controls: {
      leg: 'graph', label: 'Illustrative control state',
      head: 'Example result: three control paths are configured but do not have recent efficacy proof.',
      rows: ['Browser policy · deployed, not exercised in 14 days', 'Gateway budget rule · exercised, outcome receipt pending', 'Agent revocation policy · configured, endpoint acknowledgement absent']
    },
    agents: {
      leg: 'graph', label: 'Illustrative graph path',
      head: 'Example result: two agent identities sit on reachable paths to restricted data.',
      rows: ['Coding agent → database MCP → restricted customer records', 'Operations agent → file tool → regulated incident archive', 'Evidence: identity, privilege, tool scope, DSPM lineage']
    },
    spend: {
      leg: 'graph', label: 'Illustrative ownership state',
      head: 'Example result: unowned AI spend is concentrated in two unresolved business routes.',
      rows: ['Research workspace · owner unresolved', 'External evaluation route · cost centre missing', 'Evidence: gateway usage + application inventory + ownership graph']
    },
    desktop: {
      leg: 'abstain', label: 'Coverage boundary',
      head: 'No. The available evidence cannot prove universal enforcement across every AI surface.',
      rows: ['Arbitrary desktop or Electron clients are not covered merely because managed interception exists.', 'Unsupported routes remain opaque until a supported collector or explicit managed launch provides evidence.']
    },
    surfaces: {
      leg: 'graph', label: 'Surface distinction',
      head: 'Surface identity is retained when collector evidence identifies it.',
      rows: ['Codex agent, Claude browser chat and Claude Cowork remain distinct surface identities when the available evidence supports that distinction.', 'The decision record keeps surface, process, identity, route and collection authority separate; unresolved dimensions remain unknown.']
    },
    unknown: {
      leg: 'abstain', label: 'Insufficient evidence',
      head: 'I do not have enough evidence to answer that confidently.',
      rows: ['Try asking about controls, agents, sensitive data, spend, surfaces or coverage.']
    }
  };

  function routeQuestion(question) {
    var q = question.toLowerCase();
    var universal = /\b(every|all|universal|always|100%)\b/.test(q);
    var governedSurface = /\b(prompts?|desktops?|surfaces?|routes?|captures?|captured|capturing|enforces?|enforced|enforcement|controls?|controlled)\b/.test(q);
    if ((universal && governedSurface) || /prove\s+(?:that\s+)?(?:every|all)/.test(q)) return HIVE.desktop;
    if (/surface|browser|cli|chat|cowork|codex|claude/.test(q)) return HIVE.surfaces;
    if (/configured|not proven|control|efficacy/.test(q)) return HIVE.controls;
    if (/agent|sensitive|reach|mcp|tool/.test(q)) return HIVE.agents;
    if (/spend|cost|bill|unowned|budget/.test(q)) return HIVE.spend;
    return HIVE.unknown;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character];
    });
  }

  var demoLog = document.getElementById('demoLog');
  var demoForm = document.getElementById('demoForm');
  var demoInput = document.getElementById('demoInput');
  var demoSuggestions = document.getElementById('demoSuggestions');

  function appendMessage(className, html) {
    var message = document.createElement('div');
    message.className = 'message ' + className;
    message.innerHTML = html;
    demoLog.appendChild(message);
    demoLog.scrollTop = demoLog.scrollHeight;
    return message;
  }

  function answerQuestion(question) {
    var cleaned = question.trim();
    if (!cleaned || !demoLog) return;
    appendMessage('user-message', '<p>' + escapeHtml(cleaned) + '</p>');
    demoLog.setAttribute('aria-busy', 'true');
    var placeholder = appendMessage('hive-message', '<p>Resolving evidence…</p>');
    var result = routeQuestion(cleaned);
    var render = function () {
      placeholder.innerHTML = '<span class="answer-leg ' + result.leg + '">' + result.label + '</span><p>' + result.head + '</p>' +
        '<ul>' + result.rows.map(function (row) { return '<li>' + row + '</li>'; }).join('') + '</ul>';
      demoLog.setAttribute('aria-busy', 'false');
      demoLog.scrollTop = demoLog.scrollHeight;
    };
    if (reduce) render(); else window.setTimeout(render, 360);
  }

  if (demoForm && demoInput && demoLog) {
    demoForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var question = demoInput.value;
      demoInput.value = '';
      answerQuestion(question);
    });
  }
  if (demoSuggestions) {
    demoSuggestions.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (button) answerQuestion(button.textContent);
    });
  }

  /* The fold: a single projected surface carrying one decision history. */
  var fieldCanvas = document.getElementById('statefoldField');
  var spatialStage = document.querySelector('[data-spatial]');
  if (fieldCanvas && spatialStage) {
    var context = fieldCanvas.getContext('2d', { alpha: true });
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim() || '180,241,60';
    var visible = true;
    var frame = 0;
    var started = performance.now();
    var pointer = { x:0, y:0, tx:0, ty:0 };
    var size = { w:0, h:0, dpr:1 };
    var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.connection && navigator.connection.saveData);
    var columns = lowPower ? 26 : 42;
    var rows = lowPower ? 7 : 11;
    var stops = [{y:-72,z:155},{y:74,z:34},{y:-42,z:-98},{y:34,z:82},{y:-88,z:-36},{y:52,z:128},{y:-18,z:4}];

    function resizeField() {
      var canvasPosition = getComputedStyle(fieldCanvas).position;
      var rect = canvasPosition === 'relative' ? fieldCanvas.getBoundingClientRect() : spatialStage.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);
      size.w = Math.max(1, rect.width);
      size.h = Math.max(1, rect.height);
      size.dpr = dpr;
      fieldCanvas.width = Math.round(size.w * dpr);
      fieldCanvas.height = Math.round(size.h * dpr);
      fieldCanvas.style.width = size.w + 'px';
      fieldCanvas.style.height = size.h + 'px';
      context.setTransform(dpr,0,0,dpr,0,0);
      fieldCanvas.classList.add('ready');
      if (reduce) renderField(performance.now());
    }

    function rotatePoint(point, ry, rx, rz) {
      var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      var x = point.x * cy - point.z * sy;
      var z = point.x * sy + point.z * cy;
      var y = point.y * cx - z * sx;
      z = point.y * sx + z * cx;
      var cz = Math.cos(rz || 0), sz = Math.sin(rz || 0);
      return { x:x*cz-y*sz, y:x*sz+y*cz, z:z };
    }

    function projectPoint(point) {
      var camera = 960;
      var scale = camera / (camera + point.z);
      return { x:size.w*.5 + point.x*scale, y:size.h*.49 + point.y*scale, z:point.z, s:scale };
    }

    function line(from, to, width, color) {
      context.beginPath(); context.moveTo(from.x,from.y); context.lineTo(to.x,to.y);
      context.lineWidth = width || 1; context.strokeStyle = color; context.stroke();
    }

    function foldPoint(u, v, time, scrollProgress) {
      var safe = Number.isFinite(u) ? Math.min(1,Math.max(0,u)) : 0;
      var scaled = safe * (stops.length - 1);
      var index = Math.max(0,Math.min(stops.length - 2,Math.floor(scaled)));
      var local = scaled - index;
      var a = stops[index] || stops[0], b = stops[index+1] || a;
      var pulse = Math.sin(time*.00028 + safe*7.4) * (3 + scrollProgress*3);
      var span = 172 - Math.abs(safe-.5)*28;
      return {
        x:(safe-.5)*780,
        y:a.y+(b.y-a.y)*local+v*span+pulse,
        z:a.z+(b.z-a.z)*local+Math.sin(v*Math.PI)*26+scrollProgress*Math.sin(safe*Math.PI*6)*12
      };
    }

    function polygon(points, fill, stroke) {
      context.beginPath(); context.moveTo(points[0].x,points[0].y);
      for (var i=1;i<points.length;i+=1) context.lineTo(points[i].x,points[i].y);
      context.closePath(); context.fillStyle = fill; context.fill();
      context.strokeStyle = stroke; context.lineWidth = .65; context.stroke();
    }

    function renderField(now) {
      if (!visible || document.hidden) { frame = 0; return; }
      context.clearRect(0,0,size.w,size.h);
      pointer.x += (pointer.tx-pointer.x)*.045;
      pointer.y += (pointer.ty-pointer.y)*.045;
      var elapsed = reduce ? 0 : now-started;
      var rect = spatialStage.getBoundingClientRect();
      var top = window.pageYOffset + rect.top;
      var pageProgress = Math.min(1,Math.max(0,(window.pageYOffset+window.innerHeight-top)/(Math.max(1,spatialStage.offsetHeight)+window.innerHeight)));
      var ry = -.2 + pointer.x*.14 + pageProgress*.08;
      var rx = .77 + pointer.y*.08;
      var rz = -.12 + Math.sin(elapsed*.00008)*.018;
      var cells = [];
      for (var column=0;column<columns;column+=1) {
        for (var row=0;row<rows;row+=1) {
          var u0=column/columns,u1=(column+1)/columns,v0=row/rows*2-1,v1=(row+1)/rows*2-1;
          var raw=[foldPoint(u0,v0,elapsed,pageProgress),foldPoint(u1,v0,elapsed,pageProgress),foldPoint(u1,v1,elapsed,pageProgress),foldPoint(u0,v1,elapsed,pageProgress)];
          var rotated=raw.map(function(point){return rotatePoint(point,ry,rx,rz);});
          var avg=(rotated[0].z+rotated[1].z+rotated[2].z+rotated[3].z)/4;
          cells.push({z:avg,points:rotated.map(projectPoint),column:column});
        }
      }
      cells.sort(function(a,b){return b.z-a.z;});
      cells.forEach(function(cell){
        var light=Math.max(0,Math.min(1,(cell.z+220)/500));
        var ridge=cell.column%Math.max(1,Math.floor(columns/6))===0;
        var alpha=.028+light*.12+(ridge?.035:0);
        polygon(cell.points,'rgba(255,255,255,'+alpha+')','rgba(255,255,255,'+(.025+light*.055)+')');
      });
      var previous=null;
      for (var seam=0;seam<=120;seam+=1) {
        var unit=seam/120;
        var seamPoint=projectPoint(rotatePoint(foldPoint(unit,0,elapsed,pageProgress),ry,rx,rz));
        if (previous) line(previous,seamPoint,1.45,'rgba('+accent+',.78)');
        previous=seamPoint;
      }
      for (var signal=0;signal<8;signal+=1) {
        var travel=(elapsed*.000075+signal/8)%1;
        var lane=((signal%3)-1)*.36;
        var signalPoint=projectPoint(rotatePoint(foldPoint(travel,lane,elapsed,pageProgress),ry,rx,rz));
        context.beginPath();context.arc(signalPoint.x,signalPoint.y,2.1+signalPoint.s,0,Math.PI*2);
        context.fillStyle='rgba('+accent+','+(.55+signalPoint.s*.22)+')';context.fill();
      }
      frame = reduce ? 0 : window.requestAnimationFrame(renderField);
    }

    if (!reduce) {
      spatialStage.addEventListener('pointermove',function(event){
        var rect=spatialStage.getBoundingClientRect();
        pointer.tx=((event.clientX-rect.left)/rect.width-.5)*2;
        pointer.ty=((event.clientY-rect.top)/rect.height-.5)*2;
      },{passive:true});
      spatialStage.addEventListener('pointerleave',function(){pointer.tx=0;pointer.ty=0;});
    }
    if ('ResizeObserver' in window) new ResizeObserver(resizeField).observe(spatialStage);
    else window.addEventListener('resize',resizeField,{passive:true});
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(entries){
        visible=entries[0].isIntersecting;
        if (visible&&!frame) frame=window.requestAnimationFrame(renderField);
      },{rootMargin:'180px 0px'}).observe(spatialStage);
    }
    document.addEventListener('visibilitychange',function(){
      if (!document.hidden && visible && !frame && !reduce) frame=window.requestAnimationFrame(renderField);
    });
    resizeField();
    if (!reduce) frame=window.requestAnimationFrame(renderField);
  }
})();
