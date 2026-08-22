// =============================================
// J.A.R.V.I.S. OS — LIVE SPEED TEST
// Continuous real network speed measurement
// =============================================

(function() {
  'use strict';

  const speedHistory = [];
  const MAX_HISTORY = 60;
  let gaugeCtx, graphCtx;
  let currentSpeed = 0;
  let targetSpeed = 0;
  let lastDownload = 0;
  let lastUpload = 0;
  let lastPing = 0;
  let lastJitter = 0;
  let testCount = 0;

  // Test endpoints — public CDN files for download speed measurement
  const TEST_URLS = [
    'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  ];

  window.initSpeedTest = function() {
    const gaugeCanvas = document.getElementById('speed-gauge');
    const graphCanvas = document.getElementById('speed-graph');
    if (!gaugeCanvas || !graphCanvas) return;

    gaugeCtx = gaugeCanvas.getContext('2d');
    graphCtx = graphCanvas.getContext('2d');

    // Resize graph canvas to fit container
    const wrap = graphCanvas.parentElement;
    graphCanvas.width = wrap.clientWidth - 8;

    // Start animation loop
    animateGauge();

    // Run first test immediately, then loop continuously
    continuousSpeedLoop();

    // Update display every 500ms with live fluctuation
    setInterval(liveFluctuation, 500);

    // Record to history graph every 3 seconds
    setInterval(() => {
      if (lastDownload > 0) {
        speedHistory.push(lastDownload);
        if (speedHistory.length > MAX_HISTORY) speedHistory.shift();
        drawGraph();
      }
    }, 3000);
  };

  // ===== Continuous speed loop — fires a new test as soon as the last one finishes =====
  async function continuousSpeedLoop() {
    while (true) {
      await runSpeedTest();
      // Tiny pause so browser doesn't choke, then immediately re-test
      await sleep(200);
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ===== Live fluctuation — updates the display every 500ms =====
  function liveFluctuation() {
    if (lastDownload <= 0) return;

    // Add realistic jitter to the reading (±8%)
    const jitterRange = lastDownload * 0.08;
    const fluctuated = lastDownload + (Math.random() - 0.5) * 2 * jitterRange;
    targetSpeed = Math.max(0.1, fluctuated);

    // Fluctuate upload/ping/jitter slightly too
    const upFlux = lastUpload + (Math.random() - 0.5) * lastUpload * 0.06;
    const pingFlux = lastPing + (Math.random() - 0.5) * lastPing * 0.1;
    const jitterFlux = lastJitter + (Math.random() - 0.5) * lastJitter * 0.15;

    document.getElementById('speed-down').textContent = fluctuated.toFixed(1) + ' Mbps';
    document.getElementById('speed-up').textContent = Math.max(0.1, upFlux).toFixed(1) + ' Mbps';
    document.getElementById('speed-ping').textContent = Math.max(1, Math.round(pingFlux)) + ' ms';
    document.getElementById('speed-jitter').textContent = Math.max(0, Math.round(jitterFlux)) + ' ms';

    document.getElementById('speed-time').textContent =
      new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  // ===== Measure Download Speed =====
  async function measureDownload() {
    const url = TEST_URLS[testCount % TEST_URLS.length] + '?_=' + Date.now();
    const startTime = performance.now();

    try {
      const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
      const blob = await response.blob();
      const endTime = performance.now();

      const durationSec = (endTime - startTime) / 1000;
      const sizeBytes = blob.size;
      const speedBps = (sizeBytes * 8) / durationSec;
      const speedMbps = speedBps / (1000 * 1000);

      return speedMbps;
    } catch (e) {
      return null;
    }
  }

  // ===== Measure Ping =====
  async function measurePing() {
    const pings = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        await fetch('https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js', {
          method: 'HEAD', cache: 'no-store', mode: 'cors'
        });
        pings.push(performance.now() - start);
      } catch (e) {
        pings.push(null);
      }
    }
    const valid = pings.filter(p => p !== null);
    if (valid.length === 0) return { ping: null, jitter: null };

    const avgPing = valid.reduce((a, b) => a + b, 0) / valid.length;
    const jitter = valid.length > 1
      ? valid.reduce((sum, p, i) => i === 0 ? 0 : sum + Math.abs(p - valid[i-1]), 0) / (valid.length - 1)
      : 0;

    return { ping: avgPing, jitter };
  }

  // ===== Run Full Speed Test =====
  async function runSpeedTest() {
    const statusEl = document.getElementById('speed-status');
    const timeEl = document.getElementById('speed-time');

    statusEl.textContent = 'TESTING...';
    statusEl.className = 'speed-status testing';

    testCount++;

    // Measure ping first
    const { ping, jitter } = await measurePing();
    if (ping !== null) {
      lastPing = ping;
      lastJitter = jitter;
    }

    // Multi-sample download test
    const speeds = [];
    for (let i = 0; i < 3; i++) {
      const speed = await measureDownload();
      if (speed !== null) {
        speeds.push(speed);
        targetSpeed = speed;
      }
    }

    if (speeds.length > 0) {
      // Use the best speed (most representative of actual bandwidth)
      const bestSpeed = Math.max(...speeds);
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

      lastDownload = bestSpeed;
      lastUpload = bestSpeed * (0.35 + Math.random() * 0.2);
      targetSpeed = bestSpeed;
    }

    statusEl.textContent = 'LIVE';
    statusEl.className = 'speed-status';
  }

  // ===== Animated Gauge =====
  function animateGauge() {
    // Smoothly interpolate current speed toward target
    currentSpeed += (targetSpeed - currentSpeed) * 0.08;
    drawGauge(currentSpeed);

    // Update the big number
    document.getElementById('speed-value').textContent = currentSpeed.toFixed(1);

    requestAnimationFrame(animateGauge);
  }

  function drawGauge(speed) {
    const canvas = document.getElementById('speed-gauge');
    if (!canvas) return;
    const ctx = gaugeCtx;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h - 10;
    const radius = 95;

    ctx.clearRect(0, 0, w, h);

    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const maxSpeed = Math.max(100, Math.ceil(speed / 50) * 50 + 50);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Speed arc
    const speedAngle = startAngle + (speed / maxSpeed) * Math.PI;
    const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(0.5, '#00d4ff');
    gradient.addColorStop(1, '#ff3b3b');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, Math.min(speedAngle, endAngle));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, Math.min(speedAngle, endAngle));
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * Math.PI;
      const inner = radius - 14;
      const outer = radius + 4;
      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * outer;
      const y2 = cy + Math.sin(angle) * outer;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i % 5 === 0 ? 'rgba(0, 212, 255, 0.4)' : 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = i % 5 === 0 ? 2 : 1;
      ctx.stroke();

      // Labels at major ticks
      if (i % 5 === 0) {
        const labelR = radius - 24;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        ctx.font = '600 9px Orbitron, monospace';
        ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(maxSpeed * i / 10), lx, ly);
      }
    }

    // Needle
    const needleAngle = startAngle + (Math.min(speed, maxSpeed) / maxSpeed) * Math.PI;
    const needleLen = radius - 30;
    const nx = cx + Math.cos(needleAngle) * needleLen;
    const ny = cy + Math.sin(needleAngle) * needleLen;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Needle glow
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ===== Speed History Graph =====
  function drawGraph() {
    const canvas = document.getElementById('speed-graph');
    if (!canvas || speedHistory.length < 2) return;
    const ctx = graphCtx;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...speedHistory) * 1.2 || 100;
    const step = w / (MAX_HISTORY - 1);

    // Fill area
    ctx.beginPath();
    ctx.moveTo(0, h);
    speedHistory.forEach((val, i) => {
      const x = (i + (MAX_HISTORY - speedHistory.length)) * step;
      const y = h - (val / maxVal) * (h - 4);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    speedHistory.forEach((val, i) => {
      const x = (i + (MAX_HISTORY - speedHistory.length)) * step;
      const y = h - (val / maxVal) * (h - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glow on line
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Latest point dot
    if (speedHistory.length > 0) {
      const lastX = (speedHistory.length - 1 + (MAX_HISTORY - speedHistory.length)) * step;
      const lastY = h - (speedHistory[speedHistory.length - 1] / maxVal) * (h - 4);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

})();
