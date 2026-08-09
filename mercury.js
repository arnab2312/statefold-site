/* Statefold Mercury Birth — cavity, dragon, then wordmark. */
(function () {
  'use strict';

  var canvas = document.getElementById('mercuryCanvas');
  var stage = document.getElementById('brand-reveal');
  if (!canvas || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { stage.classList.add('mercury-static'); return; }

  var gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });
  if (!gl) { stage.classList.add('mercury-fallback-active'); return; }

  var vertex = `#version 300 es
  in vec2 aPosition;
  void main(){ gl_Position=vec4(aPosition,0.0,1.0); }`;

  var fragment = `#version 300 es
  precision highp float;
  out vec4 outColor;
  uniform vec2 uResolution;
  uniform float uTime;

  float hash21(vec2 p){
    p=fract(p*vec2(123.34,456.21));
    p+=dot(p,p+45.32);
    return fract(p.x*p.y);
  }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float v=0.0,a=.5;
    mat2 m=mat2(.80,.60,-.60,.80);
    for(int i=0;i<4;i++){v+=a*noise(p);p=m*p*2.03+17.1;a*=.5;}
    return v;
  }
  float phase(){ return clamp(uTime,0.0,4.5); }
  float birth(){ return smoothstep(.78,2.56,phase()); }

  float field(vec3 p){
    float t=phase();
    float b=birth();
    float release=smoothstep(2.34,3.22,t);
    vec3 q=p-vec3(0.0,.12+release*.12,0.0);
    q.x*=1.0+sin(t*.42)*.028;
    q.y*=.96+cos(t*.36)*.026;
    vec3 dir=normalize(q+vec3(.0001));
    float n=fbm(dir.xy*1.72+vec2(dir.z*1.18+t*.055,-t*.038));
    float fine=fbm(dir.yz*2.62+vec2(-t*.046,t*.063));
    float flow=smoothstep(.18,.82,n*.68+fine*.32);
    float radius=mix(1.03,.74,release)+(n-.5)*.19+(fine-.5)*.075+(flow-.5)*.055;
    float cavityFront=smoothstep(.08,.82,dir.z);
    float cavityProfile=exp(-dot(q.xy,q.xy)*3.7);
    float cavity=b*cavityFront*cavityProfile*(.18+.34*b);
    return length(q)-radius+cavity;
  }
  vec3 normalAt(vec3 p){
    float e=.004;
    vec2 h=vec2(e,-e);
    return normalize(h.xyy*field(p+h.xyy)+h.yyx*field(p+h.yyx)+h.yxy*field(p+h.yxy)+h.xxx*field(p+h.xxx));
  }
  vec3 environment(vec3 d){
    d=normalize(d);
    vec3 silver=mix(vec3(.025,.028,.032),vec3(.88,.90,.92),smoothstep(-.48,.78,d.y));
    float softbox=pow(max(0.0,dot(d,normalize(vec3(-.72,.20,.66)))),9.0);
    float rimlight=pow(max(0.0,dot(d,normalize(vec3(.58,.08,.81)))),15.0);
    float floorlight=pow(max(0.0,dot(d,normalize(vec3(-.10,-.32,.94)))),18.0);
    float strip=pow(max(0.0,dot(d,normalize(vec3(-.16,.94,.30)))),72.0);
    return silver+vec3(.72)*softbox+vec3(.96)*rimlight+vec3(.34)*floorlight+vec3(1.0)*strip*2.8;
  }

  void main(){
    vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/min(uResolution.x,uResolution.y);
    float t=phase();
    float b=birth();
    float pull=smoothstep(.84,2.72,t);
    uv*=mix(1.0,.91,pull);
    vec3 ro=vec3(0.0,.02,3.25-pull*.12);
    vec3 rd=normalize(vec3(uv.x,uv.y,-1.62));

    float travel=0.0;
    bool hit=false;
    vec3 p=ro;
    for(int i=0;i<68;i++){
      p=ro+rd*travel;
      float d=field(p);
      if(d<.0018){hit=true;break;}
      travel+=clamp(d*.54,.003,.105);
      if(travel>6.2)break;
    }

    vec3 color=vec3(1.0);
    if(hit){
      vec3 n=normalAt(p);
      vec3 reflected=reflect(rd,n);
      float fresnel=pow(1.0-max(0.0,dot(-rd,n)),4.0);
      vec3 env=environment(reflected);
      vec3 metal=mix(vec3(.055,.065,.076),env,.73+.27*fresnel);
      float front=smoothstep(.12,.85,normalize(p-vec3(0,.12,0)).z);
      float cavity=exp(-dot(p.xy,p.xy)*5.2)*front*b;
      float rim=exp(-abs(length(p.xy)-(.39-.10*b))*22.0)*front*b;
      metal+=vec3(.98)*rim*.42;
      metal*=1.0-cavity*.74;
      float glint=pow(max(0.0,dot(n,normalize(vec3(-.42,.86,-.28)))),54.0);
      metal+=vec3(1.0)*glint*1.7;
      color=metal;
    }

    float intro=smoothstep(.02,.48,t);
    float exit=smoothstep(2.92,3.58,t);
    color=mix(vec3(1.0),color,intro);
    color=mix(color,vec3(1.0),exit);
    float grain=(hash21(gl_FragCoord.xy+uTime*41.0)-.5)*.006*(1.0-exit);
    color+=grain;
    color=pow(max(color,0.0),vec3(.90));
    outColor=vec4(color,1.0);
  }`;

  function shader(type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  var program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (e) {
    stage.classList.add('mercury-fallback-active');
    return;
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  gl.useProgram(program);
  var position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  var resolution = gl.getUniformLocation(program, 'uResolution');
  var time = gl.getUniformLocation(program, 'uTime');
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.connection && navigator.connection.saveData);
  var scale = lowPower ? .58 : .86;
  var start = performance.now();
  var frame = 0;
  var samples = [];
  var sampled = false;

  function resize() {
    var rect = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }
  function draw(now) {
    var elapsed = Math.min(4.5, (now - start) / 1000);
    resize();
    gl.useProgram(program);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!sampled && samples.length < 50) samples.push(now);
    if (!sampled && samples.length === 50) {
      sampled = true;
      var average = (samples[49] - samples[0]) / 49;
      if (average > 23 && scale > .68) { scale = .68; resize(); }
      samples.length = 0;
    }
    if (elapsed < 4.5 && !document.hidden) frame = requestAnimationFrame(draw);
    else { frame = 0; stage.classList.add('mercury-complete'); }
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !frame && !stage.classList.contains('mercury-complete')) frame = requestAnimationFrame(draw);
  });
  window.addEventListener('resize', resize, { passive: true });
  stage.classList.add('mercury-ready');
  frame = requestAnimationFrame(draw);
})();
