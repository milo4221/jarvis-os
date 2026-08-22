// =============================================
// J.A.R.V.I.S. OS — HUD EFFECTS (LIGHTWEIGHT)
// =============================================

(function() {
  'use strict';

  window.initHudEffects = function() {
    initHexStreams();
    initFpsCounter();
  };

  // Hex streams — update every 2s instead of 200ms
  function initHexStreams() {
    var chars = '0123456789ABCDEF';
    var streamL = document.getElementById('hex-stream-l');
    var streamR = document.getElementById('hex-stream-r');
    if (!streamL || !streamR) return;

    function genHex() {
      var s = '';
      for (var i = 0; i < 200; i++) {
        s += chars[Math.floor(Math.random() * 16)];
        if ((i + 1) % 4 === 0) s += '\n';
      }
      return s;
    }

    streamL.textContent = genHex();
    streamR.textContent = genHex();
    setInterval(function() {
      streamL.textContent = genHex();
      streamR.textContent = genHex();
    }, 2000);
  }

  // FPS counter — sample every 2s
  function initFpsCounter() {
    var el = document.getElementById('hud-fps');
    if (!el) return;
    var frames = 0, lastTime = performance.now();

    function tick() {
      frames++;
      var now = performance.now();
      if (now - lastTime >= 2000) {
        el.textContent = Math.round(frames / ((now - lastTime) / 1000)) + ' FPS';
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
