/* Statefold Orbit Film — supplied motion, exact brand reveal, opt-in sound. */
(function () {
  'use strict';

  var orbit = document.getElementById('orbitFilm');
  var stage = document.getElementById('brand-reveal');
  var soundButton = stage && stage.querySelector('.overture-sound');
  if (!orbit || !stage) return;

  var motionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = !!(motionQuery && motionQuery.matches);
  var timers = [];
  var loadFallback = 0;
  var loadGeneration = 0;
  var interrupted = document.hidden;
  var audioContext = null;
  var activeSources = [];
  var soundEnabled = false;

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers.length = 0;
    if (loadFallback) window.clearTimeout(loadFallback);
    loadFallback = 0;
  }

  function armReveal(generation) {
    clearTimers();
    timers.push(window.setTimeout(function () { if (generation === loadGeneration) stage.classList.add('orbit-dragon'); }, 3780));
    timers.push(window.setTimeout(function () { if (generation === loadGeneration) stage.classList.add('orbit-brand'); }, 4660));
    timers.push(window.setTimeout(function () { if (generation === loadGeneration) stage.classList.add('orbit-complete'); }, 5660));
  }

  function restartOrbit(onLaunch) {
    var source = orbit.getAttribute('data-orbit-src');
    var generation = ++loadGeneration;
    var replacement = orbit.cloneNode(false);
    var preloader = new Image();
    var settled = false;

    clearTimers();
    stage.classList.add('motion-ready');
    stage.classList.remove('orbit-static', 'orbit-dragon', 'orbit-brand', 'orbit-complete');
    replacement.removeAttribute('src');
    replacement.classList.remove('orbit-running');
    replacement.addEventListener('error', function () { resolveImmediately(generation); }, { once: true });
    orbit.replaceWith(replacement);
    orbit = replacement;

    function launch() {
      if (settled || generation !== loadGeneration || reduce) return;
      settled = true;
      if (loadFallback) window.clearTimeout(loadFallback);
      loadFallback = 0;
      replacement.setAttribute('src', source);
      window.requestAnimationFrame(function () {
        if (generation !== loadGeneration || reduce) return;
        replacement.classList.remove('orbit-running');
        void replacement.offsetWidth;
        replacement.classList.add('orbit-running');
        armReveal(generation);
        if (onLaunch) onLaunch();
      });
    }

    function fail() {
      if (settled || generation !== loadGeneration) return;
      settled = true;
      resolveImmediately(generation);
    }

    preloader.addEventListener('load', function () {
      if (preloader.decode) preloader.decode().then(launch, launch);
      else launch();
    }, { once: true });
    preloader.addEventListener('error', fail, { once: true });
    preloader.src = source;
    loadFallback = window.setTimeout(fail, 9000);
  }

  function resolveImmediately(generation) {
    if (generation && generation !== loadGeneration) return;
    clearTimers();
    stage.classList.add('orbit-dragon', 'orbit-brand', 'orbit-complete');
  }

  function stopSound() {
    activeSources.forEach(function (source) {
      try { source.stop(); } catch (error) {}
    });
    activeSources.length = 0;
  }

  function tone(destination, type, frequency, endFrequency, offset, duration, volume, startAt) {
    var oscillator = audioContext.createOscillator();
    var gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt + offset);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + offset + duration);
    gain.gain.setValueAtTime(.0001, startAt + offset);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + offset + Math.min(.22, duration * .2));
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

    function startSound() {
      stopSound();
      var startAt = audioContext.currentTime + .035;
      var master = audioContext.createGain();
      var compressor = audioContext.createDynamicsCompressor();
      master.gain.value = .28;
      compressor.threshold.value = -24;
      compressor.knee.value = 22;
      compressor.ratio.value = 3;
      master.connect(compressor).connect(audioContext.destination);

      var duration = 4.90;
      var buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
      var data = buffer.getChannelData(0);
      var drift = 0;
      for (var index = 0; index < data.length; index++) {
        drift = drift * .996 + (Math.random() * 2 - 1) * .004;
        data[index] = drift;
      }

      var source = audioContext.createBufferSource();
      var filter = audioContext.createBiquadFilter();
      var gain = audioContext.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.Q.value = .42;
      filter.frequency.setValueAtTime(96, startAt);
      filter.frequency.exponentialRampToValueAtTime(420, startAt + 4.18);
      gain.gain.setValueAtTime(.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(.018, startAt + .7);
      gain.gain.exponentialRampToValueAtTime(.010, startAt + 4.02);
      gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
      source.connect(filter).connect(gain).connect(master);
      source.start(startAt);
      source.stop(startAt + duration + .04);
      activeSources.push(source);

      tone(master, 'sine', 34, 46, 0, 4.20, .016, startAt);
      tone(master, 'triangle', 68, 92, .18, 3.92, .0035, startAt);
      tone(master, 'sine', 154, 226, 3.72, .72, .010, startAt);
      tone(master, 'sine', 308, 452, 3.78, .54, .0032, startAt);
      tone(master, 'sine', 58, 44, 4.58, .46, .012, startAt);
    }

    if (audioContext.state === 'suspended') audioContext.resume().then(startSound);
    else startSound();
  }

  if (soundButton) {
    soundButton.addEventListener('click', function () {
      if (reduce) return;
      soundEnabled = !soundEnabled;
      soundButton.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      soundButton.querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off';
      if (soundEnabled) {
        restartOrbit(function () { if (soundEnabled) playSound(); });
      } else {
        stopSound();
      }
    });
  }

  function applyMotionPreference(nextReduced) {
    reduce = nextReduced;
    if (reduce) {
      loadGeneration += 1;
      clearTimers();
      stopSound();
      soundEnabled = false;
      if (soundButton) {
        soundButton.setAttribute('aria-pressed', 'false');
        soundButton.querySelector('span').textContent = 'Sound off';
      }
      orbit.classList.remove('orbit-running');
      stage.classList.remove('motion-ready');
      stage.classList.add('orbit-static', 'orbit-dragon', 'orbit-brand', 'orbit-complete');
    } else {
      restartOrbit();
    }
  }

  if (motionQuery) {
    var onMotionChange = function (event) { applyMotionPreference(event.matches); };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      interrupted = stage.classList.contains('motion-ready') && !stage.classList.contains('orbit-complete');
      if (interrupted && soundEnabled) stopSound();
    } else if (interrupted && !reduce) {
      interrupted = false;
      restartOrbit(soundEnabled ? function () { if (soundEnabled) playSound(); } : null);
    }
  });

  applyMotionPreference(reduce);
}());
