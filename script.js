/**
 * 🕉️ Lord Ganesha Particle Art Visualizer
 * High-Performance Web Edition for GitHub Pages
 * 
 * Author: Wastav Nagture
 * Portfolio: https://wastavnagture97-pixel.github.io/
 * GitHub: https://github.com/wastavnagture97-pixel
 */

(() => {
    'use strict';

    // Canvas Layers
    const bgCanvas = document.getElementById('bg-canvas');
    const artCanvas = document.getElementById('art-canvas');
    const particleCanvas = document.getElementById('particle-canvas');

    const bgCtx = bgCanvas.getContext('2d', { alpha: false });
    const artCtx = artCanvas.getContext('2d', { willReadFrequently: true });
    const particleCtx = particleCanvas.getContext('2d', { willReadFrequently: true });

    // UI Elements
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const bgAudio = document.getElementById('bg-audio');
    const btnSound = document.getElementById('btn-sound');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnInfo = document.getElementById('btn-info');
    const watermarkBadge = document.getElementById('watermark-badge');
    const wmAudioStatus = document.getElementById('wm-audio-status');
    const infoModal = document.getElementById('info-modal');
    const modalClose = document.getElementById('modal-close');

    let width = window.innerWidth;
    let height = window.innerHeight;
    let isMuted = false;
    let isRunning = false;
    let phase = 1; // 1: Outline assembly, 2: Tile color fill, 3: Full glory with Diyas
let lastFrameTime = 0;
let fps = 60; // target FPS

    // High-Performance Direct Pixel Buffers (TypedArrays)
    let particleImageData = null;
    let particleBuf32 = null;

    let artImageData = null;
    let artBuf32 = null;

    let sourceImageData = null;
    let sourceBuf32 = null;

    // Simulation Data
    let outlineTargets = [];
    let revealTargets = [];
    let flameCenters = [];
    let activeParticles = [];
    let bgParticles = [];

    const TILE_SIZE = 2;
    const GOLD_ABGR = 0xFF00D7FF; // 0xAABBGGRR: Alpha 255, Blue 0, Green 215, Red 255

    // Pre-generated Flower & Glitter Sprites
    const flowerSprites = [];
    const glitterSprites = [];

    function createFlowerSprite(baseColor, size = 14) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const center = size / 2;
        const petalRadius = Math.max(2, size / 3);

        for (let angle = 0; angle < 360; angle += 45) {
            const rad = (angle * Math.PI) / 180;
            const px = center + Math.cos(rad) * (size / 3.5);
            const py = center + Math.sin(rad) * (size / 3.5);

            ctx.beginPath();
            ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
        }

        // Flower Center
        ctx.beginPath();
        ctx.arc(center, center, Math.max(2, petalRadius - 1), 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(255, 215, 0)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(center, center, Math.max(1, petalRadius - 2), 0, Math.PI * 2);
        ctx.fillStyle = 'rgb(255, 100, 0)';
        ctx.fill();

        return c;
    }

    function createGlowParticleSprite(color, size = 6) {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const center = size / 2;

        const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
        grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

        ctx.beginPath();
        ctx.arc(center, center, center, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        return c;
    }

    function initSprites() {
        flowerSprites.push(
            createFlowerSprite('rgb(255, 20, 147)', 14), // Pink
            createFlowerSprite('rgb(0, 220, 120)', 14),  // Green
            createFlowerSprite('rgb(65, 130, 255)', 14), // Blue
            createFlowerSprite('rgb(255, 215, 0)', 14)   // Gold
        );

        glitterSprites.push(
            createGlowParticleSprite('rgb(255, 215, 0)', 6),
            createGlowParticleSprite('rgb(255, 255, 255)', 5)
        );
    }

    // Image Edge Detection & Analysis
    function analyzeImage(img, screenW, screenH) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = screenW;
        offCanvas.height = screenH;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        // Maintain center crop / cover
        const imgAspect = img.width / img.height;
        const screenAspect = screenW / screenH;
        let drawW, drawH, drawX, drawY;

        if (screenAspect > imgAspect) {
            drawW = screenW;
            drawH = Math.round(screenW / imgAspect);
            drawX = 0;
            drawY = Math.round((screenH - drawH) / 2);
        } else {
            drawH = screenH;
            drawW = Math.round(screenH * imgAspect);
            drawX = Math.round((screenW - drawW) / 2);
            drawY = 0;
        }

        offCtx.drawImage(img, drawX, drawY, drawW, drawH);
        sourceImageData = offCtx.getImageData(0, 0, screenW, screenH);
        sourceBuf32 = new Uint32Array(sourceImageData.data.buffer);

        const data = sourceImageData.data;

        // Grayscale conversion for edge detection
        const gray = new Uint8Array(screenW * screenH);
        for (let i = 0; i < data.length; i += 4) {
            gray[i >> 2] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
        }

        // Sobel Edge Filter
        const outlines = [];
        const threshold = 38;

        for (let y = 1; y < screenH - 1; y += 1) {
            const rowOffset = y * screenW;
            const topOffset = (y - 1) * screenW;
            const botOffset = (y + 1) * screenW;

            for (let x = 1; x < screenW - 1; x += 1) {
                const gx =
                    -gray[topOffset + x - 1] + gray[topOffset + x + 1] +
                    -2 * gray[rowOffset + x - 1] + 2 * gray[rowOffset + x + 1] +
                    -gray[botOffset + x - 1] + gray[botOffset + x + 1];

                const gy =
                    -gray[topOffset + x - 1] - 2 * gray[topOffset + x] - gray[topOffset + x + 1] +
                     gray[botOffset + x - 1] + 2 * gray[botOffset + x] + gray[botOffset + x + 1];

                const mag = Math.hypot(gx, gy);
                if (mag > threshold) {
                    outlines.push({ x, y });
                }
            }
        }

        // Tile Reveal Targets (2x2 blocks)
        const reveals = [];
        for (let y = 0; y < screenH; y += TILE_SIZE) {
            for (let x = 0; x < screenW; x += TILE_SIZE) {
                reveals.push({ x, y });
            }
        }

        // Sort ascending so bottom targets (.pop()) are reconstructed first
        outlines.sort((a, b) => a.y - b.y);
        reveals.sort((a, b) => a.y - b.y);

        // Flame coordinates aligned with drawn image
        const flameRatios = [
            [0.244, 0.548], [0.287, 0.525], [0.332, 0.548],
            [0.668, 0.548], [0.713, 0.525], [0.756, 0.548]
        ];
        const flames = flameRatios.map(([rx, ry]) => ({
            x: Math.round(drawX + drawW * rx),
            y: Math.round(drawY + drawH * ry)
        }));

        return { outlines, reveals, flames };
    }

    function initPixelBuffers() {
        particleImageData = particleCtx.createImageData(width, height);
        particleBuf32 = new Uint32Array(particleImageData.data.buffer);

        artImageData = artCtx.createImageData(width, height);
        artBuf32 = new Uint32Array(artImageData.data.buffer);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        [bgCanvas, artCanvas, particleCanvas].forEach(c => {
            c.width = width;
            c.height = height;
        });

        initPixelBuffers();

        if (window.sourceImg && window.sourceImg.complete) {
            const data = analyzeImage(window.sourceImg, width, height);
            outlineTargets = data.outlines;
            revealTargets = data.reveals;
            flameCenters = data.flames;
            activeParticles = [];
            bgParticles = [];
            phase = 1;
            artCtx.clearRect(0, 0, width, height);
        }
    }

    window.addEventListener('resize', resize);

    // Render Glossy Pastel Aura (Phase 1)
    function drawPastelAura(ctx, time) {
        const cx = width / 2;
        const cy = height * 0.45;
        const maxR = Math.hypot(cx, cy);
        const hue = Math.floor(time / 20) % 360;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0, `hsla(${hue}, 45%, 75%, 0.45)`);
        grad.addColorStop(0.5, `hsla(${hue}, 35%, 60%, 0.2)`);
        grad.addColorStop(1, 'rgba(5, 2, 8, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    // Diya Flame Glows (Phase 3)
    function drawFlames(ctx, time) {
        for (let i = 0; i < flameCenters.length; i++) {
            const center = flameCenters[i];
            const pulse = Math.sin(time * 0.009 + i);
            const radius = Math.max(6, 12 + pulse * 5);
            const alpha = 0.65 + pulse * 0.25;

            const shakeX = center.x + (Math.random() - 0.5) * 1.2;
            const shakeY = center.y + (Math.random() - 0.5) * 1.2;

            const grad = ctx.createRadialGradient(shakeX, shakeY, 0, shakeX, shakeY, radius * 2.2);
            grad.addColorStop(0, `rgba(255, 255, 220, ${alpha})`);
            grad.addColorStop(0.35, `rgba(255, 180, 50, ${alpha * 0.7})`);
            grad.addColorStop(0.7, `rgba(255, 80, 0, ${alpha * 0.3})`);
            grad.addColorStop(1, 'rgba(255, 50, 0, 0)');

            ctx.beginPath();
            ctx.arc(shakeX, shakeY, radius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // Main Ultra-High-Performance Animation Loop
    function update(timestamp) {
        if (!isRunning) return;

        // Frame timing and FPS calculation
        const now = timestamp;
        const delta = now - (lastFrameTime || now);
        fps = 1000 / delta;
        lastFrameTime = now;

        // Background layer
        bgCtx.fillStyle = '#050205';
        bgCtx.fillRect(0, 0, width, height);

        if (phase === 1) {
            drawPastelAura(bgCtx, timestamp);
        }

        // Fast zero-fill active particle buffer
        // Fast zero-fill active particle buffer
        particleBuf32.fill(0);

        let artDirty = false;

        // Phase 1 Spawning: Gold Outlines — direct top-to-target, no floor bounce
        if (phase === 1) {
            // Dump ALL remaining outlines in one shot each frame — no cap needed
            const spawnCount = outlineTargets.length;
            for (let i = 0; i < spawnCount; i++) {
                const t = outlineTargets.pop();
                // Write directly to artBuf32 — instant placement, no flying
                const tx = t.x, ty = t.y;
                if (ty >= 0 && ty < height && tx >= 0 && tx < width) {
                    artBuf32[ty * width + tx] = GOLD_ABGR;
                    if (tx + 1 < width) artBuf32[ty * width + tx + 1] = GOLD_ABGR;
                }
            }
            if (outlineTargets.length === 0) {
                artCtx.putImageData(artImageData, 0, 0);
                phase = 2;
            }
        }
        // Phase 2 Spawning: Full-Color Image Tiles — direct placement in large batches
        else if (phase === 2) {
            if (activeParticles.length < 12000) {
                // Spawn a HUGE batch every frame
                const batchSize = Math.min(Math.max(5000, Math.floor((width * height) / 20000)), revealTargets.length);
                for (let i = 0; i < batchSize; i++) {
                    const t = revealTargets.pop();
                    activeParticles.push({
                        type: 2,
                        y: t.y - Math.random() * 120 - 20, // start just above target
                        targetX: t.x,
                        targetY: t.y,
                        speed: 28.0 + Math.random() * 28.0  // very fast
                    });
                }
            }
            if (revealTargets.length === 0 && activeParticles.length === 0) {
                phase = 3;
                if (sourceImageData) {
                    artCtx.putImageData(sourceImageData, 0, 0);
                }
            }
        }

        // In-place Zero-Allocation Particle Update Loop (O(1) swap-and-pop)
        let count = activeParticles.length;
        const w = width;
        const h = height;

        for (let i = 0; i < count; i++) {
            const p = activeParticles[i];

            // Move downward toward target
            p.y += p.speed;

            if (p.y >= p.targetY) {
                // Reached destination — write permanently to artBuf32
                const tx = p.targetX;
                const ty = p.targetY;
                if (ty >= 0 && ty < h && tx >= 0 && tx < w && sourceBuf32) {
                    const targetIdx = ty * w + tx;
                    const col = sourceBuf32[targetIdx];
                    artBuf32[targetIdx] = col;
                    if (tx + 1 < w) artBuf32[targetIdx + 1] = col;
                    if (ty + 1 < h) {
                        artBuf32[targetIdx + w] = col;
                        if (tx + 1 < w) artBuf32[targetIdx + w + 1] = col;
                    }
                }
                artDirty = true;

                // O(1) remove
                activeParticles[i] = activeParticles[count - 1];
                activeParticles.pop();
                count--;
                i--;
            } else {
                // Still falling — render in motion
                const py = p.y | 0;
                const px = p.targetX;
                if (py >= 0 && py < h && px >= 0 && px < w && sourceBuf32) {
                    const col = sourceBuf32[p.targetY * w + px];
                    const drawIdx = py * w + px;
                    particleBuf32[drawIdx] = col;
                    if (px + 1 < w) particleBuf32[drawIdx + 1] = col;
                    if (py + 1 < h) {
                        particleBuf32[drawIdx + w] = col;
                        if (px + 1 < w) particleBuf32[drawIdx + w + 1] = col;
                    }
                }
            }
        }

        // Single instant draw call for all flying particles
        particleCtx.putImageData(particleImageData, 0, 0);

        // Update permanent art canvas when new particles land
        if (artDirty && phase < 3) {
            artCtx.putImageData(artImageData, 0, 0);
        }

        // Phase 3: Divine Diya Flame Glows
        if (phase >= 3) {
            drawFlames(particleCtx, timestamp);
        }

        // Ambient Falling Flowers & Glitter Rain (Phase >= 2)
        if (phase >= 2 && Math.random() < 0.12) {
            const isFlower = Math.random() < 0.55;
            const sprite = isFlower
                ? flowerSprites[Math.floor(Math.random() * flowerSprites.length)]
                : glitterSprites[Math.floor(Math.random() * glitterSprites.length)];

            bgParticles.push({
                sprite,
                x: Math.random() * width,
                y: -30,
                speedY: isFlower ? 1.8 + Math.random() * 2.0 : 1.5 + Math.random() * 3.5,
                wobbleSpeed: 0.003 + Math.random() * 0.004,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleWidth: isFlower ? 0.8 + Math.random() * 1.0 : 0.1 + Math.random() * 0.3
            });
        }

        let bgCount = bgParticles.length;
        for (let i = 0; i < bgCount; i++) {
            const p = bgParticles[i];
            p.y += p.speedY;
            const drawX = p.x + Math.sin(timestamp * p.wobbleSpeed + p.wobbleOffset) * p.wobbleWidth * 20;

            if (p.y < height + 30) {
                particleCtx.drawImage(p.sprite, Math.floor(drawX), Math.floor(p.y));
            } else {
                bgParticles[i] = bgParticles[bgCount - 1];
                bgParticles.pop();
                bgCount--;
                i--;
            }
        }

        requestAnimationFrame(update);
    }

    // Audio & Interaction Controls
    function toggleAudio() {
        isMuted = !isMuted;
        if (isMuted) {
            bgAudio.pause();
            iconSoundOn.classList.add('hidden');
            iconSoundOff.classList.remove('hidden');
            wmAudioStatus.textContent = '[M] Audio 🔇';
        } else {
            bgAudio.play().catch(() => {});
            iconSoundOff.classList.add('hidden');
            iconSoundOn.classList.remove('hidden');
            wmAudioStatus.textContent = '[M] Audio 🎵';
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    function toggleInfoModal(forceState) {
        if (typeof forceState === 'boolean') {
            infoModal.classList.toggle('hidden', !forceState);
        } else {
            infoModal.classList.toggle('hidden');
        }
    }

    // Event Listeners
    startBtn.addEventListener('click', () => {
        startOverlay.classList.add('hidden');
        isRunning = true;
        bgAudio.volume = 0.85;
        bgAudio.play().catch(e => console.log('Audio autoplay prevented:', e));
        requestAnimationFrame(update);
    });

    btnSound.addEventListener('click', toggleAudio);
    btnFullscreen.addEventListener('click', toggleFullscreen);
    btnInfo.addEventListener('click', () => toggleInfoModal(true));
    watermarkBadge.addEventListener('click', () => toggleInfoModal(true));
    modalClose.addEventListener('click', () => toggleInfoModal(false));

    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) toggleInfoModal(false);
    });

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'i' || key === 'h') {
            toggleInfoModal();
        } else if (key === 'm') {
            toggleAudio();
        } else if (key === 'f') {
            toggleFullscreen();
        } else if (e.key === 'Escape') {
            toggleInfoModal(false);
        }
    });

    // Initialize System
    initSprites();
    resize();

    const img = new Image();
    img.src = 'image.png';
    img.onload = () => {
        window.sourceImg = img;
        resize();
    };

    console.log(`
==============================================================
  🕉️  LORD GANESHA PARTICLE ART VISUALIZER
  Passionately built by Wastav Nagture
  Portfolio : https://wastavnagture97-pixel.github.io/
  GitHub    : https://github.com/wastavnagture97-pixel
==============================================================
    `);
})();
