// =============================================
// J.A.R.V.I.S. OS — 3D ORB CORE
// Bright, visible particle sphere
// =============================================

(function() {
  'use strict';

  let scene, camera, renderer, orbPoints, innerPoints, coreGlow;
  let orbState = 'idle';
  let time = 0;
  let basePositions = [];
  let innerBasePositions = [];
  let targetScale = 1;
  let currentScale = 1;
  let orbContainer;
  let rings = [];

  window.initOrb = function() {
    orbContainer = document.getElementById('orb-canvas-wrap');
    if (!orbContainer) return;

    requestAnimationFrame(function() {
      const rect = orbContainer.getBoundingClientRect();
      const w = Math.max(rect.width, 400);
      const h = Math.max(rect.height, 400);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 4.0;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      orbContainer.appendChild(renderer.domElement);

      createOrb();
      createStars();

      window.addEventListener('resize', onResize);
      animate();
      hookVoiceState();
    });
  };

  // Soft glow dot texture
  function makeDotTexture(size, sharpness) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    var half = size / 2;
    var g = ctx.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(sharpness, 'rgba(255,255,255,0.8)');
    g.addColorStop(sharpness + 0.2, 'rgba(255,255,255,0.2)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function createOrb() {
    var radius = 1.3;

    // ========== OUTER SHELL: structured lat/lon grid ==========
    var latCount = 60;
    var lonCount = 90;
    var positions = [];
    var colors = [];

    for (var lat = 0; lat < latCount; lat++) {
      var theta = (lat / (latCount - 1)) * Math.PI;
      for (var lon = 0; lon < lonCount; lon++) {
        var phi = (lon / lonCount) * Math.PI * 2;
        positions.push(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.cos(theta),
          radius * Math.sin(theta) * Math.sin(phi)
        );
        // Bright cyan, slight variation
        var b = 0.85 + Math.random() * 0.15;
        colors.push(0.1 * b, 0.85 * b, 1.0 * b);
      }
    }

    basePositions = new Float32Array(positions);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var dotTex = makeDotTexture(64, 0.15);

    // BIG, BRIGHT particles
    var mat = new THREE.PointsMaterial({
      size: 0.06,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    orbPoints = new THREE.Points(geo, mat);
    scene.add(orbPoints);

    // ========== INNER CLOUD: random particles for volume ==========
    var innerPos = [];
    var innerCol = [];
    for (var i = 0; i < 2000; i++) {
      var r = radius * (0.1 + Math.random() * 0.8);
      var t = Math.random() * Math.PI;
      var p = Math.random() * Math.PI * 2;
      innerPos.push(
        r * Math.sin(t) * Math.cos(p),
        r * Math.cos(t),
        r * Math.sin(t) * Math.sin(p)
      );
      var depth = 1.0 - (r / radius);
      innerCol.push(0.15 * depth, 0.6 + depth * 0.4, 0.85 + depth * 0.15);
    }

    innerBasePositions = new Float32Array(innerPos);

    var iGeo = new THREE.BufferGeometry();
    iGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPos, 3));
    iGeo.setAttribute('color', new THREE.Float32BufferAttribute(innerCol, 3));

    var iMat = new THREE.PointsMaterial({
      size: 0.04,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    innerPoints = new THREE.Points(iGeo, iMat);
    scene.add(innerPoints);

    // ========== CORE GLOW: big bright center light ==========
    var glowC = document.createElement('canvas');
    glowC.width = 128; glowC.height = 128;
    var gx = glowC.getContext('2d');
    var gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gg.addColorStop(0, 'rgba(0,230,255,0.5)');
    gg.addColorStop(0.3, 'rgba(0,200,255,0.2)');
    gg.addColorStop(0.6, 'rgba(0,150,255,0.05)');
    gg.addColorStop(1, 'rgba(0,100,255,0)');
    gx.fillStyle = gg;
    gx.fillRect(0, 0, 128, 128);

    var glowMat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowC),
      color: 0x00ddff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    coreGlow = new THREE.Sprite(glowMat);
    coreGlow.scale.set(4, 4, 1);
    scene.add(coreGlow);

    // ========== RINGS ==========
    rings.push(addRing(1.5, 1.52, 0.15, 0));
    rings.push(addRing(1.65, 1.665, 0.1, 0.35));
    rings.push(addRing(1.8, 1.81, 0.06, -0.2));
  }

  function addRing(inner, outer, opacity, rotX) {
    var geo = new THREE.RingGeometry(inner, outer, 128);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, transparent: true, opacity: opacity,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rotX || 0;
    scene.add(mesh);
    return mesh;
  }

  function createStars() {
    var positions = [];
    for (var i = 0; i < 400; i++) {
      positions.push(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        -15 - Math.random() * 50
      );
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.06,
      transparent: true, opacity: 0.5, sizeAttenuation: true,
    })));
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.016;
    if (!orbPoints) return;

    var pos = orbPoints.geometry.attributes.position.array;
    var count = basePositions.length / 3;
    currentScale += (targetScale - currentScale) * 0.06;

    // State params
    var distAmt = 0.03, waveSpd = 0.7, rotSpd = 0.002;
    var innerPulse = 0.65, glowSize = 4.0, glowOp = 0.7;

    if (orbState === 'idle') {
      targetScale = 1.0;
    } else if (orbState === 'listening') {
      distAmt = 0.08; waveSpd = 2.0; rotSpd = 0.005;
      targetScale = 1.05; innerPulse = 0.8; glowSize = 4.5; glowOp = 0.9;
    } else if (orbState === 'speaking') {
      distAmt = 0.18; waveSpd = 4.0; rotSpd = 0.008;
      targetScale = 1.1; innerPulse = 1.0; glowSize = 5.0; glowOp = 1.0;
    }

    // Main sphere distortion
    for (var i = 0; i < count; i++) {
      var bx = basePositions[i * 3];
      var by = basePositions[i * 3 + 1];
      var bz = basePositions[i * 3 + 2];
      var dist = Math.sqrt(bx * bx + by * by + bz * bz);
      if (dist < 0.001) continue;
      var nx = bx / dist, ny = by / dist, nz = bz / dist;

      var w1 = Math.sin(by * 3.0 + time * waveSpd * 0.6) *
               Math.cos(bx * 2.5 + time * waveSpd * 0.4);
      var w2 = Math.sin(bz * 5.0 + time * waveSpd * 1.2) *
               Math.cos(by * 4.0 + time * waveSpd * 0.9) * 0.4;
      var w3 = Math.sin((bx + by + bz) * 8.0 + time * waveSpd * 2.0) * 0.12;
      var offset = (w1 + w2 + w3) * distAmt * dist;

      pos[i * 3]     = (bx + nx * offset) * currentScale;
      pos[i * 3 + 1] = (by + ny * offset) * currentScale;
      pos[i * 3 + 2] = (bz + nz * offset) * currentScale;
    }
    orbPoints.geometry.attributes.position.needsUpdate = true;
    orbPoints.rotation.y += rotSpd;
    orbPoints.rotation.x = Math.sin(time * 0.25) * 0.08;
    orbPoints.material.opacity = 0.9 + Math.sin(time * 1.0) * 0.1;

    // Inner cloud
    if (innerPoints) {
      var iPos = innerPoints.geometry.attributes.position.array;
      var iCount = innerBasePositions.length / 3;
      for (var j = 0; j < iCount; j++) {
        var ibx = innerBasePositions[j * 3];
        var iby = innerBasePositions[j * 3 + 1];
        var ibz = innerBasePositions[j * 3 + 2];
        var idist = Math.sqrt(ibx * ibx + iby * iby + ibz * ibz);
        if (idist < 0.001) continue;
        var inx = ibx / idist, iny = iby / idist, inz = ibz / idist;
        var iw = Math.sin(iby * 2 + time * waveSpd * 0.5) *
                 Math.cos(ibx * 3 + time * waveSpd * 0.3) * distAmt * 1.5;
        iPos[j * 3]     = (ibx + inx * iw * idist) * currentScale;
        iPos[j * 3 + 1] = (iby + iny * iw * idist) * currentScale;
        iPos[j * 3 + 2] = (ibz + inz * iw * idist) * currentScale;
      }
      innerPoints.geometry.attributes.position.needsUpdate = true;
      innerPoints.rotation.y -= rotSpd * 0.4;
      innerPoints.rotation.x = Math.sin(time * 0.2) * 0.12;
      innerPoints.material.opacity = innerPulse + Math.sin(time * 1.5) * 0.1;
    }

    // Core glow
    if (coreGlow) {
      var gs = glowSize + Math.sin(time * 1.0) * 0.4;
      coreGlow.scale.set(gs, gs, 1);
      coreGlow.material.opacity = glowOp * (0.7 + Math.sin(time * 0.8) * 0.3);
    }

    // Rings
    for (var k = 0; k < rings.length; k++) {
      rings[k].rotation.z += 0.0015 * (k % 2 === 0 ? 1 : -1);
      rings[k].rotation.y += 0.0008;
      rings[k].material.opacity = 0.08 + Math.sin(time * 0.5 + k * 1.5) * 0.05;
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    if (!orbContainer || !camera || !renderer) return;
    var rect = orbContainer.getBoundingClientRect();
    var w = Math.max(rect.width, 200);
    var h = Math.max(rect.height, 200);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function hookVoiceState() {
    var voiceOrb = document.getElementById('voice-orb');
    if (voiceOrb) {
      var observer = new MutationObserver(function() {
        if (voiceOrb.classList.contains('listening')) {
          setOrbState('listening');
        } else if (orbState === 'listening') {
          setOrbState('idle');
        }
      });
      observer.observe(voiceOrb, { attributes: true, attributeFilter: ['class'] });
    }

    if (window.speechSynthesis) {
      var origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = function(utt) {
        setOrbState('speaking');
        utt.addEventListener('end', function() { setOrbState('idle'); });
        utt.addEventListener('error', function() { setOrbState('idle'); });
        origSpeak(utt);
      };
    }
  }

  window.setOrbState = function(state) {
    orbState = state;
    var label = document.getElementById('orb-state-label');
    if (label) {
      var labels = { idle: 'STANDBY', listening: 'LISTENING', speaking: 'SPEAKING' };
      label.textContent = labels[state] || 'STANDBY';
      label.className = 'orb-state-label ' + state;
    }
  };

})();
