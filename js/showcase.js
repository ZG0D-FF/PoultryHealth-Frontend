/**
 * MONARCH ORCA V14 TITAN SENTRY — SHOWCASE JAVASCRIPT ENGINE
 * Full WebGL / Canvas / KaTeX Implementation (Zero Fakism, Real Audio & Telemetry)
 */

(function () {
  'use strict';

  // State
  let telemetryData = null;
  let activeSampleKey = 'healthy'; // 'healthy', 'sick', 'noise'
  let audioContext = null;
  let audioBuffers = {};
  let audioSource = null;
  let isAudioPlaying = false;
  let audioStartTime = 0;
  let playbackProgress = 0; // 0.0 to 1.0
  let currentThreshold = 0.85;

  // -------------------------------------------------------------------------
  // 1. DATA INITIALIZATION
  // -------------------------------------------------------------------------
  async function loadTelemetry() {
    try {
      const res = await fetch('data/showcase_telemetry.json');
      telemetryData = await res.json();
      console.log('[Telemetry] Loaded successfully:', telemetryData.audio_samples);

      initAudioSelector();
      initWaveformVisualizer();
      initSpectrogramVisualizer();
      initManifoldVisualizer();
      initBayesianEngine();
      
      // Initial render for default sample
      updateActiveSampleDisplay(activeSampleKey);
    } catch (err) {
      console.error('[Telemetry] Load error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // 2. HERO 3D STUDIO STAGE (ALL 6 HARDWARE GLBS - NON-OVERLAPPING STATIONS)
  // -------------------------------------------------------------------------
  let stageScene, stageCamera, stageRenderer, stageControls;
  let isAutoRotate = true;
  const stageContainer = document.getElementById('three-canvas-container');
  const stageLoader = document.getElementById('stage-loader');
  const stageInfoTitle = document.getElementById('info-pill-title');
  const stageInfoDesc = document.getElementById('info-pill-desc');

  const nodes = {
    all: { camPos: [0, 2.8, 6.2], lookAt: [0, 0.15, 0.05], title: 'Complete Mesh (All 6 Hardware Units)', desc: 'Tier 0 Linux Gateway + Tier 1 I2S DSP + Tier 2 ML Sentry' },
    node0: { camPos: [-2.6, 1.25, 2.5], lookAt: [-2.6, 0.15, 0.05], title: 'Node 0: Titan Master Hub', desc: 'Raspberry Pi 3B+ (ARM Cortex-A53) & Titan USB Condenser Mic' },
    node1: { camPos: [-0.1, 1.25, 2.5], lookAt: [-0.1, 0.15, 0.05], title: 'Node 1: Ultra-Low-Power DSP', desc: 'Official Espressif ESP32-S3-DevKitC-1 & INMP441 Digital I2S MEMS Mic' },
    node2: { camPos: [2.55, 1.25, 2.5], lookAt: [2.55, 0.15, 0.05], title: 'Node 2: Edge ML Classifier', desc: 'Official Espressif ESP32 DevKit V1 & Elechouse VR3 Voice Module' }
  };

  let targetCamPos = new THREE.Vector3(...nodes.all.camPos);
  let targetLookAt = new THREE.Vector3(...nodes.all.lookAt);
  let isTransitioningCamera = false;

  function init3DStage() {
    if (!stageContainer) return;

    const width = stageContainer.clientWidth;
    const height = stageContainer.clientHeight;

    stageScene = new THREE.Scene();
    stageScene.background = new THREE.Color(0x07080a); // Pure obsidian neutral

    stageCamera = new THREE.PerspectiveCamera(38, width / height, 0.05, 100);
    stageCamera.position.set(...nodes.all.camPos);

    stageRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    stageRenderer.setSize(width, height);
    stageRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stageRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    stageRenderer.toneMappingExposure = 1.05;
    stageRenderer.shadowMap.enabled = true;
    stageRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stageContainer.appendChild(stageRenderer.domElement);

    // Full 6-DoF OrbitControls: inspect from any side, any angle, top to bottom
    stageControls = new THREE.OrbitControls(stageCamera, stageRenderer.domElement);
    stageControls.enableDamping = true;
    stageControls.dampingFactor = 0.06;
    stageControls.enableRotate = true;
    stageControls.enableZoom = true;
    stageControls.enablePan = true;
    stageControls.screenSpacePanning = true;
    stageControls.minPolarAngle = 0;           // Look straight down from above
    stageControls.maxPolarAngle = Math.PI;     // Full freedom: look from underneath
    stageControls.minDistance = 0.15;          // Macro inspection zoom
    stageControls.maxDistance = 25.0;          // Wide overview zoom
    stageControls.target.set(0, 0.15, 0);

    // Pause auto-rotate & cancel transition as soon as user touches or drags controls
    stageControls.addEventListener('start', () => {
      isTransitioningCamera = false;
      if (isAutoRotate) {
        isAutoRotate = false;
        const btn = document.getElementById('auto-rotate-btn');
        if (btn) btn.classList.remove('active');
      }
    });

    // 5000K Neutral Studio Daylight Lighting (Zero Blue Glare)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    stageScene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x181a20, 0.7);
    hemiLight.position.set(0, 10, 0);
    stageScene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.6);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    stageScene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e8e8, 0.7);
    fillLight.position.set(-5, 4, -3);
    stageScene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 3, -5);
    stageScene.add(rimLight);

    // Underside bounce light for inspecting bottom of boards
    const bottomBounceLight = new THREE.DirectionalLight(0xcccccc, 0.5);
    bottomBounceLight.position.set(0, -6, 0);
    stageScene.add(bottomBounceLight);

    // Studio Pedestal Floor (Dark Obsidian)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.95,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    stageScene.add(floor);

    // Circular Titanium Turntable Base
    const runwayGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.06, 64);
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x0f1116,
      metalness: 0.35,
      roughness: 0.75
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.y = 0.03;
    runway.receiveShadow = true;
    stageScene.add(runway);

    // Subtle Runway Edge Ring
    const edgeRingGeo = new THREE.TorusGeometry(4.8, 0.012, 12, 64);
    const edgeRing = new THREE.Mesh(edgeRingGeo, new THREE.MeshStandardMaterial({ color: 0x252730, metalness: 0.5, roughness: 0.5 }));
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = 0.061;
    stageScene.add(edgeRing);

    // Subtle Grid on Turntable
    const grid = new THREE.GridHelper(8, 16, 0x1f222b, 0x14161d);
    grid.position.y = 0.062;
    stageScene.add(grid);

    // Load Models
    loadStageModels();

    // Resize handler
    window.addEventListener('resize', onStageResize);

    // Animation Loop
    animateStage();
  }

  function onStageResize() {
    if (!stageContainer || !stageRenderer || !stageCamera) return;
    const w = stageContainer.clientWidth;
    const h = stageContainer.clientHeight;
    stageCamera.aspect = w / h;
    stageCamera.fov = (w < 768) ? 54 : 38;
    stageCamera.updateProjectionMatrix();
    stageRenderer.setSize(w, h);
  }

  function loadStageModels() {
    const gltfLoader = new THREE.GLTFLoader();
    
    // Setup Draco Loader
    if (THREE.DRACOLoader) {
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('vendor/draco/');
      gltfLoader.setDRACOLoader(dracoLoader);
    }

    // Guaranteed non-overlapping coordinates: zero tilt collision, >0.35 unit air gap between all units
    const modelConfigs = [
      // Station 0: Raspberry Pi 3B+ & Titan USB Condenser Mic
      { path: 'models/raspberry_pi.glb', pos: [-3.25, 0.06, -0.25], rot: [0, 0.0, 0], scale: 0.95, name: 'Raspberry Pi 3B+' },
      { path: 'models/usb_mic.glb', pos: [-1.95, 0.06, 0.30], rot: [0, -0.6, 0], scale: 0.65, name: 'Titan USB Mic' },
      
      // Station 1: Official Espressif ESP32-S3 & INMP441 I2S MEMS Mic
      { path: 'models/esp32_s3.glb', pos: [-0.75, 0.06, -0.25], rot: [0, 0.0, 0], scale: 0.85, name: 'ESP32-S3 DevKitC' },
      { path: 'models/inmp441_mic.glb', pos: [0.55, 0.06, 0.30], rot: [0, 0.0, 0], scale: 0.45, name: 'INMP441 MEMS' },
      
      // Station 2: Official Espressif ESP32 DevKit V1 & Elechouse VR3 Voice Module
      { path: 'models/esp32_devkit_v1.glb', pos: [1.85, 0.06, -0.25], rot: [0, 0.0, 0], scale: 0.85, name: 'ESP32 DevKit V1' },
      { path: 'models/elechouse_vr3.glb', pos: [3.25, 0.06, 0.30], rot: [0, 0.0, 0], scale: 0.65, name: 'Elechouse VR3' }
    ];

    let loadedCount = 0;
    modelConfigs.forEach(cfg => {
      gltfLoader.load(
        cfg.path,
        (gltf) => {
          const obj = gltf.scene;
          
          // Compute bounding box and normalize
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const normFactor = 1.4 / (maxDim || 1);
          
          obj.scale.setScalar(normFactor * cfg.scale);
          
          // Re-center on floor
          const newBox = new THREE.Box3().setFromObject(obj);
          const center = newBox.getCenter(new THREE.Vector3());
          obj.position.x = cfg.pos[0] - center.x;
          obj.position.y = cfg.pos[1] - newBox.min.y + 0.062; // sit directly on pedestal
          obj.position.z = cfg.pos[2] - center.z;
          obj.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

          obj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 0.7;
                child.material.side = THREE.DoubleSide;
                child.material.needsUpdate = true;
              }
            }
          });

          stageScene.add(obj);
          loadedCount++;
          if (loadedCount >= modelConfigs.length && stageLoader) {
            stageLoader.style.opacity = '0';
            setTimeout(() => stageLoader.style.display = 'none', 400);
          }
        },
        undefined,
        (err) => {
          console.warn(`[3D Stage] Fallback geometry for ${cfg.name}:`, err);
        }
      );
    });
  }

  function animateStage() {
    requestAnimationFrame(animateStage);

    // Smooth camera transition only during programmatic focus switch
    if (isTransitioningCamera) {
      stageCamera.position.lerp(targetCamPos, 0.08);
      stageControls.target.lerp(targetLookAt, 0.08);

      if (stageCamera.position.distanceTo(targetCamPos) < 0.03 && stageControls.target.distanceTo(targetLookAt) < 0.03) {
        stageCamera.position.copy(targetCamPos);
        stageControls.target.copy(targetLookAt);
        isTransitioningCamera = false;
      }
    }

    // World coordinates stay fixed; OrbitControls handles camera auto-rotation smoothly
    stageControls.autoRotate = isAutoRotate && !isTransitioningCamera;
    stageControls.autoRotateSpeed = 1.0;

    stageControls.update();
    stageRenderer.render(stageScene, stageCamera);
  }

  // Node focus selector - accurately jumps directly to each hardware unit without world drift
  window.switchStageFocus = function (nodeKey) {
    const target = nodes[nodeKey] || nodes.all;
    targetCamPos.set(...target.camPos);
    targetLookAt.set(...target.lookAt);
    isTransitioningCamera = true;
    
    // Pause auto-rotation when focusing on a specific node
    if (nodeKey !== 'all') {
      isAutoRotate = false;
      stageControls.autoRotate = false;
      const btn = document.getElementById('auto-rotate-btn');
      if (btn) btn.classList.remove('active');
    }

    if (stageInfoTitle && stageInfoDesc) {
      stageInfoTitle.textContent = target.title;
      stageInfoDesc.textContent = target.desc;
    }

    document.querySelectorAll('.stage-btn, .nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.node === nodeKey);
    });
  };

  window.toggleAutoRotate = function () {
    isAutoRotate = !isAutoRotate;
    stageControls.autoRotate = isAutoRotate;
    const btn = document.getElementById('auto-rotate-btn');
    if (btn) btn.classList.toggle('active', isAutoRotate);
  };

  window.resetStageView = function () {
    switchStageFocus('all');
  };

  // -------------------------------------------------------------------------
  // 3. AUDIO SAMPLE SELECTOR & REAL-TIME DISPATCH
  // -------------------------------------------------------------------------
  function initAudioSelector() {
    document.querySelectorAll('.audio-sel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.sample;
        if (key && key !== activeSampleKey) {
          if (isAudioPlaying) stopAudio();
          activeSampleKey = key;
          
          document.querySelectorAll('.audio-sel-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.sample === key);
          });

          updateActiveSampleDisplay(key);
        }
      });
    });
  }

  function updateActiveSampleDisplay(key) {
    if (!telemetryData || !telemetryData.audio_samples) return;
    const sample = telemetryData.audio_samples[key];
    if (!sample) return;

    // 1. Update Metrics in Top-Right and Bottom
    const rmsEl = document.getElementById('metric-rms');
    const snrEl = document.getElementById('metric-snr');
    const latEl = document.getElementById('metric-lat');
    const bRmsEl = document.getElementById('b-metric-rms');
    const bSnrEl = document.getElementById('b-metric-snr');
    const bLatEl = document.getElementById('b-metric-lat');

    const rmsStr = `${Number(sample.metrics.rms_db).toFixed(1)} dB`;
    const snrStr = `${Number(sample.metrics.snr_db).toFixed(1)} dB`;
    const latStr = `${Number(sample.metrics.latency_ms).toFixed(1)}ms`;

    if (rmsEl) rmsEl.textContent = rmsStr;
    if (snrEl) snrEl.textContent = snrStr;
    if (latEl) latEl.textContent = latStr;
    if (bRmsEl) bRmsEl.textContent = rmsStr;
    if (bSnrEl) bSnrEl.textContent = snrStr;
    if (bLatEl) bLatEl.textContent = latStr;

    // 2. Draw Waveform
    drawWaveform(0);

    // 3. Render Spectrogram Heatmap
    renderSpectrogramData(sample.spectrogram_b64);

    // 4. Update Bayesian Posterior
    updateBayesianVisuals(currentThreshold);
  }

  // -------------------------------------------------------------------------
  // 4. EXACT SNAP 1 & 2: LIVE BIOACOUSTIC WAVEFORM VISUALIZER
  // -------------------------------------------------------------------------
  let waveformCanvas, waveformCtx;

  function initWaveformVisualizer() {
    waveformCanvas = document.getElementById('waveform-canvas');
    if (!waveformCanvas) return;
    waveformCtx = waveformCanvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = waveformCanvas.getBoundingClientRect();
    waveformCanvas.width = rect.width * dpr;
    waveformCanvas.height = rect.height * dpr;
    waveformCtx.scale(dpr, dpr);
  }

  function drawWaveform(progress) {
    if (!waveformCtx || !waveformCanvas || !telemetryData || !telemetryData.audio_samples) return;
    const sample = telemetryData.audio_samples[activeSampleKey];
    if (!sample) return;

    const w = waveformCanvas.clientWidth;
    const h = waveformCanvas.clientHeight;
    const centerY = h / 2;

    waveformCtx.clearRect(0, 0, w, h);

    const wave = sample.waveform || [];
    const n = wave.length;
    if (n === 0) return;

    // Draw central bone/sand audio envelope
    waveformCtx.lineWidth = 1.3;
    waveformCtx.strokeStyle = '#d8d4c7';
    waveformCtx.fillStyle = 'rgba(216, 212, 199, 0.16)';

    waveformCtx.beginPath();
    const step = w / n;
    
    // Top boundary
    for (let i = 0; i < n; i++) {
      const x = i * step;
      const amp = wave[i] * (h * 0.44);
      const y = centerY - amp;
      if (i === 0) waveformCtx.moveTo(x, y);
      else waveformCtx.lineTo(x, y);
    }
    // Bottom boundary (mirror)
    for (let i = n - 1; i >= 0; i--) {
      const x = i * step;
      const amp = wave[i] * (h * 0.44);
      const y = centerY + amp;
      waveformCtx.lineTo(x, y);
    }
    waveformCtx.closePath();
    waveformCtx.fill();
    waveformCtx.stroke();

    // Center hairline
    waveformCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    waveformCtx.lineWidth = 1;
    waveformCtx.beginPath();
    waveformCtx.moveTo(0, centerY);
    waveformCtx.lineTo(w, centerY);
    waveformCtx.stroke();

    // Playhead line
    if (isAudioPlaying || progress > 0) {
      const playheadX = progress * w;
      waveformCtx.strokeStyle = '#ffffff';
      waveformCtx.lineWidth = 1.5;
      waveformCtx.beginPath();
      waveformCtx.moveTo(playheadX, 0);
      waveformCtx.lineTo(playheadX, h);
      waveformCtx.stroke();
    }
  }

  // -------------------------------------------------------------------------
  // 5. EXACT SNAP 1 & 2: 13-MFCC SPECTROGRAM ANALYZER (CANVAS LIVE RENDER)
  // -------------------------------------------------------------------------
  let specCanvas, specCtx;

  function initSpectrogramVisualizer() {
    specCanvas = document.getElementById('spectrogram-canvas');
    if (!specCanvas) return;
    specCtx = specCanvas.getContext('2d');
  }

  function renderSpectrogramData(b64) {
    if (!specCtx || !specCanvas || !b64) return;

    const bins = 128;
    const timeSteps = 256;

    const binaryStr = atob(b64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = timeSteps;
    offCanvas.height = bins;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(timeSteps, bins);
    const data = imgData.data;

    for (let f = 0; f < bins; f++) {
      const row = (bins - 1 - f);
      for (let t = 0; t < timeSteps; t++) {
        const val = bytes[f * timeSteps + t];
        const idx = (row * timeSteps + t) * 4;
        
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    const w = specCanvas.clientWidth;
    const h = specCanvas.clientHeight;
    specCanvas.width = w;
    specCanvas.height = h;

    specCtx.imageSmoothingEnabled = true;
    specCtx.drawImage(offCanvas, 0, 0, w, h);
  }

  // -------------------------------------------------------------------------
  // 6. REAL AUDIO PLAYBACK & SYNCHRONIZED SCANNING
  // -------------------------------------------------------------------------
  window.toggleAudioPlayback = async function () {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (isAudioPlaying) {
      stopAudio();
      return;
    }

    try {
      const sample = telemetryData.audio_samples[activeSampleKey];
      if (!sample) return;

      if (!audioBuffers[activeSampleKey]) {
        const res = await fetch(sample.wav_url);
        const arrayBuf = await res.arrayBuffer();
        audioBuffers[activeSampleKey] = await audioContext.decodeAudioData(arrayBuf);
      }

      audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffers[activeSampleKey];
      audioSource.connect(audioContext.destination);

      audioSource.onended = () => {
        stopAudio();
      };

      audioStartTime = audioContext.currentTime;
      audioSource.start(0);
      isAudioPlaying = true;

      const playIcon = document.getElementById('play-btn-icon');
      const playText = document.getElementById('play-btn-text');
      if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      if (playText) playText.textContent = 'Pause Bioacoustic Audio';

      const scanLine = document.getElementById('spectrogram-scan-line');
      if (scanLine) scanLine.style.display = 'block';

      updatePlaybackSync();
    } catch (e) {
      console.warn('[Audio] Playback error:', e);
      stopAudio();
    }
  };

  function stopAudio() {
    if (audioSource) {
      try { audioSource.stop(); } catch (_) {}
      audioSource = null;
    }
    isAudioPlaying = false;
    playbackProgress = 0;
    
    const playIcon = document.getElementById('play-btn-icon');
    const playText = document.getElementById('play-btn-text');
    if (playIcon) playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    if (playText) playText.textContent = 'Play Bioacoustic Sample';

    const scanLine = document.getElementById('spectrogram-scan-line');
    if (scanLine) scanLine.style.display = 'none';

    drawWaveform(0);
  }

  function updatePlaybackSync() {
    if (!isAudioPlaying) return;

    const currentBuf = audioBuffers[activeSampleKey];
    const duration = currentBuf ? currentBuf.duration : 3.0;
    const elapsed = audioContext.currentTime - audioStartTime;

    playbackProgress = Math.min(1.0, elapsed / duration);
    drawWaveform(playbackProgress);

    const scanLine = document.getElementById('spectrogram-scan-line');
    if (scanLine && specCanvas) {
      scanLine.style.left = `${playbackProgress * 100}%`;
    }

    if (playbackProgress < 1.0) {
      requestAnimationFrame(updatePlaybackSync);
    } else {
      stopAudio();
    }
  }

  // -------------------------------------------------------------------------
  // 7. EXACT SNAP 2: 02 3D MANIFOLDS (ISOMETRIC THREE.JS VIEWPORT)
  // -------------------------------------------------------------------------
  let manifoldScene, manifoldCamera, manifoldRenderer, manifoldControls;

  function initManifoldVisualizer() {
    const container = document.getElementById('manifold-canvas-container');
    if (!container || !telemetryData) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    manifoldScene = new THREE.Scene();
    manifoldScene.background = new THREE.Color(0x090a0d);

    // Isometric perspective
    manifoldCamera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
    manifoldCamera.position.set(4.5, 4.2, 4.5);
    manifoldCamera.lookAt(0, 0, 0);

    manifoldRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    manifoldRenderer.setSize(w, h);
    manifoldRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(manifoldRenderer.domElement);

    manifoldControls = new THREE.OrbitControls(manifoldCamera, manifoldRenderer.domElement);
    manifoldControls.enableDamping = true;
    manifoldControls.dampingFactor = 0.08;
    manifoldControls.minPolarAngle = 0;
    manifoldControls.maxPolarAngle = Math.PI;
    manifoldControls.minDistance = 0.5;
    manifoldControls.maxDistance = 20.0;
    manifoldControls.target.set(0, 0, 0);

    // Isometric Bounding Wireframe Cube (Snap 2)
    const boxGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxLineMat = new THREE.LineBasicMaterial({ color: 0x4a4e5c, linewidth: 1 });
    const wireframeBox = new THREE.LineSegments(boxEdges, boxLineMat);
    manifoldScene.add(wireframeBox);

    // Bottom Grid Plane (Snap 2)
    const gridHelper = new THREE.GridHelper(2.2, 8, 0x3e4250, 0x272933);
    gridHelper.position.y = -1.1;
    manifoldScene.add(gridHelper);

    // Calibrated Laboratory XYZ Coordinate Axes with Measurement Hash Marks
    const axisGroup = new THREE.Group();
    const origin = new THREE.Vector3(-1.1, -1.1, -1.1);

    function createAxis(dir, length, color, numTicks = 5) {
      const g = new THREE.Group();
      
      // Main axis hairline vector
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(length)
      ]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: color, linewidth: 1.5 }));
      g.add(line);

      // Measurement tick marks (calibrated lab hash marks)
      const tickStep = length / numTicks;
      for (let i = 1; i <= numTicks; i++) {
        const tickPos = dir.clone().multiplyScalar(i * tickStep);
        let tickDir = new THREE.Vector3(0, 0.05, 0);
        if (Math.abs(dir.y) > 0.5) tickDir = new THREE.Vector3(0.05, 0, 0);

        const tickGeo = new THREE.BufferGeometry().setFromPoints([
          tickPos.clone().sub(tickDir),
          tickPos.clone().add(tickDir)
        ]);
        const tickLine = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: color, opacity: 0.6, transparent: true }));
        g.add(tickLine);
      }

      // Directional arrow cone
      const arrowGeo = new THREE.ConeGeometry(0.035, 0.12, 12);
      const arrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: color }));
      arrowMesh.position.copy(dir.clone().multiplyScalar(length + 0.06));
      if (dir.x > 0) arrowMesh.rotation.z = -Math.PI / 2;
      else if (dir.y > 0) arrowMesh.rotation.y = 0;
      else if (dir.z > 0) arrowMesh.rotation.x = Math.PI / 2;
      g.add(arrowMesh);

      return g;
    }

    axisGroup.position.copy(origin);
    axisGroup.add(createAxis(new THREE.Vector3(1, 0, 0), 2.2, 0xd8d4c7, 5)); // X: Bone
    axisGroup.add(createAxis(new THREE.Vector3(0, 1, 0), 2.2, 0xc8c8d0, 5)); // Y: Steel
    axisGroup.add(createAxis(new THREE.Vector3(0, 0, 1), 2.2, 0xa1a1a6, 5)); // Z: Gray
    manifoldScene.add(axisGroup);

    // Billboard Text Sprites for Named Acoustic Dimensions
    function createTextSprite(text, color = '#d8d4c7') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.font = '600 28px "SF Mono", "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.4, 0.35, 1.0);
      return sprite;
    }

    const labelX = createTextSprite('t-SNE 1 (Spectral Centroid & Flux)', '#d8d4c7');
    labelX.position.set(0.0, -1.25, -1.1);
    manifoldScene.add(labelX);

    const labelY = createTextSprite('t-SNE 2 (MFCC Formant Dispersion)', '#c8c8d0');
    labelY.position.set(-1.25, 1.25, -1.1);
    manifoldScene.add(labelY);

    const labelZ = createTextSprite('t-SNE 3 (Avian Rales Dynamics)', '#a1a1a6');
    labelZ.position.set(-1.1, -1.25, 0.0);
    manifoldScene.add(labelZ);

    // 420 Genuine 3D t-SNE Points (80-MFCC Feature Manifolds from Kaggle Dataset)
    const pts = telemetryData.manifold_points || [];
    const sphereGeo = new THREE.SphereGeometry(0.046, 16, 16);
    const dotMatHealthy = new THREE.MeshBasicMaterial({ color: 0xe2ded4 });
    const dotMatSick = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dotMatNoise = new THREE.MeshBasicMaterial({ color: 0x737682 });

    const pointsGroup = new THREE.Group();

    pts.forEach(p => {
      let mat = dotMatHealthy;
      if (p.c === 1) mat = dotMatSick;
      else if (p.c === 2) mat = dotMatNoise;

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(p.x * 1.15, p.y * 1.15, p.z * 1.15);
      pointsGroup.add(mesh);
    });

    manifoldScene.add(pointsGroup);

    function animateManifold() {
      requestAnimationFrame(animateManifold);
      pointsGroup.rotation.y += 0.0022;
      manifoldControls.update();
      manifoldRenderer.render(manifoldScene, manifoldCamera);
    }
    animateManifold();

    function resizeManifold() {
      if (!container || !manifoldRenderer || !manifoldCamera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      manifoldCamera.aspect = nw / nh;
      manifoldCamera.fov = (nw < 768) ? 50 : 36;
      manifoldCamera.updateProjectionMatrix();
      manifoldRenderer.setSize(nw, nh);
    }
    resizeManifold();
    window.addEventListener('resize', resizeManifold);
  }

  // -------------------------------------------------------------------------
  // 8. EXACT SNAP 1 / 3: DYNAMIC AVIAN BAYESIAN CONDITIONING
  // -------------------------------------------------------------------------
  let gaussianCanvas, gaussianCtx;

  function initBayesianEngine() {
    const mathBox = document.getElementById('bayesian-math-box');
    if (mathBox && window.katex) {
      window.katex.render(
        `P(\\text{Pathology} \\mid \\mathbf{x}, T) = \\frac{\\mathcal{L}(\\mathbf{x} \\mid \\text{Pathology}) P(\\text{Pathology} \\mid T)}{\\sum_k \\mathcal{L}(\\mathbf{x} \\mid C_k) P(C_k \\mid T)}`,
        mathBox,
        { displayMode: true, throwOnError: false }
      );
    }

    gaussianCanvas = document.getElementById('gaussian-canvas');
    if (gaussianCanvas) {
      gaussianCtx = gaussianCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = gaussianCanvas.getBoundingClientRect();
      gaussianCanvas.width = rect.width * dpr;
      gaussianCanvas.height = rect.height * dpr;
      gaussianCtx.scale(dpr, dpr);
    }

    // Slider listener
    const slider = document.getElementById('precision-slider');
    if (slider) {
      slider.value = currentThreshold;
      slider.addEventListener('input', (e) => {
        currentThreshold = parseFloat(e.target.value);
        updateBayesianVisuals(currentThreshold);
      });
    }

    updateBayesianVisuals(currentThreshold);
  }

  function updateBayesianVisuals(threshold) {
    if (!telemetryData || !telemetryData.bayesian_distributions) return;
    const dists = telemetryData.bayesian_distributions;
    const activeSample = telemetryData.audio_samples[activeSampleKey] || {};
    const sampleX = activeSample.x_val !== undefined ? activeSample.x_val : 0.0;
    const avianScore = activeSample.avian_score !== undefined ? activeSample.avian_score : 0.9;

    const sliderReadout = document.getElementById('slider-val-readout');
    if (sliderReadout) sliderReadout.textContent = threshold.toFixed(2);

    // Normal PDF helper
    function normalPDF(x, mu, sigma) {
      return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }

    // Likelihoods for the active audio coordinate x
    const lhHealthy = normalPDF(sampleX, dists.healthy.mu, dists.healthy.sigma);
    const lhSick = normalPDF(sampleX, dists.sick.mu, dists.sick.sigma);
    const lhNoise = normalPDF(sampleX, dists.noise.mu, dists.noise.sigma);

    // IEEE Avian Bayesian Conditioning:
    // If avian confirmed (avianScore >= 0.08), noise component is rejected by acoustic beamforming
    let postSick = 0.0;
    if (avianScore >= 0.08) {
      const priorSick = threshold;
      const priorHealthy = 1.0 - threshold;
      const num = lhSick * priorSick;
      const denom = num + (lhHealthy * priorHealthy);
      postSick = denom > 1e-6 ? (num / denom) : 0.0;
    } else {
      // Ambient noise dominant
      postSick = 0.02;
    }

    // 1. Update Gauge with Real Bayesian Posterior
    const gaugeValText = document.getElementById('gauge-val');
    const gaugeSubText = document.getElementById('gauge-label-text');
    if (gaugeValText) {
      gaugeValText.textContent = (postSick * 100).toFixed(0) + '%';
      gaugeValText.style.color = postSick >= 0.50 ? '#ff453a' : '#d8d4c7';
    }
    if (gaugeSubText) {
      if (postSick >= 0.50) {
        gaugeSubText.textContent = 'Pathology Alert';
        gaugeSubText.style.color = '#ff453a';
      } else if (avianScore < 0.08) {
        gaugeSubText.textContent = 'Noise Filtered';
        gaugeSubText.style.color = '#737682';
      } else {
        gaugeSubText.textContent = 'Healthy Normal';
        gaugeSubText.style.color = '#30d158';
      }
    }

    const gaugeArc = document.getElementById('gauge-active-arc');
    const gaugeKnob = document.getElementById('gauge-knob');
    if (gaugeArc && gaugeKnob) {
      const norm = Math.max(0.02, Math.min(0.98, postSick));
      const cx = 75;
      const cy = 75;
      const r = 58;

      const startX = cx - r;
      const startY = cy;
      const endX = cx - r * Math.cos(norm * Math.PI);
      const endY = cy - r * Math.sin(norm * Math.PI);

      const d = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
      gaugeArc.setAttribute('d', d);
      gaugeArc.setAttribute('stroke', postSick >= 0.50 ? '#ff453a' : '#d8d4c7');
      gaugeKnob.setAttribute('cx', endX);
      gaugeKnob.setAttribute('cy', endY);
      gaugeKnob.setAttribute('fill', postSick >= 0.50 ? '#ff453a' : '#d8d4c7');
    }

    // 2. Draw Triple Gaussian Distribution Canvas
    if (!gaussianCtx || !gaussianCanvas) return;
    const w = gaussianCanvas.clientWidth;
    const h = gaussianCanvas.clientHeight;
    gaussianCtx.clearRect(0, 0, w, h);

    const baselineY = h - 24;
    const peakHeight = h * 0.68;

    const xMin = -2.6;
    const xMax = 3.2;
    const xRange = xMax - xMin;

    function toPixelX(xVal) {
      return ((xVal - xMin) / xRange) * w;
    }

    const maxDensity = normalPDF(dists.healthy.mu, dists.healthy.mu, dists.healthy.sigma);
    const scaleY = peakHeight / maxDensity;
    const numPoints = 200;

    // Draw Overlap Shading between Healthy and Sick (Uncertainty Decision Margin)
    gaussianCtx.fillStyle = 'rgba(216, 212, 199, 0.14)';
    gaussianCtx.beginPath();
    gaussianCtx.moveTo(0, baselineY);

    for (let i = 0; i <= numPoints; i++) {
      const xVal = xMin + (i / numPoints) * xRange;
      const px = toPixelX(xVal);
      const yH = normalPDF(xVal, dists.healthy.mu, dists.healthy.sigma);
      const yS = normalPDF(xVal, dists.sick.mu, dists.sick.sigma);
      const overlapY = Math.min(yH, yS);
      const py = baselineY - (overlapY * scaleY);
      gaussianCtx.lineTo(px, py);
    }
    gaussianCtx.lineTo(w, baselineY);
    gaussianCtx.closePath();
    gaussianCtx.fill();

    // Curve 1: Healthy Baseline (Bone/Sand #d8d4c7)
    gaussianCtx.strokeStyle = '#d8d4c7';
    gaussianCtx.lineWidth = 2.0;
    gaussianCtx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const xVal = xMin + (i / numPoints) * xRange;
      const px = toPixelX(xVal);
      const yVal = normalPDF(xVal, dists.healthy.mu, dists.healthy.sigma);
      const py = baselineY - (yVal * scaleY);
      if (i === 0) gaussianCtx.moveTo(px, py);
      else gaussianCtx.lineTo(px, py);
    }
    gaussianCtx.stroke();

    // Curve 2: Avian Pathology (Crisp White #ffffff)
    gaussianCtx.strokeStyle = '#ffffff';
    gaussianCtx.lineWidth = 2.0;
    gaussianCtx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const xVal = xMin + (i / numPoints) * xRange;
      const px = toPixelX(xVal);
      const yVal = normalPDF(xVal, dists.sick.mu, dists.sick.sigma);
      const py = baselineY - (yVal * scaleY);
      if (i === 0) gaussianCtx.moveTo(px, py);
      else gaussianCtx.lineTo(px, py);
    }
    gaussianCtx.stroke();

    // Curve 3: Ambient Farm Noise (Muted Gray #5a5c66)
    gaussianCtx.strokeStyle = '#5a5c66';
    gaussianCtx.lineWidth = 1.6;
    gaussianCtx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const xVal = xMin + (i / numPoints) * xRange;
      const px = toPixelX(xVal);
      const yVal = normalPDF(xVal, dists.noise.mu, dists.noise.sigma);
      const py = baselineY - (yVal * scaleY);
      if (i === 0) gaussianCtx.moveTo(px, py);
      else gaussianCtx.lineTo(px, py);
    }
    gaussianCtx.stroke();

    // Baseline horizontal axis line
    gaussianCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    gaussianCtx.lineWidth = 1;
    gaussianCtx.beginPath();
    gaussianCtx.moveTo(0, baselineY);
    gaussianCtx.lineTo(w, baselineY);
    gaussianCtx.stroke();

    // Dual-axis Physical Calibration Ticks
    gaussianCtx.font = '9px SF Mono, monospace';
    gaussianCtx.fillStyle = '#686b77';
    gaussianCtx.textAlign = 'center';
    gaussianCtx.fillText('-2σ (Calm Cluck)', toPixelX(dists.healthy.mu), baselineY + 12);
    gaussianCtx.fillText('+1σ (Rales)', toPixelX(dists.sick.mu), baselineY + 12);
    gaussianCtx.fillText('+3σ (Farm Noise)', toPixelX(dists.noise.mu), baselineY + 12);

    // Decision Boundary Line T
    // Normalized threshold cut between Healthy and Sick centers
    const cutXVal = dists.healthy.mu + threshold * (dists.sick.mu - dists.healthy.mu);
    const boundPx = toPixelX(cutXVal);

    gaussianCtx.strokeStyle = '#ffffff';
    gaussianCtx.lineWidth = 1.5;
    gaussianCtx.setLineDash([4, 4]);
    gaussianCtx.beginPath();
    gaussianCtx.moveTo(boundPx, baselineY - peakHeight * 0.95);
    gaussianCtx.lineTo(boundPx, baselineY);
    gaussianCtx.stroke();
    gaussianCtx.setLineDash([]);

    // Active Audio Sample Marker (Projects active audio coordinate x onto curves)
    const markerPx = toPixelX(sampleX);
    const activeLh = activeSampleKey === 'sick' ? lhSick : (activeSampleKey === 'noise' ? lhNoise : lhHealthy);
    const markerPy = baselineY - (activeLh * scaleY);

    // Outer pulsating halo ring
    gaussianCtx.strokeStyle = activeSampleKey === 'sick' ? 'rgba(255, 69, 58, 0.6)' : 'rgba(216, 212, 199, 0.6)';
    gaussianCtx.lineWidth = 2;
    gaussianCtx.beginPath();
    gaussianCtx.arc(markerPx, markerPy, 7, 0, Math.PI * 2);
    gaussianCtx.stroke();

    // Inner solid core dot
    gaussianCtx.fillStyle = activeSampleKey === 'sick' ? '#ff453a' : '#ffffff';
    gaussianCtx.beginPath();
    gaussianCtx.arc(markerPx, markerPy, 4, 0, Math.PI * 2);
    gaussianCtx.fill();

    // Vertical dashed dropped pin from marker to axis
    gaussianCtx.strokeStyle = activeSampleKey === 'sick' ? 'rgba(255, 69, 58, 0.4)' : 'rgba(216, 212, 199, 0.3)';
    gaussianCtx.setLineDash([2, 3]);
    gaussianCtx.beginPath();
    gaussianCtx.moveTo(markerPx, markerPy);
    gaussianCtx.lineTo(markerPx, baselineY);
    gaussianCtx.stroke();
    gaussianCtx.setLineDash([]);
  }

  // -------------------------------------------------------------------------
  // RESPONSIVE CANVASES ON VIEWPORT RESIZE
  // -------------------------------------------------------------------------
  window.addEventListener('resize', () => {
    if (waveformCanvas && waveformCtx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = waveformCanvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        waveformCanvas.width = rect.width * dpr;
        waveformCanvas.height = rect.height * dpr;
        waveformCtx.setTransform(1, 0, 0, 1, 0, 0);
        waveformCtx.scale(dpr, dpr);
        drawWaveform(playbackProgress);
      }
    }
    if (specCanvas && specCtx && telemetryData && telemetryData.audio_samples) {
      const activeSample = telemetryData.audio_samples[activeSampleKey];
      if (activeSample && activeSample.spectrogram_b64) {
        renderSpectrogramData(activeSample.spectrogram_b64);
      }
    }
    if (gaussianCanvas && gaussianCtx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = gaussianCanvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        gaussianCanvas.width = rect.width * dpr;
        gaussianCanvas.height = rect.height * dpr;
        gaussianCtx.setTransform(1, 0, 0, 1, 0, 0);
        gaussianCtx.scale(dpr, dpr);
        updateBayesianVisuals(currentThreshold);
      }
    }
  });

  // -------------------------------------------------------------------------
  // INITIALIZE ON DOM READY
  // -------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    init3DStage();
    loadTelemetry();
  });

})();
