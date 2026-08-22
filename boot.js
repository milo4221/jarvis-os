// =============================================
// J.A.R.V.I.S. OS — CINEMATIC BOOT SEQUENCE
// =============================================

(function() {
  'use strict';

  // ===== Audio Init =====
  // Try to start audio context immediately; will also start on first click
  if (typeof window.initBootAudio === 'function') {
    window.initBootAudio().then(() => {
      window.playBootSound('boot-hum');
    });
  }

  // Click-to-start overlay for AudioContext policy
  const bootScreen = document.getElementById('boot-screen');
  let audioStarted = false;

  function tryStartAudio() {
    if (audioStarted) return;
    audioStarted = true;
    if (typeof window.initBootAudio === 'function') {
      window.initBootAudio().then(() => {
        window.playBootSound('boot-hum');
      });
    }
  }

  bootScreen.addEventListener('click', tryStartAudio, { once: true });
  bootScreen.addEventListener('touchstart', tryStartAudio, { once: true });

  // ===== Boot Particles =====
  const canvas = document.getElementById('boot-particles');
  const ctx = canvas.getContext('2d');
  let bootParticles = [];
  let animating = true;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create hex-shaped particles
  for (let i = 0; i < 50; i++) {
    bootParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8 - 0.2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.3 + 0.05,
      type: Math.random() > 0.7 ? 'hex' : 'dot'
    });
  }

  function drawHex(x, y, size, alpha) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function drawBootParticles() {
    if (!animating) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bootParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      if (p.type === 'hex') {
        drawHex(p.x, p.y, p.size * 3, p.alpha);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      }
    });

    requestAnimationFrame(drawBootParticles);
  }
  drawBootParticles();

  // ===== Waveform =====
  const waveContainer = document.getElementById('boot-waveform');
  for (let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'wave-bar';
    bar.style.setProperty('--h', (Math.random() * 20 + 5) + 'px');
    bar.style.animationDelay = (i * 0.05) + 's';
    waveContainer.appendChild(bar);
  }

  // ===== Clock =====
  const clockEl = document.getElementById('boot-clock');
  function updateBootClock() {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  updateBootClock();
  setInterval(updateBootClock, 1000);

  // ===== Hex scroll =====
  const hexScroll = document.getElementById('hex-scroll');
  function addHexChars() {
    const chars = '0123456789ABCDEF';
    let line = '';
    for (let i = 0; i < 80; i++) {
      line += chars[Math.floor(Math.random() * chars.length)];
      if ((i + 1) % 4 === 0) line += ' ';
    }
    hexScroll.textContent = line;
  }
  const hexInterval = setInterval(addHexChars, 100);

  // ===== Boot Sequence Timeline =====
  const bootSteps = [
    { delay: 2200, diag: 1, text: 'Reactor core initialized .............. OK', done: true, box: 'sb-core' },
    { delay: 3200, diag: 2, text: 'Neural pathways loaded ................ OK', done: true, box: 'sb-neural' },
    { delay: 4000, diag: 2, text: 'Loading language model v3.0 ........... OK', done: true },
    { delay: 4800, diag: 3, text: 'Network handshake complete ............ OK', done: true, box: 'sb-net' },
    { delay: 5600, diag: 4, text: 'Voice synthesis calibrated ............ OK', done: true, box: 'sb-voice' },
    { delay: 6200, diag: 4, text: 'Speech recognition module ............. OK', done: true },
    { delay: 6800, diag: 5, text: 'HUD overlay rendering ................. OK', done: true, box: 'sb-hud' },
    { delay: 7400, diag: 5, text: 'All systems nominal. Welcome back.', done: true },
  ];

  // Progress bar
  const barEl = document.getElementById('boot-bar');
  const glowEl = document.getElementById('boot-bar-glow');
  const pctEl = document.getElementById('boot-pct');
  let progress = 0;

  const progressInterval = setInterval(() => {
    if (progress >= 100) return;
    const target = Math.min(100, progress + Math.random() * 8 + 2);
    progress = target;
    barEl.style.width = progress + '%';
    glowEl.style.width = progress + '%';
    pctEl.textContent = Math.round(progress) + '%';

    // Sound: rising tone tracks progress
    if (typeof window.playBootSound === 'function') {
      window.playBootSound('progress', progress);
    }
  }, 200);

  // Execute boot steps
  bootSteps.forEach(step => {
    setTimeout(() => {
      const diagLine = document.getElementById(`diag-${step.diag}`);
      const textEl = diagLine.querySelector('.diag-text');

      // Typing effect
      const fullText = step.text;
      let charIdx = 0;
      diagLine.classList.remove('done');
      textEl.textContent = '';

      const typeInterval = setInterval(() => {
        if (charIdx < fullText.length) {
          textEl.textContent += fullText[charIdx];
          charIdx++;
        } else {
          clearInterval(typeInterval);
          if (step.done) {
            diagLine.classList.add('done');
            // Sound: diagnostic beep when line completes
            if (typeof window.playBootSound === 'function') {
              window.playBootSound('diag-beep');
            }
          }
        }
      }, 8);

      // Activate status box
      if (step.box) {
        const box = document.getElementById(step.box);
        const state = box.querySelector('.sb-state');
        state.className = 'sb-state active';
        state.textContent = 'INIT';
        setTimeout(() => {
          box.classList.add('online');
          state.className = 'sb-state online';
          state.textContent = 'ONLINE';
          // Sound: ping when box goes ONLINE
          if (typeof window.playBootSound === 'function') {
            window.playBootSound('online-ping');
          }
        }, 600);
      }
    }, step.delay);
  });

  // ===== Complete & Transition =====
  setTimeout(() => {
    clearInterval(progressInterval);
    clearInterval(hexInterval);
    progress = 100;
    barEl.style.width = '100%';
    glowEl.style.width = '100%';
    pctEl.textContent = '100%';

    // Sound: boot complete power-up chime
    if (typeof window.playBootSound === 'function') {
      window.playBootSound('boot-complete');
    }

    // Flash and transition to OPENING SEQUENCE
    setTimeout(() => {
      // Sound: transition woosh
      if (typeof window.playBootSound === 'function') {
        window.playBootSound('transition');
      }

      animating = false;
      const bootScreen = document.getElementById('boot-screen');
      bootScreen.classList.add('fade-out');

      setTimeout(() => {
        bootScreen.style.display = 'none';
        // Hand off to opening sequence (not app directly)
        if (typeof window.startOpeningSequence === 'function') {
          window.startOpeningSequence();
        } else {
          // Fallback: go straight to app
          document.getElementById('app').classList.remove('hidden');
          if (typeof window.initJarvisApp === 'function') {
            window.initJarvisApp();
          }
        }
      }, 800);
    }, 600);
  }, 8500);

})();
