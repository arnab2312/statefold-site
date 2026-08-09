/* Statefold Filament Film — synchronized brand reveal and opt-in sound. */
(function () {
  'use strict';

  var film = document.getElementById('reactionFilm');
  var stage = document.getElementById('brand-reveal');
  var soundButton = stage && stage.querySelector('.overture-sound');
  if (!film || !stage) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    film.pause();
    stage.classList.add('flow-static', 'flow-dragon', 'flow-brand', 'flow-complete');
    return;
  }

  var syncFrame = 0;
  var fallbackTimers = [];
  var audioContext = null;
  var activeSources = [];
  var soundEnabled = false;

  function clearFallbackTimers() {
    fallbackTimers.forEach(window.clearTimeout);
    fallbackTimers.length = 0;
  }

  function syncReveal() {
    var time = film.currentTime || 0;
    if (time >= 3.08) stage.classList.add('flow-dragon');
    if (time >= 4.08) stage.classList.add('flow-brand');
    if (film.ended || time >= 5.16) stage.classList.add('flow-complete');
    if (!film.paused && !film.ended) syncFrame = window.requestAnimationFrame(syncReveal);
  }

  function armFallback() {
    clearFallbackTimers();
    fallbackTimers.push(window.setTimeout(function () { stage.classList.add('flow-dragon'); }, 3080));
    fallbackTimers.push(window.setTimeout(function () { stage.classList.add('flow-brand'); }, 4080));
    fallbackTimers.push(window.setTimeout(function () { stage.classList.add('flow-complete'); }, 5200));
  }

  function resetReveal() {
    window.cancelAnimationFrame(syncFrame);
    clearFallbackTimers();
    stage.classList.remove('flow-complete', 'flow-dragon', 'flow-brand', 'flow-fallback-active');
    void stage.offsetWidth;
  }

  function playFilm() {
    resetReveal();
    film.currentTime = 0;
    var playback = film.play();
    if (playback && typeof playback.then === 'function') {
      playback.then(function () {
        stage.classList.add('flow-ready');
        syncReveal();
      }).catch(function () {
        stage.classList.add('flow-fallback-active');
        armFallback();
      });
    } else {
      stage.classList.add('flow-ready');
      syncReveal();
    }
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
    gain.gain.exponentialRampToValueAtTime(volume, startAt + offset + Math.min(.24, duration * .2));
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
      master.gain.value = .34;
      compressor.threshold.value = -24;
      compressor.knee.value = 22;
      compressor.ratio.value = 3;
      master.connect(compressor).connect(audioContext.destination);

      var duration = 4.72;
      var buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
      var data = buffer.getChannelData(0);
      var drift = 0;
      for (var index = 0; index < data.length; index++) {
        drift = drift * .994 + (Math.random() * 2 - 1) * .006;
        data[index] = drift;
      }

      var source = audioContext.createBufferSource();
      var filter = audioContext.createBiquadFilter();
      var gain = audioContext.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.Q.value = .46;
      filter.frequency.setValueAtTime(132, startAt);
      filter.frequency.exponentialRampToValueAtTime(620, startAt + 3.75);
      gain.gain.setValueAtTime(.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(.026, startAt + .72);
      gain.gain.exponentialRampToValueAtTime(.013, startAt + 3.42);
      gain.gain.exponentialRampToValueAtTime(.0001, startAt + duration);
      source.connect(filter).connect(gain).connect(master);
      source.start(startAt);
      source.stop(startAt + duration + .04);
      activeSources.push(source);

      tone(master, 'sine', 36, 52, 0, 3.90, .021, startAt);
      tone(master, 'triangle', 74, 104, .22, 3.52, .0045, startAt);
      tone(master, 'sine', 168, 252, 3.14, .82, .012, startAt);
      tone(master, 'sine', 336, 504, 3.20, .62, .004, startAt);
      tone(master, 'sine', 62, 46, 4.03, .54, .016, startAt);
      tone(master, 'sine', 468, 390, 4.08, .44, .0035, startAt);
    }

    if (audioContext.state === 'suspended') audioContext.resume().then(startSound);
    else startSound();
  }

  film.addEventListener('loadeddata', function () { stage.classList.add('flow-ready'); }, { once: true });
  film.addEventListener('play', function () {
    window.cancelAnimationFrame(syncFrame);
    syncReveal();
  });
  film.addEventListener('ended', function () {
    stage.classList.add('flow-dragon', 'flow-brand', 'flow-complete');
  });
  film.addEventListener('error', function () {
    stage.classList.add('flow-fallback-active');
    armFallback();
  });

  if (soundButton) {
    soundButton.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      soundButton.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      soundButton.querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off';
      if (soundEnabled) {
        playFilm();
        playSound();
      } else {
        stopSound();
      }
    });
  }

  playFilm();
}());
