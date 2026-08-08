(function () {
  'use strict';

  var canvas = document.getElementById('voidCanvas');
  var stage = document.querySelector('[data-void]');
  if (!canvas || !stage) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uQuality;
    uniform float uIntro;

    #define MAX_LAYERS 7

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
      vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) /
        min(uResolution.x, uResolution.y);
      p -= uPointer * vec2(0.008, 0.005);

      float resolve = uIntro * uIntro * (3.0 - 2.0 * uIntro);
      float baseRadius = length(p);
      vec2 domain = rotate2(-uTime * 0.006) * p;
      float warpA = fbm3(domain * 3.45 + vec2(2.7, -1.9));
      float warpB = fbm3(domain * 3.45 + vec2(-5.8, 4.2));
      vec2 warp = vec2(warpA - 0.5, warpB - 0.5);

      vec3 radiance = vec3(0.0);
      float transmission = 1.0;
      int layerCount = uQuality < 0.35 ? 4 :
        (uQuality < 0.72 ? 6 : 7);

      for (int layer = 0; layer < MAX_LAYERS; layer++) {
        if (layer >= layerCount) break;
        float slice = float(layer) / float(layerCount - 1);
        float z = slice * 2.0 - 1.0;
        vec2 lp = p;
        lp.x += z * 0.020;
        lp.y = (lp.y - z * 0.032) * 1.09;
        lp *= 1.0 + z * 0.025;

        float initialRadius = length(lp);
        float spin = uTime *
          (0.025 + 0.16 * exp(-initialRadius * 3.8));
        lp = rotate2(-spin) * lp;
        lp += warp * (0.026 + initialRadius * 0.020);

        float radius = length(lp);
        float angle = atan(lp.y, lp.x);
        float logRadius = log(radius + 0.042);
        float layerSeed = hash21(
          vec2(float(layer) + 0.37, 19.17)
        );
        float seedSigned = layerSeed - 0.5;
        vec2 swirlPoint = rotate2(
          -logRadius * 2.35 + warp.y * 0.85
        ) * lp;
        float cloudNoise = fbm3(
          swirlPoint * 3.9 + vec2(layerSeed * 8.3, z * 3.7)
        );
        float breakup = fbm3(
          rotate2(0.71) * swirlPoint * 8.8 +
          vec2(-z * 7.2, layerSeed * 17.1)
        );
        float micro = noise2(
          swirlPoint * 31.0 + vec2(layerSeed * 29.4, z * 11.3)
        );
        float armPhase = angle * 2.0 -
          logRadius * (5.15 + seedSigned * 0.9) +
          warp.x * 4.8 +
          sin(angle * 3.0 + warp.y * 4.0) * 0.78 +
          seedSigned * 0.9;
        float armWave = 0.5 + 0.5 * cos(armPhase);
        float cloudField = armWave * 0.54 +
          cloudNoise * 0.36 + breakup * 0.10;
        float cloudGate = smoothstep(0.38, 0.61, cloudField);
        float broad = cloudGate * (0.24 + cloudNoise * 0.76);
        float ribbonPhase = angle * 5.0 -
          logRadius * (9.4 + seedSigned * 1.8) +
          warp.y * 5.7 + cloudNoise * 3.8 + layerSeed * 2.1;
        float ribbon = ridge(ribbonPhase, 8.0) * cloudGate *
          (0.28 + breakup * 0.72);
        float fiberPhase = angle * 13.0 -
          logRadius * (18.2 + seedSigned * 3.2) +
          warp.x * 8.1 + cloudNoise * 7.2 +
          sin(angle * 7.0 + radius * 31.0) * 0.72 +
          layerSeed * 7.0;
        float wispGate = smoothstep(
          0.33, 0.60, micro * 0.72 + cloudGate * 0.38
        );
        float fiber = ridge(fiberPhase, 27.0) * wispGate *
          (0.22 + breakup * 0.78);

        float inner = smoothstep(0.145, 0.190, radius);
        float resolvedOuter = mix(0.34, 0.86, resolve);
        float outer = 1.0 - smoothstep(
          resolvedOuter - 0.27,
          resolvedOuter,
          radius
        );
        float vertical = exp(-z * z * 2.15);
        float structure = broad * 0.48 +
          ribbon * 1.08 + fiber * 1.82;
        float density = inner * outer * vertical * structure *
          (0.46 + breakup * 0.88) *
          mix(0.65, 1.0, resolve);

        float filament = clamp(
          ribbon * 0.46 + fiber * 1.15, 0.0, 1.0
        );
        vec3 ion = vec3(0.12, 0.36, 1.42);
        vec3 rose = vec3(1.16, 0.095, 0.25);
        vec3 ivory = vec3(1.18, 0.78, 0.53);
        float roseZone = smoothstep(0.24, 0.57, radius);
        vec3 layerColor = mix(ion, rose, roseZone);
        float ivoryAmount = clamp(
          fiber * 0.92 + ribbon * 0.14, 0.0, 0.82
        );
        layerColor = mix(layerColor, ivory, ivoryAmount);
        layerColor *= mix(0.70, 1.04, slice);

        float absorption = 1.0 - exp(
          -density * mix(0.62, 0.90, uQuality)
        );
        radiance += transmission * layerColor * absorption *
          (2.05 + filament * 1.82);
        transmission *= 1.0 - absorption * 0.48;
      }

      float volumeAlpha = 1.0 - transmission;
      float outerEnvelope = 1.0 - smoothstep(0.58, 0.91, baseRadius);
      float haze = outerEnvelope *
        (0.025 + 0.075 * warpA * warpB) * resolve;
      vec3 color = radiance +
        vec3(0.005, 0.009, 0.035) * haze * 1.6;
      float alpha = max(volumeAlpha, haze * 0.75);

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
      float mappedPeak = 1.0 - exp(-peak * 0.78);
      color *= mappedPeak / max(peak, 0.0001);
      float luminance = dot(
        color, vec3(0.2126, 0.7152, 0.0722)
      );
      color = mix(vec3(luminance), color, 1.12);
      color = pow(max(color, 0.0), vec3(0.94));
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

  gl.useProgram(program);
  var uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    time: gl.getUniformLocation(program, 'uTime'),
    quality: gl.getUniformLocation(program, 'uQuality'),
    intro: gl.getUniformLocation(program, 'uIntro')
  };
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var quality = lowPower ? 0.18 : 0.62;
  var scale = lowPower ? 0.62 : 0.78;
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
    var intro = reduced ? 1 : Math.min(1, elapsed / 4000);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.uniform1f(uniforms.time, elapsed * 0.001);
    gl.uniform1f(uniforms.quality, quality);
    gl.uniform1f(uniforms.intro, intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add('ready');

    if (!reduced) {
      var delta = now - lastFrame;
      lastFrame = now;
      if (elapsed > 3500 && frameTimes.length < 90) frameTimes.push(delta);
      if (frameTimes.length === 90) {
        var average = frameTimes.reduce(function (sum, value) { return sum + value; }, 0) / frameTimes.length;
        if (average > 22 && scale > 0.58) {
          scale = Math.max(0.58, scale - 0.12);
          quality = Math.max(0.12, quality - 0.18);
          frameTimes.length = 0;
        }
      }
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

  stage.addEventListener('pointermove', function (event) {
    var rect = stage.getBoundingClientRect();
    pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
    pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 0.26;
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; });

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
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
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
