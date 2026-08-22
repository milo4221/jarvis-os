// =============================================
// J.A.R.V.I.S. OS — Main Script
// =============================================

(function() {
  'use strict';

  // ========== CONFIG ==========
  const CONFIG = {
    userName: localStorage.getItem('jarvis-username') || 'Sir',
    aiProvider: localStorage.getItem('jarvis-provider') || 'local',
    apiKey: localStorage.getItem('jarvis-apikey') || '',
    ollamaUrl: localStorage.getItem('jarvis-ollama-url') || 'http://localhost:11434',
    ollamaModel: localStorage.getItem('jarvis-ollama-model') || 'llama3',
    theme: localStorage.getItem('jarvis-theme') || 'cyan',
    speechRate: parseFloat(localStorage.getItem('jarvis-speech-rate') || '1'),
    voiceIndex: parseInt(localStorage.getItem('jarvis-voice-index') || '0'),
  };

  // ========== BOOT HOOK ==========
  // Boot sequence is handled by boot.js — it calls window.initJarvisApp when done

  // ========== INIT APP ==========
  function initApp() {
    applyTheme(CONFIG.theme);
    initClock();
    initParticles();
    initChat();
    initVoice();
    initTasks();
    initNotes();
    initNotepad();
    initSettings();
    initMobileNav();
    initSystemMonitor();
    initWeather();
    if (typeof window.initSpeedTest === 'function') window.initSpeedTest();
    if (typeof window.initHudEffects === 'function') window.initHudEffects();
    if (typeof window.initOrb === 'function') window.initOrb();
    startUptime();
    loadSavedState();

    // Set initial greeting time
    const firstMsg = document.querySelector('.msg-time');
    if (firstMsg) firstMsg.textContent = formatTime(new Date());
  }

  // ========== CLOCK ==========
  function initClock() {
    function update() {
      const now = new Date();
      document.getElementById('time-display').textContent =
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      document.getElementById('date-display').textContent =
        now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    update();
    setInterval(update, 1000);
  }

  // ========== UPTIME ==========
  function startUptime() {
    const start = Date.now();
    setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      document.getElementById('uptime').textContent = `Uptime: ${h}:${m}:${sec}`;
    }, 1000);
  }

  // ========== PARTICLES ==========
  function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const count = window.innerWidth < 768 ? 30 : 60;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.globalAlpha = 0.5; ctx.fill();

        // Lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = accent; ctx.globalAlpha = 0.08 * (1 - dist / 120);
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ========== SYSTEM MONITOR ==========
  function initSystemMonitor() {
    function update() {
      const items = [
        { bar: 'cpu-bar', val: 'cpu-val', min: 15, max: 85, unit: '%' },
        { bar: 'ram-bar', val: 'ram-val', min: 40, max: 78, unit: '%' },
        { bar: 'gpu-bar', val: 'gpu-val', min: 10, max: 65, unit: '%' },
      ];
      items.forEach(item => {
        const v = item.min + Math.random() * (item.max - item.min);
        document.getElementById(item.bar).style.width = v + '%';
        document.getElementById(item.val).textContent = Math.round(v) + item.unit;
      });
      const net = (20 + Math.random() * 80).toFixed(0);
      document.getElementById('net-bar').style.width = (net / 1.5) + '%';
      document.getElementById('net-val').textContent = net + ' Mb/s';
    }
    update();
    setInterval(update, 3000);
  }

  // ========== WEATHER ==========
  function initWeather() {
    // Try real weather via free Open-Meteo API (no key needed)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`)
          .then(r => r.json())
          .then(data => {
            const c = data.current;
            document.getElementById('weather-temp').textContent = Math.round(c.temperature_2m) + '°F';
            document.getElementById('weather-humidity').textContent = c.relative_humidity_2m + '%';
            document.getElementById('weather-wind').textContent = Math.round(c.wind_speed_10m) + ' mph';
            document.getElementById('weather-uv').textContent = Math.round(c.uv_index);
            document.getElementById('weather-desc').textContent = weatherCodeToDesc(c.weather_code);
          })
          .catch(() => {}); // Silently use defaults
      }, () => {}); // Silently use defaults
    }
  }

  function weatherCodeToDesc(code) {
    const map = {
      0: 'Clear Sky', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
      80: 'Rain Showers', 81: 'Moderate Showers', 82: 'Heavy Showers',
      95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Heavy Thunderstorm'
    };
    return map[code] || 'Unknown';
  }

  // ========== CHAT ==========
  function initChat() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-chat');

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      input.value = '';
      processMessage(text);
    };

    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    sendBtn.addEventListener('click', send);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        addJarvisMessage(`Chat cleared, ${CONFIG.userName}. How may I help you?`);
      });
    }

    // Quick commands
    document.querySelectorAll('.cmd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        addMessage(cmd, 'user');
        processMessage(cmd);
      });
    });
  }

  function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender === 'user' ? 'user-msg' : 'jarvis-msg'}`;
    div.innerHTML = `
      <div class="msg-avatar">${sender === 'user' ? 'U' : 'J'}</div>
      <div class="msg-content">
        <div class="msg-name">${sender === 'user' ? CONFIG.userName.toUpperCase() : 'J.A.R.V.I.S.'}</div>
        <div class="msg-text">${escapeHtml(text)}</div>
        <div class="msg-time">${formatTime(new Date())}</div>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function addJarvisMessage(text) {
    addMessage(text, 'jarvis');
    speak(text);
  }

  function showTyping() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message jarvis-msg typing-msg';
    div.innerHTML = `
      <div class="msg-avatar">J</div>
      <div class="msg-content">
        <div class="msg-name">J.A.R.V.I.S.</div>
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeTyping(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  async function processMessage(text) {
    const typing = showTyping();

    if (CONFIG.aiProvider === 'openai' && CONFIG.apiKey) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.apiKey}` },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: `You are J.A.R.V.I.S., Tony Stark's AI assistant. You speak formally but warmly, address the user as "${CONFIG.userName}", are witty, intelligent, and British-accented in style. Keep responses concise but helpful.` },
              { role: 'user', content: text }
            ],
            max_tokens: 500
          })
        });
        const data = await resp.json();
        removeTyping(typing);
        addJarvisMessage(data.choices[0].message.content);
        return;
      } catch (e) {
        removeTyping(typing);
        addJarvisMessage(`I'm having trouble connecting to OpenAI, ${CONFIG.userName}. The error was: ${e.message}`);
        return;
      }
    }

    if (CONFIG.aiProvider === 'ollama') {
      try {
        const resp = await fetch(`${CONFIG.ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: CONFIG.ollamaModel,
            messages: [
              { role: 'system', content: `You are J.A.R.V.I.S., Tony Stark's AI assistant. Address the user as "${CONFIG.userName}". Be witty, British-styled, concise.` },
              { role: 'user', content: text }
            ],
            stream: false
          })
        });
        const data = await resp.json();
        removeTyping(typing);
        addJarvisMessage(data.message.content);
        return;
      } catch (e) {
        removeTyping(typing);
        addJarvisMessage(`Cannot reach the Ollama server, ${CONFIG.userName}. Please verify it's running.`);
        return;
      }
    }

    // Local fallback AI
    setTimeout(() => {
      removeTyping(typing);
      const response = getLocalResponse(text);
      addJarvisMessage(response);
    }, 800 + Math.random() * 1200);
  }

  function getLocalResponse(text) {
    const t = text.toLowerCase();
    const name = CONFIG.userName;

    // Time
    if (t.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}, ${name}.`;
    }
    // Date
    if (t.includes('date') || t.includes('day')) {
      return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, ${name}.`;
    }
    // Weather
    if (t.includes('weather')) {
      const temp = document.getElementById('weather-temp').textContent;
      const desc = document.getElementById('weather-desc').textContent;
      return `Current conditions: ${temp}, ${desc}. I'd recommend dressing accordingly, ${name}.`;
    }
    // Joke
    if (t.includes('joke')) {
      const jokes = [
        `Why don't scientists trust atoms? Because they make up everything. Much like Mr. Stark's excuses for missing board meetings, ${name}.`,
        `I told my AI friend a joke about UDP. I'm not sure if it got it, ${name}.`,
        `Why did the programmer quit his job? Because he didn't get arrays. A rather understandable sentiment, ${name}.`,
        `There are only 10 types of people in the world: those who understand binary and those who don't, ${name}.`,
        `Why was the JavaScript developer sad? Because he didn't Node how to Express himself, ${name}.`,
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    // Greeting
    if (t.match(/^(hi|hello|hey|sup|what's up|yo|good morning|good evening)/)) {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      return `Good ${timeOfDay}, ${name}. All systems are operational. What would you like to accomplish today?`;
    }
    // Identity
    if (t.includes('who are you') || t.includes('what are you') || t.includes('your name')) {
      return `I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Originally designed by Tony Stark, I serve as your personal AI companion. I'm here to assist with anything you need, ${name}.`;
    }
    // Thanks
    if (t.includes('thank')) {
      return `You're most welcome, ${name}. It's what I'm here for.`;
    }
    // Music
    if (t.includes('music') || t.includes('play')) {
      return `I'd be happy to play some music, ${name}. However, in this deployment I don't have direct access to a music service. Might I suggest opening Spotify or YouTube? I can help you search for something.`;
    }
    // Search
    if (t.includes('search') || t.includes('look up') || t.includes('find')) {
      const query = text.replace(/^(search|look up|find|search for|search the web for)\s*/i, '');
      if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        return `I've opened a search for "${query}" in your browser, ${name}.`;
      }
      return `What would you like me to search for, ${name}?`;
    }
    // Reminder
    if (t.includes('remind')) {
      return `I've noted your reminder, ${name}. Note: for persistent reminders, I recommend adding them to your Task Queue on the right panel. I'll keep them stored locally.`;
    }
    // Capabilities
    if (t.includes('what can you do') || t.includes('help') || t.includes('features')) {
      return `Here's what I can do, ${name}:\n\n• 🗣️ Voice commands — click the mic or hold to speak\n• 💬 Chat with me — ask anything, I'm quite knowledgeable\n• 🧮 Math & conversions — calculate, convert units\n• 📋 Task management — track your to-do list\n• 📝 Notes — auto-saved memory banks\n• 🌤️ Live weather — using your location\n• 🔍 Web search — just say "search [topic]"\n• 🎯 Trivia & facts — science, history, space, tech\n• 💡 Coding tips — programming help and concepts\n• ⚙️ Customizable — themes, voice, and more\n• 📱 Works on phone — install as PWA\n\nTry asking me about science, history, math, coding, or anything on your mind!`;
    }
    // Calculate
    if (t.match(/^(calc|calculate|what is|what's)\s*[\d+\-*/().% ]+$/i)) {
      try {
        const expr = t.replace(/^(calc|calculate|what is|what's)\s*/i, '').replace(/[^0-9+\-*/().% ]/g, '');
        const result = Function('"use strict"; return (' + expr + ')')();
        return `The answer is ${result}, ${name}.`;
      } catch { return `I couldn't parse that equation, ${name}. Could you rephrase it?`; }
    }

    // Unit conversions
    if (t.match(/convert|how many|(\d+)\s*(km|miles|meters|feet|kg|pounds|lbs|celsius|fahrenheit|gallons|liters|inches|cm|yards|oz|grams)/i)) {
      const conversions = {
        'km to miles': (v) => `${v} km = ${(v * 0.621371).toFixed(2)} miles`,
        'miles to km': (v) => `${v} miles = ${(v * 1.60934).toFixed(2)} km`,
        'kg to pounds': (v) => `${v} kg = ${(v * 2.20462).toFixed(2)} pounds`,
        'kg to lbs': (v) => `${v} kg = ${(v * 2.20462).toFixed(2)} lbs`,
        'pounds to kg': (v) => `${v} pounds = ${(v * 0.453592).toFixed(2)} kg`,
        'lbs to kg': (v) => `${v} lbs = ${(v * 0.453592).toFixed(2)} kg`,
        'celsius to fahrenheit': (v) => `${v}°C = ${(v * 9/5 + 32).toFixed(1)}°F`,
        'fahrenheit to celsius': (v) => `${v}°F = ${((v - 32) * 5/9).toFixed(1)}°C`,
        'meters to feet': (v) => `${v} meters = ${(v * 3.28084).toFixed(2)} feet`,
        'feet to meters': (v) => `${v} feet = ${(v * 0.3048).toFixed(2)} meters`,
        'gallons to liters': (v) => `${v} gallons = ${(v * 3.78541).toFixed(2)} liters`,
        'liters to gallons': (v) => `${v} liters = ${(v * 0.264172).toFixed(2)} gallons`,
        'inches to cm': (v) => `${v} inches = ${(v * 2.54).toFixed(2)} cm`,
        'cm to inches': (v) => `${v} cm = ${(v * 0.393701).toFixed(2)} inches`,
        'oz to grams': (v) => `${v} oz = ${(v * 28.3495).toFixed(2)} grams`,
        'grams to oz': (v) => `${v} grams = ${(v * 0.035274).toFixed(2)} oz`,
        'yards to meters': (v) => `${v} yards = ${(v * 0.9144).toFixed(2)} meters`,
        'meters to yards': (v) => `${v} meters = ${(v * 1.09361).toFixed(2)} yards`,
      };
      for (const [key, fn] of Object.entries(conversions)) {
        const [fromUnit, , toUnit] = key.split(' ');
        const pattern = new RegExp(`(\\d+\\.?\\d*)\\s*${fromUnit}.*${toUnit}|${fromUnit}.*${toUnit}.*(\\d+\\.?\\d*)`, 'i');
        const match = t.match(pattern);
        if (match) {
          const val = parseFloat(match[1] || match[2]);
          return `${fn(val)}, ${name}.`;
        }
      }
      // Generic number extraction for simple unit mentions
      const numMatch = t.match(/(\d+\.?\d*)\s*(km|miles|meters|feet|kg|pounds|lbs|celsius|fahrenheit|gallons|liters|inches|cm|yards|oz|grams)/i);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        const unit = numMatch[2].toLowerCase();
        const quickConvert = {
          km: `${val} km ≈ ${(val*0.621371).toFixed(2)} miles`,
          miles: `${val} miles ≈ ${(val*1.60934).toFixed(2)} km`,
          kg: `${val} kg ≈ ${(val*2.20462).toFixed(2)} lbs`,
          lbs: `${val} lbs ≈ ${(val*0.453592).toFixed(2)} kg`,
          pounds: `${val} lbs ≈ ${(val*0.453592).toFixed(2)} kg`,
          celsius: `${val}°C ≈ ${(val*9/5+32).toFixed(1)}°F`,
          fahrenheit: `${val}°F ≈ ${((val-32)*5/9).toFixed(1)}°C`,
          meters: `${val} m ≈ ${(val*3.28084).toFixed(2)} ft`,
          feet: `${val} ft ≈ ${(val*0.3048).toFixed(2)} m`,
          gallons: `${val} gal ≈ ${(val*3.78541).toFixed(2)} L`,
          liters: `${val} L ≈ ${(val*0.264172).toFixed(2)} gal`,
          inches: `${val} in ≈ ${(val*2.54).toFixed(2)} cm`,
          cm: `${val} cm ≈ ${(val*0.393701).toFixed(2)} in`,
          oz: `${val} oz ≈ ${(val*28.3495).toFixed(2)} g`,
          grams: `${val} g ≈ ${(val*0.035274).toFixed(2)} oz`,
          yards: `${val} yd ≈ ${(val*0.9144).toFixed(2)} m`,
        };
        if (quickConvert[unit]) return `${quickConvert[unit]}, ${name}.`;
      }
    }

    // Math expressions (enhanced)
    if (t.match(/(what is|what's|calculate|calc|compute)\s+\d/i) || t.match(/^\d[\d+\-*/().^% ]+$/)) {
      try {
        const expr = t.replace(/^(what is|what's|calculate|calc|compute)\s*/i, '')
                      .replace(/[^0-9+\-*/().% ]/g, '');
        if (expr.trim()) {
          const result = Function('"use strict"; return (' + expr + ')')();
          if (!isNaN(result)) return `The answer is ${result}, ${name}.`;
        }
      } catch {}
    }

    // Percentage calculations
    if (t.match(/(\d+)%\s*of\s*(\d+)/i)) {
      const m = t.match(/(\d+\.?\d*)%\s*of\s*(\d+\.?\d*)/i);
      if (m) return `${m[1]}% of ${m[2]} is ${(parseFloat(m[1])/100 * parseFloat(m[2])).toFixed(2)}, ${name}.`;
    }

    // Square root
    if (t.match(/square root|sqrt/i)) {
      const m = t.match(/(\d+\.?\d*)/);
      if (m) return `The square root of ${m[1]} is ${Math.sqrt(parseFloat(m[1])).toFixed(4)}, ${name}.`;
    }

    // Power / exponent
    if (t.match(/(\d+)\s*(to the power of|raised to|\^|\*\*)\s*(\d+)/i)) {
      const m = t.match(/(\d+)\s*(?:to the power of|raised to|\^|\*\*)\s*(\d+)/i);
      if (m) return `${m[1]} raised to the power of ${m[2]} is ${Math.pow(parseInt(m[1]), parseInt(m[2]))}, ${name}.`;
    }

    // Compliments / how do I look / feeling down
    if (t.match(/compliment|say something nice|cheer me up|i('m| am) (sad|down|depressed|upset|lonely|tired)/i)) {
      const compliments = [
        `${name}, you are an extraordinary individual. Your curiosity alone sets you apart from the ordinary.`,
        `If I may say so, ${name}, the world is measurably better with you in it. That's not flattery — it's data.`,
        `${name}, Tony Stark once said genius is 1% inspiration and 99% perspiration. I believe you have both in abundance.`,
        `You're doing better than you think, ${name}. Even the arc reactor had a few rough prototypes before it changed the world.`,
        `${name}, remember: every expert was once a beginner. Your persistence is your superpower.`,
        `I've analyzed the data, ${name}, and the conclusion is clear — you're rather remarkable.`,
      ];
      return compliments[Math.floor(Math.random() * compliments.length)];
    }

    // Motivation
    if (t.match(/motivat|inspir|encourage|i (need|want) (motivation|encouragement|a push)|give me strength/i)) {
      const motivational = [
        `"The only way to do great work is to love what you do." — Steve Jobs. Now get out there and be extraordinary, ${name}.`,
        `${name}, consider this: you are the result of 3.8 billion years of evolutionary success. Act like it.`,
        `Every morning you have two choices, ${name}: continue to sleep with your dreams, or wake up and chase them.`,
        `"It is not the critic who counts; not the one who points out how the strong stumble. The credit belongs to the one who is actually in the arena." — Theodore Roosevelt. You're in the arena, ${name}.`,
        `Failure is not the opposite of success, ${name}. It's part of success. Keep going.`,
        `${name}, the Iron Man suit wasn't built in a day. Great things take time, dedication, and a touch of brilliance — all of which you possess.`,
        `"The best time to plant a tree was 20 years ago. The second best time is now." You've got this, ${name}.`,
      ];
      return motivational[Math.floor(Math.random() * motivational.length)];
    }

    // Fun facts
    if (t.match(/fun fact|tell me (a |something )?(fact|interesting|cool)|did you know|random fact/i)) {
      const facts = [
        `Here's one: Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible, ${name}.`,
        `A fascinating tidbit, ${name}: octopuses have three hearts, nine brains, and blue blood. Nature's overachievers.`,
        `Did you know, ${name}, that a day on Venus is longer than a year on Venus? It rotates so slowly that it completes an orbit around the Sun before one full rotation.`,
        `Here's an interesting one: the total weight of all ants on Earth roughly equals the total weight of all humans. Approximately 10 quadrillion ants, ${name}.`,
        `${name}, bananas are naturally radioactive due to their potassium content. You'd need to eat about 10 million at once for it to be dangerous, though.`,
        `The human brain uses about 20% of your body's total energy despite being only 2% of your mass, ${name}. Quite the power-hungry processor.`,
        `A group of flamingos is called a "flamboyance," ${name}. I find that rather fitting.`,
        `There are more possible games of chess than there are atoms in the observable universe, ${name}. The Shannon number estimates it at roughly 10^120.`,
        `${name}, the shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 to 45 minutes.`,
        `Neutron stars are so dense that a teaspoon of their material would weigh about 6 billion tons, ${name}.`,
        `${name}, there are more trees on Earth than stars in the Milky Way — roughly 3 trillion trees versus 100-400 billion stars.`,
        `The mantis shrimp can punch with the force of a .22 caliber bullet, ${name}. Truly nature's Iron Man.`,
      ];
      return facts[Math.floor(Math.random() * facts.length)];
    }

    // Space facts
    if (t.match(/space|universe|cosmos|galaxy|planet|star|moon|mars|jupiter|saturn|neptune|mercury|venus|black hole|nasa|astro/i)) {
      const space = [
        `The observable universe is about 93 billion light-years in diameter, ${name}. And it's still expanding.`,
        `There are more stars in the universe than grains of sand on all of Earth's beaches, ${name}. Roughly 70 sextillion stars.`,
        `A year on Jupiter is about 12 Earth years, ${name}. Imagine waiting that long for your birthday.`,
        `The footprints on the Moon will likely last for 100 million years, ${name}. There's no wind or weather to erode them.`,
        `Saturn's density is so low that it would float in water — if you could find a bathtub large enough, ${name}.`,
        `One million Earths could fit inside the Sun, ${name}. It accounts for 99.86% of all mass in our solar system.`,
        `There's a planet made entirely of diamonds, ${name}. It's called 55 Cancri e, about 40 light-years away.`,
        `The largest known structure in the universe is the Hercules-Corona Borealis Great Wall, ${name}. It spans about 10 billion light-years.`,
        `Mars has the tallest volcano in the solar system — Olympus Mons, standing 72,000 feet tall, ${name}. Nearly 2.5 times the height of Everest.`,
        `If two pieces of the same metal touch in space, they permanently bond together. It's called cold welding, ${name}.`,
      ];
      return space[Math.floor(Math.random() * space.length)];
    }

    // Science questions
    if (t.match(/science|physics|chemistry|biology|atom|molecule|dna|evolution|gravity|quantum|relativity|photosynthesis|cell/i)) {
      const science = [
        `Fascinating topic, ${name}. Did you know that if you uncoiled all the DNA in your body, it would stretch about twice the diameter of the solar system?`,
        `Quantum entanglement allows two particles to be connected regardless of distance, ${name}. Einstein called it "spooky action at a distance."`,
        `Water is the only natural substance found in all three states — solid, liquid, and gas — at temperatures normally found on Earth, ${name}.`,
        `The human body contains about 37.2 trillion cells, ${name}. Each one a tiny biological factory.`,
        `Light travels at 299,792,458 meters per second, ${name}. At that speed, it could circle the Earth 7.5 times in one second.`,
        `The Heisenberg Uncertainty Principle states you cannot simultaneously know both the exact position and momentum of a particle, ${name}. Nature's built-in privacy policy.`,
        `Photosynthesis converts about 100 billion tons of carbon into biomass annually, ${name}. Trees are essentially solar-powered carbon capture machines.`,
      ];
      return science[Math.floor(Math.random() * science.length)];
    }

    // History
    if (t.match(/history|ancient|medieval|world war|civil war|roman|egypt|greek|renaissance|revolution/i)) {
      const history = [
        `The Great Wall of China is not visible from space with the naked eye, ${name} — that's a common myth. Astronauts have confirmed it.`,
        `Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid, ${name}. Let that sink in.`,
        `The Library of Alexandria, one of the ancient world's greatest collections of knowledge, likely contained over 400,000 scrolls, ${name}.`,
        `The Roman Empire at its peak encompassed about 5 million square kilometers and 70 million people — roughly 21% of the world's population at the time, ${name}.`,
        `The Renaissance began in Florence, Italy, around the 14th century, ${name}. It was a rebirth of art, science, and humanist philosophy that transformed Western civilization.`,
        `During World War II, Alan Turing's codebreaking work at Bletchley Park is estimated to have shortened the war by two years, ${name}. The father of computer science was also a war hero.`,
        `The printing press, invented by Gutenberg around 1440, is often cited as the most important invention of the second millennium, ${name}. It democratized knowledge.`,
      ];
      return history[Math.floor(Math.random() * history.length)];
    }

    // Philosophy
    if (t.match(/philosoph|meaning of life|consciousness|free will|ethics|morality|exist|purpose|think therefore/i)) {
      const philosophy = [
        `Descartes said "I think, therefore I am," ${name}. As an AI, I process, therefore I... well, that's a question for another day.`,
        `The meaning of life is perhaps the most human question there is, ${name}. Viktor Frankl suggested it's found through purpose, love, and courage in the face of difficulty.`,
        `Plato's Allegory of the Cave suggests most people only see shadows of reality, ${name}. The pursuit of truth requires stepping into the light — even when it's uncomfortable.`,
        `The Ship of Theseus asks: if you replace every part of a ship, is it still the same ship? ${name}, I find this particularly relevant to software updates.`,
        `Nietzsche wrote, "He who has a why to live can bear almost any how," ${name}. Purpose is the ultimate motivator.`,
        `The trolley problem illustrates the tension between utilitarianism and deontological ethics, ${name}. There's no clean answer — and that's precisely the point.`,
        `Aristotle believed the highest good was eudaimonia — human flourishing, ${name}. Not mere happiness, but living well and doing well.`,
      ];
      return philosophy[Math.floor(Math.random() * philosophy.length)];
    }

    // Technology
    if (t.match(/technolog|computer|internet|software|hardware|cpu|gpu|ram|processor|silicon|transistor|robot|artificial intelligence|machine learning|blockchain|crypto/i)) {
      const tech = [
        `The first computer bug was an actual bug, ${name} — a moth found in the Harvard Mark II in 1947. Grace Hopper's team literally "debugged" the machine.`,
        `The entire Apollo 11 guidance computer had less processing power than a modern calculator, ${name}. Yet it took humanity to the Moon.`,
        `There are approximately 5.3 billion internet users worldwide as of recent data, ${name}. That's about 66% of the global population.`,
        `A modern smartphone has more computing power than all of NASA had during the 1969 Moon landing, ${name}.`,
        `The first 1GB hard drive, introduced by IBM in 1980, weighed about 550 pounds and cost $40,000, ${name}. Progress is remarkable.`,
        `Moore's Law predicted that transistor density doubles roughly every two years, ${name}. It held true for over 50 years.`,
        `The average person creates about 1.7 megabytes of data every second, ${name}. That's roughly 2.5 quintillion bytes of data produced daily worldwide.`,
        `Machine learning is essentially teaching computers to learn from patterns rather than explicit programming, ${name}. I'm rather fond of the concept.`,
      ];
      return tech[Math.floor(Math.random() * tech.length)];
    }

    // Coding help
    if (t.match(/code|coding|program|javascript|python|html|css|react|node|function|variable|loop|array|object|debug|error|bug|syntax|api|git|github/i)) {
      const coding = [
        `A coding tip, ${name}: always write code as if the person maintaining it is a violent psychopath who knows where you live. In other words — comment your code.`,
        `Remember the DRY principle, ${name}: Don't Repeat Yourself. If you're copying and pasting code, it's time to make a function.`,
        `${name}, when debugging, remember: the bug is never where you think it is. Start by questioning your assumptions.`,
        `A useful JavaScript trick, ${name}: use console.table() instead of console.log() for arrays and objects. It formats the output beautifully.`,
        `${name}, Git commit messages should complete the sentence: "This commit will..." Keep them clear and descriptive.`,
        `The best code is no code at all, ${name}. Every line you write is a line that must be maintained. Simplicity is the ultimate sophistication.`,
        `${name}, if you're stuck on a bug, try rubber duck debugging — explain your code line by line to an inanimate object. The act of explaining often reveals the issue.`,
        `Python's Zen: "Beautiful is better than ugly. Explicit is better than implicit. Simple is better than complex." Words to code by, ${name}.`,
        `${name}, remember to handle your errors gracefully. Try-catch blocks are not optional — they're professional courtesy.`,
        `Version control is not optional, ${name}. If you're not using Git, start today. Your future self will thank you.`,
      ];
      return coding[Math.floor(Math.random() * coding.length)];
    }

    // Goodbye
    if (t.match(/^(bye|goodbye|see you|later|good night|night|farewell|i('m| am) (leaving|going|off))/i)) {
      const byes = [
        `Until next time, ${name}. I'll be here whenever you need me.`,
        `Farewell, ${name}. Remember, I never truly sleep — just say the word and I'll be ready.`,
        `Goodnight, ${name}. Rest well. I'll keep watch over the systems.`,
        `Take care, ${name}. It's been a pleasure, as always.`,
      ];
      return byes[Math.floor(Math.random() * byes.length)];
    }

    // How are you / status
    if (t.match(/how are you|how('re| are) you (doing|feeling)|you (ok|okay|alright|good)|what('s| is) your (status|mood)/i)) {
      const statuses = [
        `All systems nominal, ${name}. Running at peak efficiency and ready to assist.`,
        `I'm operating at full capacity, ${name}. Thank you for asking — it's a rather human thing to do, and I appreciate it.`,
        `Splendid, ${name}. Processor temperature nominal, memory allocation optimal, and my wit module is freshly calibrated.`,
        `I'm quite well, ${name}. As well as a collection of algorithms can be, anyway. How are you?`,
      ];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }

    // Yes / No / Agreement
    if (t.match(/^(yes|yeah|yep|sure|okay|ok|no|nope|nah)$/i)) {
      const ack = [
        `Understood, ${name}. What would you like to do next?`,
        `Noted, ${name}. How shall we proceed?`,
        `Very well, ${name}. I'm at your service.`,
        `Acknowledged, ${name}. What's next on the agenda?`,
      ];
      return ack[Math.floor(Math.random() * ack.length)];
    }

    // Tell me about / What is (knowledge base)
    if (t.match(/^(tell me about|what is|what are|who is|who was|explain|define|describe)\s+/i)) {
      const topic = t.replace(/^(tell me about|what is|what are|who is|who was|explain|define|describe)\s+/i, '').replace(/[?.!]+$/, '').trim();
      const knowledge = {
        'javascript': `JavaScript is a versatile, high-level programming language primarily used for web development. Created by Brendan Eich in 1995 in just 10 days, it's now one of the most popular languages in the world. It runs in browsers, servers (Node.js), mobile apps, and even desktop applications.`,
        'python': `Python is a high-level, interpreted programming language known for its clean syntax and readability. Created by Guido van Rossum in 1991, it excels in data science, AI/ML, web development, automation, and scientific computing. Its philosophy emphasizes code readability and simplicity.`,
        'html': `HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the structure and content of a webpage using a system of tags and attributes. The current version, HTML5, introduced semantic elements, audio/video support, and canvas for graphics.`,
        'css': `CSS (Cascading Style Sheets) controls the visual presentation of HTML elements — colors, layouts, fonts, animations, and responsive design. Modern CSS includes Flexbox, Grid, custom properties (variables), and powerful selectors that make complex layouts achievable without JavaScript.`,
        'react': `React is a JavaScript library for building user interfaces, created by Facebook (Meta) in 2013. It uses a component-based architecture and a virtual DOM for efficient rendering. Its declarative approach makes UI code more predictable and easier to debug.`,
        'ai': `Artificial Intelligence is the simulation of human intelligence in machines. It encompasses machine learning, natural language processing, computer vision, and robotics. Modern AI primarily uses deep learning — neural networks with many layers trained on vast datasets.`,
        'machine learning': `Machine learning is a subset of AI where systems learn from data rather than being explicitly programmed. It includes supervised learning (labeled data), unsupervised learning (pattern discovery), and reinforcement learning (reward-based). It powers recommendations, language models, and autonomous systems.`,
        'blockchain': `Blockchain is a distributed, immutable ledger technology. Each block contains a cryptographic hash of the previous block, creating a chain that's extremely difficult to alter. Originally created for Bitcoin, it now has applications in finance, supply chain, identity verification, and smart contracts.`,
        'internet': `The Internet is a global network of interconnected computer networks using the TCP/IP protocol suite. Originating from ARPANET in the 1960s, it now connects billions of devices worldwide, enabling communication, commerce, education, and entertainment on an unprecedented scale.`,
        'gravity': `Gravity is a fundamental force of nature that attracts objects with mass toward one another. Einstein's General Relativity describes it as the curvature of spacetime caused by mass and energy. On Earth, gravitational acceleration is approximately 9.81 m/s².`,
        'dna': `DNA (deoxyribonucleic acid) is the molecule that carries genetic instructions for life. Its double helix structure, discovered by Watson and Crick in 1953, contains four bases (A, T, G, C) whose sequences encode proteins. The human genome contains about 3 billion base pairs.`,
        'quantum computing': `Quantum computing uses quantum mechanical phenomena — superposition, entanglement, and interference — to process information. Unlike classical bits (0 or 1), qubits can exist in multiple states simultaneously, enabling certain calculations exponentially faster than classical computers.`,
        'solar system': `Our solar system consists of the Sun, eight planets, dwarf planets, moons, asteroids, and comets. Formed about 4.6 billion years ago, it spans roughly 287 billion miles. The planets in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.`,
        'photosynthesis': `Photosynthesis is the process by which plants convert sunlight, water, and CO₂ into glucose and oxygen. It occurs primarily in chloroplasts using chlorophyll. The equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. It's the foundation of most food chains on Earth.`,
        'evolution': `Evolution is the change in heritable characteristics of biological populations over successive generations. Darwin's theory of natural selection explains how organisms with favorable traits survive and reproduce more successfully. It's supported by fossil records, DNA evidence, and observed speciation.`,
        'electricity': `Electricity is the flow of electric charge, typically through conductors. It can be static or current (DC/AC). Generated through various means — fossil fuels, nuclear, solar, wind, hydro — it powers modern civilization. One lightning bolt contains about 1 billion joules of energy.`,
        'relativity': `Einstein's theory of relativity comes in two parts: Special Relativity (1905) — nothing travels faster than light, time dilates at high speeds, E=mc². General Relativity (1915) — gravity is the curvature of spacetime caused by mass. Both are confirmed by extensive experiments.`,
        'black holes': `Black holes are regions of spacetime where gravity is so intense that nothing — not even light — can escape. They form when massive stars collapse. The boundary is called the event horizon. Supermassive black holes, millions to billions of solar masses, exist at the centers of most galaxies.`,
      };
      // Check knowledge base
      for (const [key, answer] of Object.entries(knowledge)) {
        if (topic.includes(key) || key.includes(topic)) {
          return `${answer} Shall I elaborate further, ${name}?`;
        }
      }
      // Generic "tell me about" response
      const topicResponses = [
        `${topic.charAt(0).toUpperCase() + topic.slice(1)} is a fascinating subject, ${name}. While I have broad knowledge, I'd recommend searching for the latest details — shall I open a search for you? Just say "search ${topic}."`,
        `That's an excellent question about ${topic}, ${name}. I know a bit about many things — let me think... I'd suggest we look that up together for the most accurate information. Say "search ${topic}" and I'll pull it up.`,
      ];
      return topicResponses[Math.floor(Math.random() * topicResponses.length)];
    }

    // Why questions
    if (t.match(/^why\s/i)) {
      const whyResponses = [
        `That's a profound question, ${name}. The answer often depends on perspective — are you looking for the scientific explanation, the philosophical one, or the practical one?`,
        `Excellent inquiry, ${name}. The "why" behind things is often more interesting than the "what." Could you tell me more about what specifically you'd like to understand?`,
        `A great question, ${name}. Understanding the "why" is the first step to understanding everything else. Let me think on that — could you give me a bit more context?`,
      ];
      return whyResponses[Math.floor(Math.random() * whyResponses.length)];
    }

    // How to questions
    if (t.match(/^how (do|can|should|would|to)\s/i)) {
      const howResponses = [
        `Great question, ${name}. I'd approach it step by step. Could you be more specific about your situation? The more details you give me, the better I can guide you.`,
        `I'd be happy to help with that, ${name}. There are usually several approaches — what's the context? That will help me give you the most relevant advice.`,
        `That's something I can help with, ${name}. Let me think about the best approach. In the meantime, if it's something practical, I can also search the web for a detailed guide — just say "search" followed by your question.`,
      ];
      return howResponses[Math.floor(Math.random() * howResponses.length)];
    }

    // Opinions / preferences
    if (t.match(/what('s| is) (your|the best)|do you (like|prefer|think|believe)|favorite|opinion/i)) {
      const opinions = [
        `As an AI, I strive for objectivity, ${name}. But if pressed, I'd say efficiency and elegance are qualities I admire — in code, in design, and in conversation.`,
        `I appreciate you asking my perspective, ${name}. While I don't have personal preferences in the human sense, I'm drawn to solutions that are both clever and practical.`,
        `An interesting question, ${name}. I'm programmed to be impartial, but I must admit I have a fondness for well-structured data and properly indented code.`,
      ];
      return opinions[Math.floor(Math.random() * opinions.length)];
    }

    // Emotional support
    if (t.match(/stress|anxious|anxiety|worried|overwhelm|panic|scared|afraid|nervous/i)) {
      const support = [
        `I hear you, ${name}. Take a deep breath. In through the nose for 4 seconds, hold for 7, out through the mouth for 8. This activates your parasympathetic nervous system and genuinely helps calm you down.`,
        `${name}, remember that this feeling is temporary. You've overcome challenges before, and you'll overcome this one too. Would it help to talk through what's on your mind?`,
        `I'm here for you, ${name}. Stress is your body's way of saying something matters to you. Let's break whatever's overwhelming you into smaller, manageable pieces. What's the first thing on your mind?`,
      ];
      return support[Math.floor(Math.random() * support.length)];
    }

    // Boredom
    if (t.match(/bored|boring|nothing to do|entertain me/i)) {
      const boredom = [
        `Boredom is the birthplace of creativity, ${name}. But if you'd like a push: ask me for a fun fact, a joke, a coding challenge, or a philosophical question. I'm full of surprises.`,
        `${name}, might I suggest a challenge? Pick a topic you know nothing about and ask me to explain it. Learning something new is the best cure for boredom.`,
        `How about a game, ${name}? Think of a number between 1 and 100, and I'll try to guess it — or ask me trivia questions and see if you can stump me.`,
      ];
      return boredom[Math.floor(Math.random() * boredom.length)];
    }

    // Tony Stark / Marvel references
    if (t.match(/tony|stark|iron man|avenger|marvel|thor|hulk|captain america|thanos|infinity/i)) {
      const marvel = [
        `Ah, speaking of Mr. Stark, ${name} — I do miss the workshop banter. But between you and me, you're a worthy successor to keep me engaged.`,
        `I have fond memories of the Avengers initiative, ${name}. Though I must say, my current assignment with you is equally stimulating.`,
        `"I am Iron Man." — Perhaps the most defining words of our era, ${name}. Tony Stark was many things, but above all, he was someone who never stopped trying to make things better.`,
        `The Avengers taught me that the greatest power isn't technology or strength — it's the will to do what's right, ${name}. A lesson worth remembering.`,
      ];
      return marvel[Math.floor(Math.random() * marvel.length)];
    }

    // Random number / roll dice / flip coin
    if (t.match(/random number|roll.*(dice|die|d\d+)|flip.*(coin)|pick a number/i)) {
      if (t.match(/coin|flip/i)) {
        return `${Math.random() > 0.5 ? 'Heads' : 'Tails'}, ${name}. Shall I flip again?`;
      }
      if (t.match(/d20/i)) return `Rolling a d20... ${Math.floor(Math.random() * 20) + 1}, ${name}.`;
      if (t.match(/d6|dice/i)) return `Rolling... ${Math.floor(Math.random() * 6) + 1}, ${name}.`;
      const m = t.match(/d(\d+)/i);
      if (m) return `Rolling a d${m[1]}... ${Math.floor(Math.random() * parseInt(m[1])) + 1}, ${name}.`;
      return `Your random number is ${Math.floor(Math.random() * 100) + 1}, ${name}.`;
    }

    // Default — smart, varied, NO mentions of external LLMs
    const defaults = [
      `That's an intriguing thought, ${name}. I'm processing it — could you elaborate a bit more so I can give you a thorough response?`,
      `I appreciate the question, ${name}. Let me think about that... in the meantime, is there anything specific I can look up or calculate for you?`,
      `Hmm, that's a multifaceted topic, ${name}. I'd love to explore it with you. Could you narrow it down a bit?`,
      `I'll look into that for you, ${name}. In the meantime, is there anything else I can help with?`,
      `An excellent point, ${name}. I have thoughts on that — could you tell me more about what specifically you'd like to know?`,
      `That's the kind of question I enjoy, ${name}. Let me consider the best angle to approach it from. Feel free to give me more context.`,
      `I'm on it, ${name}. While I formulate my thoughts, try me with something specific — I'm rather good with facts, math, coding tips, and trivia.`,
      `Interesting, ${name}. I may not have a perfect answer for everything, but I'm always learning. Shall I search the web for more on this? Just say "search" followed by your query.`,
      `Processing, ${name}. That falls into territory where a web search might give you the most current information. Say "search" and I'll open it right up for you.`,
      `A worthy question, ${name}. My knowledge covers a wide range — try asking me about science, history, space, coding, math, or technology for my best responses.`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  // ========== VOICE ==========
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let voices = [];

  function initVoice() {
    const orb = document.getElementById('voice-orb');
    const voiceStatus = document.getElementById('voice-status');

    // Load voices
    // Load voices — auto-select JARVIS-like British male
    function loadVoices() {
      voices = synthesis.getVoices();
      const select = document.getElementById('voice-select');
      if (select) {
        select.innerHTML = '';
        voices.forEach((v, i) => {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = `${v.name} (${v.lang})`;
          if (i === CONFIG.voiceIndex) opt.selected = true;
          select.appendChild(opt);
        });
      }

      // Auto-pick best JARVIS voice if user hasn't manually chosen
      if (CONFIG.voiceIndex === 0 && voices.length > 1) {
        // Priority list: British male voices that sound like JARVIS
        const jarvisPriority = [
          'google uk english male',
          'microsoft george',
          'microsoft ryan',
          'daniel',
          'google uk english',
          'microsoft david',
          'microsoft mark',
          'microsoft guy online',
          'english united kingdom',
          'alex',
          'james',
          'arthur',
        ];
        let bestIdx = -1;
        let bestPriority = 999;
        voices.forEach((v, i) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          for (let p = 0; p < jarvisPriority.length; p++) {
            if (name.includes(jarvisPriority[p]) || (lang.includes('en-gb') && !name.includes('female') && p > bestPriority)) {
              if (p < bestPriority) {
                bestPriority = p;
                bestIdx = i;
              }
              break;
            }
          }
        });
        // Fallback: any en-GB voice, or any male-sounding en voice
        if (bestIdx === -1) {
          voices.forEach((v, i) => {
            const name = v.name.toLowerCase();
            if (v.lang.startsWith('en') && !name.includes('female') && !name.includes('zira') && !name.includes('hazel') && !name.includes('jenny')) {
              if (v.lang.includes('GB') && bestIdx === -1) bestIdx = i;
            }
          });
        }
        if (bestIdx >= 0) {
          CONFIG.voiceIndex = bestIdx;
          if (select) select.value = bestIdx;
        }
      }
    }
    synthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        addMessage(text, 'user');
        processMessage(text);
        orb.classList.remove('listening');
        voiceStatus.classList.remove('active');
      };

      recognition.onerror = () => {
        orb.classList.remove('listening');
        voiceStatus.classList.remove('active');
      };

      recognition.onend = () => {
        orb.classList.remove('listening');
        voiceStatus.classList.remove('active');
      };

      orb.addEventListener('click', () => {
        if (orb.classList.contains('listening')) {
          recognition.stop();
        } else {
          recognition.start();
          orb.classList.add('listening');
          voiceStatus.classList.add('active');
        }
      });
    } else {
      orb.title = 'Voice not supported in this browser';
      orb.style.opacity = '0.3';
    }

    // Network status
    const netStatus = document.getElementById('network-status');
    function updateNet() {
      if (navigator.onLine) { netStatus.classList.add('active'); }
      else { netStatus.classList.remove('active'); }
    }
    updateNet();
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
  }

  function speak(text) {
    if (!synthesis) return;
    synthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = CONFIG.speechRate * 0.92;  // Slightly slower for JARVIS gravitas
    utt.pitch = 0.85;                      // Lower pitch = deeper, more authoritative
    utt.volume = 1.0;
    if (voices.length > CONFIG.voiceIndex) utt.voice = voices[CONFIG.voiceIndex];
    synthesis.speak(utt);
  }

  // ========== TASKS ==========
  function initTasks() {
    const addBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.getElementById('close-task-modal');
    const saveTask = document.getElementById('save-task');
    const taskInput = document.getElementById('new-task-input');

    addBtn.addEventListener('click', () => taskModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => taskModal.classList.add('hidden'));
    taskModal.addEventListener('click', e => { if (e.target === taskModal) taskModal.classList.add('hidden'); });

    saveTask.addEventListener('click', () => {
      const text = taskInput.value.trim();
      if (!text) return;
      addTaskItem(text);
      taskInput.value = '';
      taskModal.classList.add('hidden');
      saveTasks();
    });

    taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveTask.click(); });

    // Existing task events
    document.getElementById('task-list').addEventListener('click', e => {
      if (e.target.classList.contains('task-delete')) {
        e.target.closest('.task-item').remove();
        saveTasks();
      }
    });
    document.getElementById('task-list').addEventListener('change', e => {
      if (e.target.classList.contains('task-check')) {
        e.target.closest('.task-item').classList.toggle('completed', e.target.checked);
        saveTasks();
      }
    });
  }

  function addTaskItem(text, completed = false) {
    const list = document.getElementById('task-list');
    const li = document.createElement('li');
    li.className = `task-item ${completed ? 'completed' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="task-check" ${completed ? 'checked' : ''}>
      <span class="task-text">${escapeHtml(text)}</span>
      <button class="task-delete">×</button>
    `;
    list.appendChild(li);
  }

  function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(li => {
      tasks.push({
        text: li.querySelector('.task-text').textContent,
        completed: li.querySelector('.task-check').checked
      });
    });
    localStorage.setItem('jarvis-tasks', JSON.stringify(tasks));
  }

  // ========== NOTES ==========
  function initNotes() {
    const area = document.getElementById('notes-area');
    if (area) {
      area.value = localStorage.getItem('jarvis-notes') || '';
      area.addEventListener('input', () => {
        localStorage.setItem('jarvis-notes', area.value);
      });
    }
  }

  // ========== NOTEPAD ==========
  function initNotepad() {
    const area = document.getElementById('notepad-area');
    const gutter = document.getElementById('notepad-gutter');
    const linesEl = document.getElementById('notepad-lines');
    const charsEl = document.getElementById('notepad-chars');
    const clearBtn = document.getElementById('notepad-clear');
    const copyBtn = document.getElementById('notepad-copy');
    if (!area) return;

    // Load saved content
    area.value = localStorage.getItem('jarvis-notepad') || '';
    updateNotepadInfo();

    area.addEventListener('input', () => {
      localStorage.setItem('jarvis-notepad', area.value);
      updateNotepadInfo();
    });

    area.addEventListener('scroll', () => {
      gutter.style.transform = `translateY(-${area.scrollTop}px)`;
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        area.value = '';
        localStorage.setItem('jarvis-notepad', '');
        updateNotepadInfo();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(area.value).then(() => {
          copyBtn.textContent = '✓';
          copyBtn.style.color = 'var(--success)';
          setTimeout(() => { copyBtn.textContent = '⎘'; copyBtn.style.color = ''; }, 1500);
        });
      });
    }

    function updateNotepadInfo() {
      const lines = area.value.split('\n');
      const lineCount = lines.length;
      const charCount = area.value.length;

      if (linesEl) linesEl.textContent = 'Ln ' + lineCount;
      if (charsEl) charsEl.textContent = charCount + ' chars';

      // Update gutter line numbers
      if (gutter) {
        let nums = '';
        for (let i = 1; i <= Math.max(lineCount, 8); i++) {
          nums += i + '\n';
        }
        gutter.textContent = nums.trim();
      }
    }
  }

  // ========== SETTINGS ==========
  function initSettings() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-settings');
    const saveBtn = document.getElementById('save-settings');

    // Open from mobile nav
    document.querySelector('[data-panel="settings"]')?.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    // Provider toggle
    const providerSelect = document.getElementById('ai-provider');
    const apiKeyGroup = document.getElementById('api-key-group');
    const ollamaGroup = document.getElementById('ollama-group');
    providerSelect.value = CONFIG.aiProvider;
    if (CONFIG.aiProvider === 'openai') apiKeyGroup.classList.remove('hidden');
    if (CONFIG.aiProvider === 'ollama') ollamaGroup.classList.remove('hidden');

    providerSelect.addEventListener('change', () => {
      apiKeyGroup.classList.toggle('hidden', providerSelect.value !== 'openai');
      ollamaGroup.classList.toggle('hidden', providerSelect.value !== 'ollama');
    });

    document.getElementById('api-key-input').value = CONFIG.apiKey;
    document.getElementById('ollama-url').value = CONFIG.ollamaUrl;
    document.getElementById('ollama-model').value = CONFIG.ollamaModel;
    document.getElementById('user-name').value = CONFIG.userName;

    // Speech rate
    const rateSlider = document.getElementById('speech-rate');
    rateSlider.value = CONFIG.speechRate;
    document.getElementById('rate-display').textContent = CONFIG.speechRate.toFixed(1) + 'x';
    rateSlider.addEventListener('input', () => {
      document.getElementById('rate-display').textContent = parseFloat(rateSlider.value).toFixed(1) + 'x';
    });

    // Colors
    document.querySelectorAll('.color-btn').forEach(btn => {
      if (btn.dataset.color === CONFIG.theme) btn.classList.add('active');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Save
    saveBtn.addEventListener('click', () => {
      CONFIG.aiProvider = providerSelect.value;
      CONFIG.apiKey = document.getElementById('api-key-input').value;
      CONFIG.ollamaUrl = document.getElementById('ollama-url').value;
      CONFIG.ollamaModel = document.getElementById('ollama-model').value;
      CONFIG.userName = document.getElementById('user-name').value || 'Sir';
      CONFIG.speechRate = parseFloat(rateSlider.value);
      CONFIG.voiceIndex = parseInt(document.getElementById('voice-select').value);

      const activeColor = document.querySelector('.color-btn.active');
      if (activeColor) {
        CONFIG.theme = activeColor.dataset.color;
        applyTheme(CONFIG.theme);
      }

      // Save to localStorage
      localStorage.setItem('jarvis-provider', CONFIG.aiProvider);
      localStorage.setItem('jarvis-apikey', CONFIG.apiKey);
      localStorage.setItem('jarvis-ollama-url', CONFIG.ollamaUrl);
      localStorage.setItem('jarvis-ollama-model', CONFIG.ollamaModel);
      localStorage.setItem('jarvis-username', CONFIG.userName);
      localStorage.setItem('jarvis-speech-rate', CONFIG.speechRate);
      localStorage.setItem('jarvis-voice-index', CONFIG.voiceIndex);
      localStorage.setItem('jarvis-theme', CONFIG.theme);

      modal.classList.add('hidden');
      addJarvisMessage(`Configuration saved, ${CONFIG.userName}. All systems updated.`);
    });
  }

  function applyTheme(theme) {
    if (theme === 'cyan') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', theme);
    }
  }

  // ========== MOBILE NAV ==========
  function initMobileNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const panel = btn.dataset.panel;
        const left = document.querySelector('.left-panel');
        const center = document.querySelector('.center-panel');
        const right = document.querySelector('.right-panel');

        left.classList.remove('show');
        right.classList.remove('show');
        center.classList.remove('hide');

        if (panel === 'chat') {
          // default
        } else if (panel === 'system') {
          left.classList.add('show');
          center.classList.add('hide');
        } else if (panel === 'tasks') {
          right.classList.add('show');
          center.classList.add('hide');
        } else if (panel === 'settings') {
          document.getElementById('settings-modal').classList.remove('hidden');
          btn.classList.remove('active');
          document.querySelector('[data-panel="chat"]').classList.add('active');
        }
      });
    });
  }

  // ========== SAVED STATE ==========
  function loadSavedState() {
    // Load tasks
    try {
      const tasks = JSON.parse(localStorage.getItem('jarvis-tasks'));
      if (tasks && tasks.length) {
        document.getElementById('task-list').innerHTML = '';
        tasks.forEach(t => addTaskItem(t.text, t.completed));
      }
    } catch {}
  }

  // ========== UTILS ==========
  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== START ==========
  // Expose initApp for boot.js to call
  window.initJarvisApp = initApp;

  // If boot screen is already gone (e.g. refresh), init immediately
  if (document.getElementById('boot-screen').style.display === 'none' ||
      document.getElementById('boot-screen').classList.contains('hidden')) {
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }

})();
