(function () {
  'use strict';

  var canvas = document.getElementById('voidCanvas');
  var stage = document.querySelector('[data-void]');
  if (!canvas || !stage) return;

  var reducedQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(reducedQuery && reducedQuery.matches);
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.connection && navigator.connection.saveData);
  var gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    stage.classList.add('void-fallback');
    return;
  }

  var vertexSource = `#version 300 es
    precision highp float;
    const vec2 POSITIONS[3] = vec2[](
      vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0)
    );
    void main() {
      gl_Position = vec4(POSITIONS[gl_VertexID], 0.0, 1.0);
    }
  `;

  var fragmentSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec2 uResolution;
    uniform vec2 uOrigin;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uQuality;
    uniform float uIntro;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x),
        f.y
      );
    }

    float fbm3(vec2 p) {
      float value = 0.0;
      float amplitude = 0.52;
      mat2 basis = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 3; i++) {
        value += noise2(p) * amplitude;
        p = basis * p * 2.03 + 7.13;
        amplitude *= 0.48;
      }
      return value;
    }

    mat2 rotate2(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    float ridge(float phase, float sharpness) {
      return pow(max(0.0, 0.5 + 0.5 * cos(phase)), sharpness);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - uOrigin * uResolution.xy) /
        min(uResolution.x, uResolution.y);
      vec2 fieldP = p - uPointer * vec2(0.008, 0.005);

      float resolve = uIntro * uIntro * (3.0 - 2.0 * uIntro);
      float baseRadius = length(p);
      float spin = uTime *
        (0.018 + 0.115 * exp(-baseRadius * 3.9));
      vec2 domain = rotate2(-spin) * fieldP;
      float radius = length(domain);
      float angle = atan(domain.y, domain.x);
      float logRadius = log(radius + 0.046);
      vec2 spiralPoint = rotate2(-logRadius * 0.72) * domain;
      float warpA = fbm3(
        spiralPoint * 4.6 + vec2(uTime * 0.012, -uTime * 0.009)
      );
      float warpB = fbm3(
        rotate2(0.93) * spiralPoint * 9.2 +
        vec2(-uTime * 0.019, uTime * 0.014)
      );
      float breakup = fbm3(
        rotate2(-0.57) * spiralPoint * 17.5 +
        vec2(uTime * 0.024, -uTime * 0.017)
      );
      float micro = noise2(
        spiralPoint * 47.0 + vec2(-uTime * 0.033, uTime * 0.027)
      );

      float outerRadius = mix(0.34, 0.88, resolve);
      float inner = smoothstep(0.145, 0.190, radius);
      float outer = 1.0 - smoothstep(
        outerRadius - 0.24, outerRadius, radius
      );
      float disk = inner * outer;
      float flowPhase = angle - logRadius * 1.16;
      float broad = 0.5 + 0.5 * cos(
        flowPhase * 3.0 + (warpA - 0.5) * 2.4
      );
      float ribbonA = ridge(
        flowPhase * 6.0 + (warpB - 0.5) * 5.2, 6.0
      );
      float ribbonB = ridge(
        flowPhase * 10.0 + 1.7 + (breakup - 0.5) * 6.8, 8.0
      );
      float fiberA = ridge(
        flowPhase * 19.0 + (warpB - 0.5) * 9.4 +
        sin(radius * 38.0) * 0.44, 16.0
      );
      float fiberB = ridge(
        flowPhase * 29.0 - 2.1 + (warpA - 0.5) * 12.0 -
        (breakup - 0.5) * 4.6, 20.0
      );
      float strandGate = 0.38 + 0.62 * smoothstep(
        0.20, 0.82, breakup * 0.64 + micro * 0.36
      );
      float orbital = ridge(
        radius * 84.0 - angle * 2.0 + warpB * 4.2, 13.0
      );
      float filaments = broad * 0.10 + ribbonA * 0.72 +
        ribbonB * 0.48 + fiberA * 1.18 * strandGate +
        fiberB * 0.76 * strandGate + orbital * 0.30;
      float directional = 0.80 + 0.20 * cos(angle - 0.48);
      float emission = disk * (0.07 + filaments) *
        (0.62 + warpA * 0.52) * directional * resolve;

      vec3 ion = vec3(0.10, 0.34, 1.36);
      vec3 rose = vec3(1.12, 0.08, 0.23);
      vec3 ivory = vec3(1.20, 0.82, 0.58);
      float roseZone = smoothstep(0.26, 0.66, radius);
      vec3 diskColor = mix(ion, rose, roseZone);
      float ivoryAmount = clamp(
        fiberA * 0.44 + fiberB * 0.28 + orbital * 0.12,
        0.0, 0.50
      );
      diskColor = mix(diskColor, ivory, ivoryAmount);
      vec3 radiance = diskColor * emission *
        mix(1.90, 2.24, uQuality);
      float volumeAlpha = clamp(
        disk * (0.130 + filaments * 0.40 + warpA * 0.080) *
        resolve,
        0.0, 0.94
      );
      float outerEnvelope = 1.0 - smoothstep(0.58, 0.91, baseRadius);
      float haze = outerEnvelope *
        (0.035 + 0.095 * warpA * warpB) * resolve;
      vec3 color = radiance +
        vec3(0.005, 0.009, 0.035) * haze * 1.6;
      float alpha = max(volumeAlpha, haze * 0.88);

      float coreRadius = 0.135;
      float corona = exp(-pow(
        (baseRadius - coreRadius) / 0.025,
        2.0
      ));
      float bloom = exp(-pow(baseRadius / 0.235, 2.0));
      float coronaAngle = atan(p.y, p.x);
      float lensTexture = 0.68 + 0.32 * noise2(
        vec2(cos(coronaAngle), sin(coronaAngle)) * 4.4 +
        vec2(uTime * 0.045, -uTime * 0.032)
      );
      alpha = max(
        alpha,
        corona * mix(0.48, 0.94, resolve) + bloom * 0.13 * resolve
      );

      float pixel = 1.5 / min(uResolution.x, uResolution.y);
      float core = 1.0 - smoothstep(
        coreRadius - pixel,
        coreRadius + pixel,
        baseRadius
      );
      vec2 stoneUv = p / coreRadius;
      float stoneZ = sqrt(max(0.0, 1.0 - dot(stoneUv, stoneUv)));
      vec3 stoneNormal = normalize(vec3(stoneUv, stoneZ * 0.72));
      vec3 stoneLight = normalize(vec3(-0.52, 0.66, 1.0));
      float stoneNoise =
        noise2(stoneUv * 16.0 + vec2(3.2)) * 0.68 +
        noise2(stoneUv * 49.0 - vec2(8.1)) * 0.32;
      float stoneKey = max(dot(stoneNormal, stoneLight), 0.0);
      vec3 stone = vec3(0.0025, 0.0035, 0.0070);
      stone += vec3(0.012, 0.015, 0.024) *
        (stoneNoise * 0.35 + stoneKey * 0.28);
      color = mix(color, stone, core);
      alpha = max(alpha, core * 0.995);
      color += (vec3(0.88, 1.05, 1.55) * corona * lensTexture *
        mix(0.76, 1.92, resolve) +
        vec3(0.22, 0.40, 1.08) * bloom * 0.12) *
        (1.0 - core);

      float peak = max(color.r, max(color.g, color.b));
      float mappedPeak = 1.0 - exp(-peak * 0.90);
      color *= mappedPeak / max(peak, 0.0001);
      float luminance = dot(
        color, vec3(0.2126, 0.7152, 0.0722)
      );
      color = mix(vec3(luminance), color, 1.26);
      color = pow(max(color, 0.0), vec3(1.02));
      color = clamp(color, 0.0, 1.0);

      alpha *= 1.0 - smoothstep(0.78, 0.94, baseRadius);
      alpha = clamp(alpha, 0.0, 1.0);
      float dither =
        (hash21(gl_FragCoord.xy + uTime * 0.01) - 0.5) / 255.0;
      color += dither * alpha;
      if (alpha < 0.001) color = vec3(0.0);
      outColor = vec4(color, alpha);
    }
  `;

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Statefold void shader unavailable:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vertex = compile(gl.VERTEX_SHADER, vertexSource);
  var fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    stage.classList.add('void-fallback');
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Statefold void renderer unavailable:', gl.getProgramInfoLog(program));
    stage.classList.add('void-fallback');
    return;
  }

  stage.classList.add('void-enhanced');
  gl.useProgram(program);
  var uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    origin: gl.getUniformLocation(program, 'uOrigin'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    time: gl.getUniformLocation(program, 'uTime'),
    quality: gl.getUniformLocation(program, 'uQuality'),
    intro: gl.getUniformLocation(program, 'uIntro')
  };
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var origin = { x: 0.72, y: 0.52 };
  var quality = lowPower ? 0.18 : 0.62;
  var scale = lowPower ? 0.52 : 0.66;
  var hasStarted = false;
  var inViewport = false;
  var visible = false;
  var elapsedBeforePause = 0;
  var activeSince = 0;
  var frame = 0;
  var frameTimes = [];
  var lastFrame = 0;

  function resize() {
    var rect = stage.getBoundingClientRect();
    var stageStyle = getComputedStyle(stage);
    var originX = parseFloat(stageStyle.getPropertyValue('--void-origin-x'));
    var originY = parseFloat(stageStyle.getPropertyValue('--void-origin-y'));
    origin.x = Number.isFinite(originX) ? originX / 100 : 0.72;
    origin.y = Number.isFinite(originY) ? originY / 100 : 0.52;
    var dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.45);
    var width = Math.max(2, Math.round(rect.width * dpr * scale));
    var height = Math.max(2, Math.round(rect.height * dpr * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function render(now) {
    frame = 0;
    if (!visible) return;
    pointer.x += (pointer.tx - pointer.x) * 0.035;
    pointer.y += (pointer.ty - pointer.y) * 0.035;
    var elapsed = Math.max(0, elapsedBeforePause + now - activeSince);
    var intro = reduced ? 1 : Math.min(1, elapsed / 1500);

    if (!reduced) {
      var delta = now - lastFrame;
      lastFrame = now;
      if (elapsed > 3500 && frameTimes.length < 90) frameTimes.push(delta);
      if (frameTimes.length === 90) {
        var average = frameTimes.reduce(function (sum, value) { return sum + value; }, 0) / frameTimes.length;
        if (average > 22 && scale > 0.42) {
          scale = Math.max(0.42, scale - 0.10);
          quality = Math.max(0.12, quality - 0.18);
          resize();
        }
        frameTimes.length = 0;
      }
    }

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.origin, origin.x, 1 - origin.y);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.uniform1f(uniforms.time, elapsed * 0.001);
    gl.uniform1f(uniforms.quality, quality);
    gl.uniform1f(uniforms.intro, intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add('ready');

    if (!reduced) {
      frame = requestAnimationFrame(render);
    }
  }

  function wakeStage() {
    if (!hasStarted) {
      hasStarted = true;
      activeSince = performance.now();
      lastFrame = activeSince;
      stage.classList.add('void-awake');
    }
    if (!frame) frame = requestAnimationFrame(render);
  }

  function setStageVisibility(nextVisible) {
    if (nextVisible === visible) return;
    var now = performance.now();
    if (nextVisible) {
      visible = true;
      activeSince = now;
      lastFrame = now;
      stage.classList.add('void-visible');
      wakeStage();
    } else {
      if (hasStarted) elapsedBeforePause += Math.max(0, now - activeSince);
      visible = false;
      stage.classList.remove('void-visible');
    }
  }

  var pointerSurface = stage.closest('.hero') || stage;
  pointerSurface.addEventListener('pointermove', function (event) {
    var rect = pointerSurface.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 0.26;
  }, { passive: true });
  pointerSurface.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; });

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inViewport = entries[0].isIntersecting;
      setStageVisibility(inViewport && !document.hidden);
    }, { rootMargin: '0px', threshold: 0.12 }).observe(stage);
  } else {
    inViewport = true;
    setStageVisibility(!document.hidden);
  }
  document.addEventListener('visibilitychange', function () {
    setStageVisibility(inViewport && !document.hidden);
  });
  if (reducedQuery) {
    var syncReducedMotion = function (event) {
      reduced = event.matches;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      elapsedBeforePause = Math.max(elapsedBeforePause, 1500);
      if (visible) {
        activeSince = performance.now();
        lastFrame = activeSince;
        frame = requestAnimationFrame(render);
      }
    };
    if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', syncReducedMotion);
    else if (reducedQuery.addListener) reducedQuery.addListener(syncReducedMotion);
  }
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    stage.classList.remove('void-enhanced');
    stage.classList.add('void-fallback');
  });

  resize();

  var overture = document.getElementById('brand-reveal');
  var overtureTicking = false;
  function updateOverture() {
    var progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
    if (overture) overture.style.setProperty('--overture-progress', progress.toFixed(4));
    overtureTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!overtureTicking) {
      overtureTicking = true;
      requestAnimationFrame(updateOverture);
    }
  }, { passive: true });
})();
