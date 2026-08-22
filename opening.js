// =============================================
// J.A.R.V.I.S. OS — OPENING SEQUENCE
// The cinematic HUD reveal after boot
// =============================================

(function() {
  'use strict';

  // Called by boot.js when boot completes
  window.startOpeningSequence = function() {
    const opening = document.getElementById('opening-screen');
    opening.classList.remove('hidden');

    // Animate the date/time in the status bar
    updateOpeningClock();
    const clockInt = setInterval(updateOpeningClock, 1000);

    // Data fragment text cycling
    const fragments = opening.querySelectorAll('.data-fragment');
    const fragTexts = [
      'ARC::REACTOR::STABLE::98.7%',
      'NEURAL::LINK::BANDWIDTH::4.2TB/S',
      'QUANTUM::ENCRYPT::LEVEL::ZETA',
      'VIBRANIUM::MESH::INTEGRITY::100%',
      'STARK::SAT::UPLINK::CONFIRMED',
      'BIOMETRIC::SCAN::COMPLETE'
    ];
    fragments.forEach((f, i) => {
      f.textContent = fragTexts[i] || '';
    });

    // Animate stat counters
    setTimeout(() => {
      animateCounter('open-stat-uptime', 0, 99.7, 1500, 1, '%');
      animateCounter('open-stat-latency', 0, 12, 1200, 0, 'ms');
      animateCounter('open-stat-nodes', 0, 7, 1000, 0, '');
      animateCounter('open-stat-threads', 0, 256, 1300, 0, '');
    }, 3800);

    // Click / tap / key to enter
    let entered = false;
    function enterApp() {
      if (entered) return;
      entered = true;
      clearInterval(clockInt);

      opening.classList.add('exit');
      setTimeout(() => {
        opening.style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        if (typeof window.initJarvisApp === 'function') {
          window.initJarvisApp();
        }
      }, 1200);
    }

    // Auto-enter after 7 seconds, or click/key to skip
    const autoTimer = setTimeout(enterApp, 7000);

    function manualEnter() {
      clearTimeout(autoTimer);
      enterApp();
    }

    opening.addEventListener('click', manualEnter);
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        document.removeEventListener('keydown', handler);
        manualEnter();
      }
    });
  };

  function updateOpeningClock() {
    const el = document.getElementById('open-clock');
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
  }

  function animateCounter(id, start, end, duration, decimals, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = start + (end - start) * ease;
      el.textContent = val.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

})();
