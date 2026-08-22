// =============================================
// J.A.R.V.I.S. OS — HUD EFFECTS
// Hex streams, FPS counter, ambient tech
// =============================================

(function() {
  'use strict';

  window.initHudEffects = function() {
    initHexStreams();
    initFpsCounter();
  };

  // ===== Hex Data Streams =====
  function initHexStreams() {
    const chars = '0123456789ABCDEF';
    const streamL = document.getElementById('hex-stream-l');
    const streamR = document.getElementById('hex-stream-r');
    if (!streamL || !streamR) return;

    function genHex(len) {
      let s = '';
      for (let i = 0; i < len; i++) {
        s += chars[Math.floor(Math.random() * 16)];
        if ((i + 1) % 4 === 0) s += '\n';
      }
      return s;
    }

    // Fill initial
    streamL.textContent = genHex(400);
    streamR.textContent = genHex(400);

    // Cycle every 200ms for matrix-like scrolling
    setInterval(() => {
      streamL.textContent = genHex(400);
      streamR.textContent = genHex(400);
    }, 200);
  }

  // ===== FPS Counter =====
  function initFpsCounter() {
    const el = document.getElementById('hud-fps');
    if (!el) return;

    let frames = 0;
    let lastTime = performance.now();

    function tick() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        el.textContent = frames + ' FPS';
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

})();
