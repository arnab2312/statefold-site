/* Statefold Reaction Field — monochrome procedural overture and sound design. */
(function () {
  'use strict';

  var canvas = document.getElementById('reactionCanvas');
  var stage = document.getElementById('brand-reveal');
  var soundButton = stage && stage.querySelector('.overture-sound');
  if (!canvas || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { stage.classList.add('flow-static'); return; }

  var revealTimers = [];
  function armReveals() {
    revealTimers.forEach(window.clearTimeout);
    revealTimers.length = 0;
    revealTimers.push(window.setTimeout(function () { stage.classList.add('flow-dragon'); }, 3340));
    revealTimers.push(window.setTimeout(function () { stage.classList.add('flow-brand'); }, 4140));
  }
  armReveals();

  var audioContext = null;
  var activeSources = [];
  var soundEnabled = false;

  function stopSound() {
    activeSources.forEach(function (source) { try { source.stop(); } catch (e) {} });
    activeSources.length = 0;
  }

  function tone(destination, type, frequency, endFrequency, offset, duration, volume, startAt) {
    var oscillator = audioContext.createOscillator();
    var gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt + offset);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + offset + duration);
    gain.gain.setValueAtTime(.0001, startAt + offset);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + offset + Math.min(.22, duration * .18));
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + offset + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(startAt + offset);
    oscillator.stop(startAt + offset + duration + .04);
    activeSources.push(oscillator);
  }

  function playSound() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    stopSound();

    var startAt = audioContext.currentTime + .04;
    var master = audioContext.createGain();
    var compressor = audioContext.createDynamicsCompressor();
    master.gain.value = .56;
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(audioContext.destination);

    var duration = 3.85;
    var buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    var data = buffer.getChannelData(0);
    var drift = 0;
    for (var i = 0; i < data.length; i++) {
      drift = drift * .992 + (Math.random() * 2 - 1) * .008;
      data[i] = drift;
    }
    var source = audioContext.createBufferSource();
    var filter = audioContext.createBiquadFilter();
    var gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.Q.value = .55;
    filter.frequency.setValueAtTime(190, startAt);
    filter.frequency.exponentialRampToValueAtTime(720, startAt + 3.35);
    gain.gain.setValueAtTime(.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(.032, startAt + .6);
    gain.gain.exponentialRampToValueAtTime(.018, startAt + 2.8);
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(startAt);
    source.stop(startAt + duration + .04);
    activeSources.push(source);

    tone(master, 'sine', 38, 56, 0, 3.72, .022, startAt);
    tone(master, 'triangle', 78, 112, .18, 3.34, .006, startAt);
    tone(master, 'sine', 182, 268, 3.28, .72, .017, startAt);
    tone(master, 'sine', 364, 536, 3.32, .54, .006, startAt);
    tone(master, 'sine', 64, 48, 4.08, .48, .021, startAt);
    tone(master, 'sine', 486, 405, 4.10, .42, .006, startAt);
  }

  var gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });

  var restartVisual = function () {
    stage.classList.remove('flow-dragon', 'flow-brand');
    void stage.offsetWidth;
    armReveals();
  };

  function wireSound() {
    if (!soundButton) return;
    soundButton.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      soundButton.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      soundButton.querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off';
      if (soundEnabled) { restartVisual(); playSound(); }
      else stopSound();
    });
  }

  if (!gl) {
    stage.classList.add('flow-fallback-active');
    wireSound();
    return;
  }

  var vertex = `#version 300 es
  in vec2 aPosition;
  void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;

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
    for(int i=0;i<4;i++){v+=a*noise(p);p=m*p*2.02+13.7;a*=.5;}
    return v;
  }

  void main(){
    vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
    vec2 p=uv*1.86;
    float t=min(uTime,5.2);
    float drift=t*.105;

    vec2 warpA=vec2(
      fbm(p*.72+vec2(.18,drift)),
      fbm(p*.72+vec2(5.26,-drift*.82))
    )-.5;
    vec2 warpB=vec2(
      fbm(p*.98+warpA*1.28+vec2(-drift*.42,7.1)),
      fbm(p*.98+warpA*1.28+vec2(8.7,drift*.36))
    )-.5;
    vec2 q=p+warpA*1.36+warpB*.74+vec2(drift*.16,-drift*.08);

    float membrane=fbm(q*.92+vec2(0.0,drift*.28));
    float reaction=fbm((q+vec2(membrane,-membrane)*.84)*1.48-vec2(drift*.22,0.0));
    float detail=fbm(q*2.18+warpB*.82+vec2(drift*.34,-drift*.18));
    float webAField=abs(reaction-membrane*.88-.035);
    float webAPixel=max(fwidth(webAField),.00035);
    float webA=1.0-smoothstep(webAPixel*.18,webAPixel*1.48,webAField);
    float webABody=1.0-smoothstep(webAPixel*.62,webAPixel*4.8,webAField);

    float webBField=abs(detail*.58+membrane*.42-.515);
    float webBPixel=max(fwidth(webBField),.00035);
    float webB=1.0-smoothstep(webBPixel*.20,webBPixel*1.36,webBField);
    float webBBody=1.0-smoothstep(webBPixel*.64,webBPixel*4.2,webBField);

    float webCField=abs(detail-reaction*.82-.028);
    float webCPixel=max(fwidth(webCField),.00035);
    float webC=1.0-smoothstep(webCPixel*.18,webCPixel*1.24,webCField);
    float ink=(webA*.88+webB*.55+webC*.34)*1.72+webABody*.035+webBBody*.026;
    float presence=smoothstep(.36,.60,membrane);
    ink*=mix(.10,1.0,presence);
    float intro=smoothstep(.04,.48,t);
    float clear=smoothstep(3.42,4.48,t);
    float center=1.0-smoothstep(.20,1.12,length(p*vec2(.86,1.0)));
    ink*=intro*(1.0-clear*(.34+.66*center));
    ink*=1.0-smoothstep(4.18,4.94,t)*.94;

    vec3 paper=vec3(1.0);
    vec3 charcoal=vec3(.012,.014,.016);
    vec3 color=mix(paper,charcoal,clamp(ink,0.0,.94));
    outColor=vec4(color,1.0);
  }`;

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  var program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    stage.classList.add('flow-fallback-active');
    wireSound();
    return;
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.useProgram(program);
  var position = gl.getAttribLocation(program,'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  var resolution = gl.getUniformLocation(program,'uResolution');
  var time = gl.getUniformLocation(program,'uTime');
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.connection && navigator.connection.saveData);
  var scale = lowPower ? .62 : .88;
  var start = performance.now();
  var frame = 0;
  var samples = [];
  var sampled = false;

  function resize(){
    var rect=stage.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,1.4)*scale;
    var width=Math.max(1,Math.round(rect.width*dpr));
    var height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);
  }

  function draw(now){
    var elapsed=Math.min(5.2,(now-start)/1000);
    resize();
    gl.useProgram(program);
    gl.uniform2f(resolution,canvas.width,canvas.height);
    gl.uniform1f(time,elapsed);
    gl.drawArrays(gl.TRIANGLES,0,3);

    if(!sampled&&samples.length<44)samples.push(now);
    if(!sampled&&samples.length===44){
      sampled=true;
      var average=(samples[43]-samples[0])/43;
      if(average>23&&scale>.66){scale=.66;resize();}
      samples.length=0;
    }
    if(elapsed<5.2&&!document.hidden)frame=requestAnimationFrame(draw);
    else{frame=0;stage.classList.add('flow-complete');}
  }

  restartVisual=function(){
    if(frame)cancelAnimationFrame(frame);
    stage.classList.remove('flow-complete','flow-dragon','flow-brand');
    void stage.offsetWidth;
    start=performance.now();
    samples.length=0;
    sampled=false;
    armReveals();
    frame=requestAnimationFrame(draw);
  };

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&!frame&&!stage.classList.contains('flow-complete'))frame=requestAnimationFrame(draw);
  });
  window.addEventListener('resize',resize,{passive:true});
  wireSound();
  stage.classList.add('flow-ready');
  frame=requestAnimationFrame(draw);
})();
