(function () {
  'use strict';

  var canvas = document.getElementById('voidCanvas');
  var stage = document.querySelector('[data-void]');
  if (!canvas || !stage) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.connection && navigator.connection.saveData);
  var gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    desynchronized: true
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

    #define MAX_STEPS 72

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                 mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
    }

    mat2 rot(float a) {
      float c = cos(a), s = sin(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
      uv *= mix(1.18, 1.0, uIntro);

      vec3 ro = vec3(uPointer.x * 0.16, 1.08 + uPointer.y * 0.12, 7.0);
      vec3 target = vec3(0.0);
      vec3 forward = normalize(target - ro);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 ray = normalize(forward * 1.74 + right * uv.x * 1.62 + up * uv.y * 1.62);

      vec3 p = ro;
      vec3 emission = vec3(0.0);
      float transmission = 1.0;
      float minRadius = 100.0;
      float travelled = 0.0;
      bool swallowed = false;
      float steps = mix(42.0, 68.0, uQuality);

      for (int i = 0; i < MAX_STEPS; i++) {
        if (float(i) >= steps) break;
        float r = length(p);
        minRadius = min(minRadius, r);

        if (r < 0.86) {
          swallowed = true;
          break;
        }

        float dt = mix(0.032, 0.23, smoothstep(1.0, 6.5, r));
        vec3 gravity = -p * (2.12 / max(r * r * r, 0.16));
        ray = normalize(ray + gravity * dt);
        vec3 nextP = p + ray * dt;

        float diskRadius = length(p.xz);
        float thickness = 0.024 + diskRadius * 0.012;
        if (diskRadius > 1.12 && diskRadius < 5.25 && abs(p.y) < thickness * 4.3) {
          float radial = smoothstep(1.12, 1.36, diskRadius) *
            (1.0 - smoothstep(4.25, 5.25, diskRadius));
          float angle = atan(p.z, p.x);
          float grain = noise(vec2(angle * 5.0 - uTime * 0.025, diskRadius * 9.0));
          float spiral = 0.52 +
            0.30 * sin(angle * 7.0 - log(diskRadius) * 17.0 - uTime * 0.16) +
            0.12 * sin(angle * 29.0 + diskRadius * 12.0) + grain * 0.18;
          float vertical = exp(-abs(p.y) / thickness);
          float density = radial * max(0.0, spiral) * vertical;
          float heat = pow(1.0 - clamp((diskRadius - 1.12) / 4.13, 0.0, 1.0), 1.62);
          vec3 tangent = normalize(vec3(-p.z, 0.0, p.x));
          float doppler = pow(clamp(1.0 + dot(tangent, -ray) * 0.73, 0.24, 1.82), 2.55);

          vec3 ion = vec3(0.10, 0.18, 0.98);
          vec3 solar = vec3(1.35, 0.31, 0.035);
          vec3 whiteHot = vec3(1.75, 1.16, 0.52);
          vec3 diskColor = mix(ion, solar, smoothstep(0.05, 0.72, heat));
          diskColor = mix(diskColor, whiteHot, pow(heat, 4.4));
          diskColor *= doppler;

          float absorb = 1.0 - exp(-density * dt * 4.1);
          emission += transmission * diskColor * absorb * 1.62;
          transmission *= 1.0 - absorb * 0.60;
        }

        p = nextP;
        travelled += dt;
        if (r > 10.5 && travelled > 7.0 && dot(p, ray) > 0.0) break;
      }

      vec3 paper = vec3(0.961, 0.956, 0.925);
      float foldA = pow(0.5 + 0.5 * cos(42.0 * (ray.y + 0.12 * sin(ray.x * 5.0))), 30.0);
      float foldB = pow(0.5 + 0.5 * cos(29.0 * (ray.x - ray.y * 0.24)), 44.0);
      paper -= (foldA * 0.017 + foldB * 0.007);

      float lensHalo = exp(-pow((minRadius - 1.35) / 0.50, 2.0));
      paper *= 1.0 - lensHalo * 0.14 * uIntro;
      paper += vec3(0.02, 0.035, 0.12) * lensHalo * 0.12;

      vec3 base = swallowed ? vec3(0.0015, 0.002, 0.004) : paper;
      vec3 color = emission * uIntro + base * transmission;
      float photon = exp(-pow((minRadius - 1.035) / 0.045, 2.0));
      color += vec3(1.42, 0.61, 0.17) * photon * 0.72 * uIntro;

      // A precise optical silhouette anchors the ray-integrated lensing.
      // Applying it after disk emission guarantees an uncompromised event
      // horizon even on conservative mobile drivers.
      float screenRadius = length(uv);
      float eventHorizon = 1.0 - smoothstep(0.145, 0.198, screenRadius);
      color = mix(color, vec3(0.001, 0.0015, 0.003), eventHorizon * uIntro);
      float screenPhoton = exp(-pow((screenRadius - 0.207) / 0.012, 2.0));
      color += vec3(1.5, 0.72, 0.22) * screenPhoton * 0.75 * uIntro;

      float vignette = smoothstep(1.15, 0.10, length(uv * vec2(0.72, 0.92)));
      color = mix(paper, color, 0.90 + vignette * 0.10);
      color = color / (1.0 + color * 0.30);
      color = pow(max(color, 0.0), vec3(0.92));
      color = mix(color, vec3(0.001, 0.0015, 0.003), eventHorizon * uIntro);
      color += vec3(1.0, 0.42, 0.10) * screenPhoton * 0.28 * uIntro;
      color += (hash21(gl_FragCoord.xy + uTime * 0.01) - 0.5) / 255.0;
      outColor = vec4(color, 1.0);
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
  var started = performance.now();
  var visible = true;
  var frame = 0;
  var frameTimes = [];
  var lastFrame = started;

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
    if (!visible && !reduced) { frame = 0; return; }
    resize();
    pointer.x += (pointer.tx - pointer.x) * 0.035;
    pointer.y += (pointer.ty - pointer.y) * 0.035;
    var elapsed = now - started;
    var intro = reduced ? 1 : Math.min(1, elapsed / 3200);
    intro = 1 - Math.pow(1 - intro, 3);

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
      visible = entries[0].isIntersecting && !document.hidden;
      if (visible && !frame && !reduced) frame = requestAnimationFrame(render);
    }, { rootMargin: '180px 0px' }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible && !frame && !reduced) frame = requestAnimationFrame(render);
  });
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    stage.classList.add('void-fallback');
  });

  resize();
  frame = requestAnimationFrame(render);

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
