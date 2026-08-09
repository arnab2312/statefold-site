/* Statefold Orbit Film — supplied motion, exact brand reveal, opt-in sound. */
(function () {
  'use strict';

  var orbit = document.getElementById('orbitFilm');
  var stage = document.getElementById('brand-reveal');
  var soundButton = stage && stage.querySelector('.overture-sound');
  if (!orbit || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    stage.classList.add('orbit-static', 'orbit-dragon', 'orbit-brand', 'orbit-complete');
    return;
  }

  var timers = [];
  var audioContext = null;
  var activeSources = [];
  var soundEnabled = false;

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers.length = 0;
  }

  function armReveal() {
    clearTimers();
    timers.push(window.setTimeout(function () { stage.classList.add('orbit-dragon'); }, 3460));
    timers.push(window.setTimeout(function () { stage.classList.add('orbit-brand'); }, 4260));
    timers.push(window.setTimeout(function () { stage.classList.add('orbit-complete'); }, 5160));
  }

  function restartOrbit() {
    var source = orbit.getAttribute('data-orbit-src');
    var replacement = orbit.cloneNode(false);
    replacement.setAttribute('src', source);
    replacement.addEventListener('error', resolveImmediately, { once: true });
    orbit.replaceWith(replacement);
    orbit = replacement;
    stage.classList.remove('orbit-dragon', 'orbit-brand', 'orbit-complete');
    void stage.offsetWidth;
    armReveal();
  }

  function resolveImmediately() {
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

      var duration = 4.32;
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
      filter.frequency.exponentialRampToValueAtTime(420, startAt + 3.75);
      gain.gain.setValueAtTime(.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(.018, startAt + .7);
      gain.gain.exponentialRampToValueAtTime(.010, startAt + 3.4);
      gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
      source.connect(filter).connect(gain).connect(master);
      source.start(startAt);
      source.stop(startAt + duration + .04);
      activeSources.push(source);

      tone(master, 'sine', 34, 46, 0, 3.76, .016, startAt);
      tone(master, 'triangle', 68, 92, .18, 3.46, .0035, startAt);
      tone(master, 'sine', 154, 226, 3.40, .72, .010, startAt);
      tone(master, 'sine', 308, 452, 3.45, .54, .0032, startAt);
      tone(master, 'sine', 58, 44, 4.18, .46, .012, startAt);
    }

    if (audioContext.state === 'suspended') audioContext.resume().then(startSound);
    else startSound();
  }

  orbit.addEventListener('error', resolveImmediately, { once: true });
  if (soundButton) {
    soundButton.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      soundButton.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      soundButton.querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off';
      if (soundEnabled) {
        restartOrbit();
        playSound();
      } else {
        stopSound();
      }
    });
  }

  restartOrbit();
}());
