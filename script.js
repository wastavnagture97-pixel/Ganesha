/**
 * 🕉️ Lord Ganesha Particle Art Visualizer
 * Web Edition for GitHub Pages
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

    const bgCtx = bgCanvas.getContext('2d');
    const artCtx = artCanvas.getContext('2d');
    const particleCtx = particleCanvas.getContext('2d');

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
    let lastTime = 0;

    // Simulation Data
    let outlineTargets = [];
    let revealTargets = [];
    let flameCenters = [];
    let activeParticles = [];
    let bgParticles = [];
    let revealColorCanvas = null;

    const TILE_SIZE = 2;

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

        // Maintain center crop / fill
        const imgAspect = img.width / img.height;
        const screenAspect = screenW / screenH;
        let drawW, drawH, drawX, drawY;

        if (screenAspect > imgAspect) {
            drawW = screenW;
            drawH = screenW / imgAspect;
            drawX = 0;
            drawY = (screenH - drawH) / 2;
        } else {
            drawH = screenH;
            drawW = screenH * imgAspect;
            drawX = (screenW - drawW) / 2;
            drawY = 0;
        }

        offCtx.drawImage(img, drawX, drawY, drawW, drawH);
        const imgData = offCtx.getImageData(0, 0, screenW, screenH);
        const data = imgData.data;

        // Grayscale conversion
        const gray = new Uint8Array(screenW * screenH);
        for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // Sobel Edge Filter
        const outlines = [];
        const threshold = 38;

        for (let y = 1; y < screenH - 1; y += 1) {
            for (let x = 1; x < screenW - 1; x += 1) {
                const idx = y * screenW + x;

                const gx =
                    -gray[idx - screenW - 1] + gray[idx - screenW + 1] +
                    -2 * gray[idx - 1]       + 2 * gray[idx + 1] +
                    -gray[idx + screenW - 1] + gray[idx + screenW + 1];

                const gy =
                    -gray[idx - screenW - 1] - 2 * gray[idx - screenW] - gray[idx - screenW + 1] +
                     gray[idx + screenW - 1] + 2 * gray[idx + screenW] + gray[idx + screenW + 1];

                const mag = Math.sqrt(gx * gx + gy * gy);
                if (mag > threshold) {
                    outlines.push({ x, y });
                }
            }
        }

        // Tile Reveal Targets
        const reveals = [];
        for (let y = 0; y < screenH; y += TILE_SIZE) {
            for (let x = 0; x < screenW; x += TILE_SIZE) {
                reveals.push({ x, y });
            }
        }

        // Bottom targets pop first
        outlines.sort((a, b) => a.y - b.y);
        reveals.sort((a, b) => a.y - b.y);

        // Flame coordinates
        const flameRatios = [
            [0.244, 0.548], [0.287, 0.525], [0.332, 0.548],
            [0.668, 0.548], [0.713, 0.525], [0.756, 0.548]
        ];
        const flames = flameRatios.map(([rx, ry]) => ({
            x: Math.round(screenW * rx),
            y: Math.round(screenH * ry)
        }));

        return {
            revealCanvas: offCanvas,
            outlines,
            reveals,
            flames
        };
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        [bgCanvas, artCanvas, particleCanvas].forEach(c => {
            c.width = width;
            c.height = height;
        });

        if (window.sourceImg && window.sourceImg.complete) {
            const data = analyzeImage(window.sourceImg, width, height);
            revealColorCanvas = data.revealCanvas;
            outlineTargets = data.outlines;
            revealTargets = data.reveals;
            flameCenters = data.flames;
            activeParticles = [];
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
        flameCenters.forEach((center, i) => {
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
        });
    }

    // Main Animation Frame
    function update(timestamp) {
        if (!isRunning) return;

        bgCtx.fillStyle = '#050205';
        bgCtx.fillRect(0, 0, width, height);

        particleCtx.clearRect(0, 0, width, height);

        // Phase 1 Aura
        if (phase === 1) {
            drawPastelAura(bgCtx, timestamp);
        }

        // Update Active Particles
        const surviving = [];
        for (let i = 0; i < activeParticles.length; i++) {
            const p = activeParticles[i];

            if (p.state === 'falling') {
                p.y += p.speed * 2;
                if (p.y >= height) {
                    p.y = height;
                    p.state = 'rising';
                }

                // Render falling particle
                if (p.type === 'tile') {
                    if (revealColorCanvas) {
                        particleCtx.drawImage(
                            revealColorCanvas,
                            p.targetX, p.targetY, TILE_SIZE, TILE_SIZE,
                            p.x, Math.floor(p.y), TILE_SIZE, TILE_SIZE
                        );
                    }
                } else if (p.type === 'outline') {
                    particleCtx.fillStyle = '#ffd700';
                    particleCtx.fillRect(p.targetX, Math.floor(p.y), 1.5, 1.5);
                }
                surviving.push(p);
            } else if (p.state === 'rising') {
                p.y -= p.speed;
                if (p.y <= p.targetY) {
                    // Lock permanently into artCanvas
                    if (p.type === 'tile') {
                        if (revealColorCanvas) {
                            artCtx.drawImage(
                                revealColorCanvas,
                                p.targetX, p.targetY, TILE_SIZE, TILE_SIZE,
                                p.targetX, p.targetY, TILE_SIZE, TILE_SIZE
                            );
                        }
                    } else if (p.type === 'outline') {
                        artCtx.fillStyle = '#ffd700';
                        artCtx.fillRect(p.targetX, p.targetY, 1.5, 1.5);
                    }
                } else {
                    // Still rising
                    if (p.type === 'tile') {
                        if (revealColorCanvas) {
                            particleCtx.drawImage(
                                revealColorCanvas,
                                p.targetX, p.targetY, TILE_SIZE, TILE_SIZE,
                                p.x, Math.floor(p.y), TILE_SIZE, TILE_SIZE
                            );
                        }
                    } else if (p.type === 'outline') {
                        particleCtx.fillStyle = '#ffd700';
                        particleCtx.fillRect(p.targetX, Math.floor(p.y), 1.5, 1.5);
                    }
                    surviving.push(p);
                }
            }
        }
        activeParticles = surviving;

        // Spawn Phase 1 (Outline Assembly) - 1.5x speed (1200 particles/batch)
        if (phase === 1) {
            for (let i = 0; i < 1200; i++) {
                if (outlineTargets.length > 0) {
                    const t = outlineTargets.pop();
                    activeParticles.push({
                        type: 'outline',
                        x: t.x,
                        y: Math.random() * -150 - 10,
                        targetX: t.x,
                        targetY: t.y,
                        speed: 6.0 + Math.random() * 7.5,
                        state: 'falling'
                    });
                }
            }
            if (outlineTargets.length === 0 && activeParticles.length === 0) {
                phase = 2;
            }
        }
        // Spawn Phase 2 (Tile Color Reveal) - 1.5x speed (900 particles/batch)
        else if (phase === 2) {
            for (let i = 0; i < 900; i++) {
                if (revealTargets.length > 0) {
                    const t = revealTargets.pop();
                    activeParticles.push({
                        type: 'tile',
                        x: t.x,
                        y: Math.random() * -250 - 10,
                        targetX: t.x,
                        targetY: t.y,
                        speed: 6.0 + Math.random() * 9.0,
                        state: 'falling'
                    });
                }
            }
            if (revealTargets.length === 0 && activeParticles.length === 0) {
                phase = 3;
            }
        }

        // Phase 3 Flame Glows
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

        const survivingBg = [];
        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.y += p.speedY;
            const drawX = p.x + Math.sin(timestamp * p.wobbleSpeed + p.wobbleOffset) * p.wobbleWidth * 20;

            if (p.y < height + 30) {
                particleCtx.drawImage(p.sprite, Math.floor(drawX), Math.floor(p.y));
                survivingBg.push(p);
            }
        }
        bgParticles = survivingBg;

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
