/* Statefold Reaction Field — native-resolution Gray-Scott membranes and sound. */
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
    activeSources.forEach(function (source) { try { source.stop(); } catch (error) {} });
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
    var startSound = function () {
      stopSound();
      var startAt = audioContext.currentTime + .04;
      var master = audioContext.createGain();
      var compressor = audioContext.createDynamicsCompressor();
      master.gain.value = .52;
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
      filter.frequency.setValueAtTime(175, startAt);
      filter.frequency.exponentialRampToValueAtTime(680, startAt + 3.35);
      gain.gain.setValueAtTime(.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(.028, startAt + .6);
      gain.gain.exponentialRampToValueAtTime(.016, startAt + 2.8);
      gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
      source.connect(filter).connect(gain).connect(master);
      source.start(startAt);
      source.stop(startAt + duration + .04);
      activeSources.push(source);

      tone(master, 'sine', 38, 54, 0, 3.72, .020, startAt);
      tone(master, 'triangle', 78, 108, .18, 3.34, .005, startAt);
      tone(master, 'sine', 182, 260, 3.28, .72, .015, startAt);
      tone(master, 'sine', 364, 520, 3.32, .54, .005, startAt);
      tone(master, 'sine', 64, 48, 4.08, .48, .019, startAt);
      tone(master, 'sine', 486, 405, 4.10, .42, .005, startAt);
    };
    if (audioContext.state === 'suspended') audioContext.resume().then(startSound);
    else startSound();
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

  var vertexSource = `#version 300 es
  in vec2 aPosition;
  out vec2 vUv;
  void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}`;

  var simulationSource = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outState;
  uniform sampler2D uState;
  uniform vec2 uTexel;

  void main(){
    vec2 center=texture(uState,vUv).rg;
    vec2 lap=-center;
    lap+=texture(uState,vUv+vec2( uTexel.x,0.0)).rg*.20;
    lap+=texture(uState,vUv+vec2(-uTexel.x,0.0)).rg*.20;
    lap+=texture(uState,vUv+vec2(0.0, uTexel.y)).rg*.20;
    lap+=texture(uState,vUv+vec2(0.0,-uTexel.y)).rg*.20;
    lap+=texture(uState,vUv+uTexel).rg*.05;
    lap+=texture(uState,vUv-uTexel).rg*.05;
    lap+=texture(uState,vUv+vec2(uTexel.x,-uTexel.y)).rg*.05;
    lap+=texture(uState,vUv+vec2(-uTexel.x,uTexel.y)).rg*.05;

    float spatial=.5+.5*sin(vUv.x*5.3+sin(vUv.y*4.1));
    float feed=.0288+spatial*.0027;
    float kill=.0568+spatial*.0025;
    float reaction=center.x*center.y*center.y;
    float a=center.x+(lap.x*.96-reaction+feed*(1.0-center.x));
    float b=center.y+(lap.y*.47+reaction-(kill+feed)*center.y);
    outState=vec4(clamp(a,0.0,1.0),clamp(b,0.0,1.0),0.0,1.0);
  }`;

  var displaySource = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uTime;

  void main(){
    float b=texture(uState,vUv).g;
    float filament=pow(smoothstep(.22,.50,b),.90);
    float atmosphere=smoothstep(.055,.30,b);
    float ink=filament*.94+atmosphere*.008;
    ink=pow(clamp(ink*2.15,0.0,1.0),.84);

    vec2 p=(vUv-.5)*vec2(1.72,1.0);
    float t=min(uTime,5.2);
    float intro=smoothstep(.04,.52,t);
    float clear=smoothstep(3.40,4.46,t);
    float center=1.0-smoothstep(.14,.72,length(p));
    ink*=intro*(1.0-clear*(.36+.64*center));
    ink*=1.0-smoothstep(4.16,4.96,t)*.95;

    vec3 paper=vec3(1.0);
    vec3 charcoal=vec3(.018,.020,.022);
    outColor=vec4(mix(paper,charcoal,clamp(ink,0.0,.92)),1.0);
  }`;

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  function createProgram(fragmentSource) {
    var program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }

  var simulationProgram;
  var displayProgram;
  try {
    simulationProgram = createProgram(simulationSource);
    displayProgram = createProgram(displaySource);
  } catch (error) {
    stage.classList.add('flow-fallback-active');
    wireSound();
    return;
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var framebuffer = gl.createFramebuffer();
  var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.connection && navigator.connection.saveData);
  var simWidth = lowPower ? 600 : 1200;
  var rect = stage.getBoundingClientRect();
  var simHeight = Math.max(320,Math.min(840,Math.round(simWidth*rect.height/Math.max(1,rect.width))));
  var stateTextures = [];
  var readIndex = 0;

  function seededState() {
    var data = new Uint8Array(simWidth*simHeight*4);
    for (var i=0;i<data.length;i+=4) { data[i]=255;data[i+1]=0;data[i+2]=0;data[i+3]=255; }
    var seed=21973;
    function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
    var filaments=[];
    for (var f=0;f<18;f++) {
      var angle=random()*Math.PI;
      filaments.push({
        cosine:Math.cos(angle),
        sine:Math.sin(angle),
        offset:(random()-.5)*.82,
        amplitude:.025+random()*.085,
        frequency:5+random()*11,
        phase:random()*Math.PI*2,
        width:.0007+random()*.0010
      });
    }
    for (var y=0;y<simHeight;y++) {
      for (var x=0;x<simWidth;x++) {
        var nx=x/simWidth-.5;
        var ny=y/simHeight-.5;
        for (var fIndex=0;fIndex<filaments.length;fIndex++) {
          var filament=filaments[fIndex];
          var along=nx*filament.cosine+ny*filament.sine;
          var across=-nx*filament.sine+ny*filament.cosine;
          var curve=filament.offset+Math.sin(along*filament.frequency+filament.phase)*filament.amplitude;
          if(Math.abs(across-curve)<filament.width){
            var lineIndex=(y*simWidth+x)*4;
            data[lineIndex]=32;
            data[lineIndex+1]=220;
            break;
          }
        }
      }
    }
    for (var s=0;s<3;s++) {
      var cx=Math.floor(random()*simWidth);
      var cy=Math.floor(random()*simHeight);
      var rx=Math.floor((.005+random()*.010)*simWidth);
      var ry=Math.floor((.006+random()*.014)*simHeight);
      var x0=Math.max(0,cx-rx),x1=Math.min(simWidth-1,cx+rx);
      var y0=Math.max(0,cy-ry),y1=Math.min(simHeight-1,cy+ry);
      for (var y=y0;y<=y1;y++) {
        for (var x=x0;x<=x1;x++) {
          var dx=(x-cx)/rx,dy=(y-cy)/ry;
          if (dx*dx+dy*dy<1) {
            var index=(y*simWidth+x)*4;
            data[index]=28;
            data[index+1]=218;
          }
        }
      }
    }
    return data;
  }

  function createTexture(data) {
    var texture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,simWidth,simHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
    return texture;
  }

  function bindGeometry(program) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    var location=gl.getAttribLocation(program,'aPosition');
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  }

  function resetState() {
    stateTextures.forEach(function(texture){gl.deleteTexture(texture);});
    var data=seededState();
    stateTextures=[createTexture(data),createTexture(data)];
    readIndex=0;
  }

  var simulationState=gl.getUniformLocation(simulationProgram,'uState');
  var simulationTexel=gl.getUniformLocation(simulationProgram,'uTexel');
  function simulate(steps) {
    bindGeometry(simulationProgram);
    gl.uniform1i(simulationState,0);
    gl.uniform2f(simulationTexel,1/simWidth,1/simHeight);
    gl.viewport(0,0,simWidth,simHeight);
    for (var i=0;i<steps;i++) {
      var writeIndex=1-readIndex;
      gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,stateTextures[writeIndex],0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,stateTextures[readIndex]);
      gl.drawArrays(gl.TRIANGLES,0,3);
      readIndex=writeIndex;
    }
  }

  var displayState=gl.getUniformLocation(displayProgram,'uState');
  var displayTexel=gl.getUniformLocation(displayProgram,'uTexel');
  var displayTime=gl.getUniformLocation(displayProgram,'uTime');
  function resize() {
    var bounds=stage.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var width=Math.max(1,Math.round(bounds.width*dpr));
    var height=Math.max(1,Math.round(bounds.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  }

  function display(elapsed) {
    resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvas.width,canvas.height);
    bindGeometry(displayProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,stateTextures[readIndex]);
    gl.uniform1i(displayState,0);
    gl.uniform2f(displayTexel,1/simWidth,1/simHeight);
    gl.uniform1f(displayTime,elapsed);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }

  resetState();
  simulate(lowPower ? 16 : 28);
  var start=performance.now();
  var previous=start;
  var frame=0;

  function draw(now) {
    var elapsed=Math.min(5.2,(now-start)/1000);
    var delta=Math.min(42,now-previous);
    previous=now;
    var steps=Math.max(1,Math.min(3,Math.round(delta/16.67*2)));
    simulate(steps);
    display(elapsed);
    if(elapsed<5.2&&!document.hidden)frame=requestAnimationFrame(draw);
    else{frame=0;stage.classList.add('flow-complete');}
  }

  restartVisual=function(){
    if(frame)cancelAnimationFrame(frame);
    stage.classList.remove('flow-complete','flow-dragon','flow-brand');
    void stage.offsetWidth;
    resetState();
    simulate(lowPower?16:28);
    start=performance.now();
    previous=start;
    armReveals();
    frame=requestAnimationFrame(draw);
  };

  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&!frame&&!stage.classList.contains('flow-complete')){
      previous=performance.now();
      frame=requestAnimationFrame(draw);
    }
  });
  window.addEventListener('resize',resize,{passive:true});
  wireSound();
  stage.classList.add('flow-ready');
  frame=requestAnimationFrame(draw);
})();
