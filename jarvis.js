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
      return `Here's what I can do, ${name}:\n\n• 🗣️ Voice commands — click the mic or hold to speak\n• 💬 Chat with AI — local, OpenAI, or Ollama\n• 📋 Task management — track your to-do list\n• 📝 Notes — auto-saved memory banks\n• 🌤️ Live weather — using your location\n• 🔍 Web search — just say "search [topic]"\n• ⚙️ Customizable — themes, voice, and more\n• 📱 Works on phone — install as PWA\n\nOpen Settings (⚙️) to configure your AI provider and theme!`;
    }
    // Calculate
    if (t.match(/^(calc|calculate|what is|what's)\s*[\d+\-*/().% ]+$/i)) {
      try {
        const expr = t.replace(/^(calc|calculate|what is|what's)\s*/i, '').replace(/[^0-9+\-*/().% ]/g, '');
        const result = Function('"use strict"; return (' + expr + ')')();
        return `The answer is ${result}, ${name}.`;
      } catch { return `I couldn't parse that equation, ${name}. Could you rephrase it?`; }
    }

    // Default
    const defaults = [
      `That's an interesting query, ${name}. For a more sophisticated response, you can connect me to an AI backend via Settings. I support OpenAI and local Ollama models.`,
      `I understand, ${name}. While my local intelligence covers basics, connecting to an LLM via Settings will give me far more capability.`,
      `Noted, ${name}. For complex tasks, I recommend configuring an AI provider in my Settings panel — it's free with Ollama!`,
      `Processing your request, ${name}. My local responses are limited, but with a connected AI backend I can handle virtually anything.`,
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
