/* ui.js — Toast, Hero Canvas, Lazy, Nav, Observers */

/* ── Toast ── */
const toastEl = document.getElementById('toast');
let toastTimer;
export function showToast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ══════════════════════════════════════════════
   MELHORIA 8 — Som de feedback (Web Audio API)
   Toque suave ao adicionar produto ao carrinho
══════════════════════════════════════════════ */
export function playSfx() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Nota 1 — tique suave
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.connect(g1); g1.connect(ctx.destination);
        o1.type = 'sine';
        o1.frequency.setValueAtTime(880, ctx.currentTime);
        o1.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
        g1.gain.setValueAtTime(0.18, ctx.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        o1.start(ctx.currentTime);
        o1.stop(ctx.currentTime + 0.18);
        // Nota 2 — harmônico mais suave
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(1320, ctx.currentTime + 0.06);
        g2.gain.setValueAtTime(0.09, ctx.currentTime + 0.06);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        o2.start(ctx.currentTime + 0.06);
        o2.stop(ctx.currentTime + 0.28);
    } catch (e) { /* silencia se não suportado */ }
}



/* ── Navbar scroll ── */
export function initNavbar() {
    const nav = document.getElementById('navbar');
    const ham = document.getElementById('hamburger');
    const mob = document.getElementById('mobile-nav');
    const links = document.querySelectorAll('.nav-link, .mobile-nav-link');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        updateActiveLink();
    }, { passive: true });

    ham.addEventListener('click', () => {
        const open = mob.classList.toggle('open');
        ham.classList.toggle('open', open);
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            mob.classList.remove('open');
            ham.classList.remove('open');
        });
    });

    function updateActiveLink() {
        const sections = ['home', 'loja', 'sobre', 'contato'];
        let cur = 'home';
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el && window.scrollY >= el.offsetTop - 90) cur = id;
        });
        links.forEach(l => {
            const href = l.getAttribute('href')?.replace('#', '');
            l.classList.toggle('active', href === cur);
        });
    }
}

/* ── Lazy Loading ── */
export function initLazyLoad() {
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries, o) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    img.classList.add('lazy');
                    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
                }
                o.unobserve(img);
            });
        }, { rootMargin: '200px' });
        document.querySelectorAll('img[data-src]').forEach(img => obs.observe(img));
    } else {
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

/* ── Scroll Reveal ── */
export function initScrollReveal() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.animationPlayState = 'running';
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => {
        el.style.animationPlayState = 'paused';
        obs.observe(el);
    });
}

/* ═══════════════════════════════════════════════════
   HERO — Elegant Organic Canvas (pure 2D, no Three.js)
   Formas suaves: orbs com gradiente, pontos brilhantes,
   linhas curvas fluidas, parallax no mouse.
   Leve e otimizado para mobile.
═══════════════════════════════════════════════════ */
export function initHero3D() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, dpr;
    let animId;
    const mouse = { x: 0.5, y: 0.5 };
    const lerpMouse = { x: 0.5, y: 0.5 };
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PALETTE = [
        { r: 200, g: 133, b: 106 },  // rose
        { r: 201, g: 169, b: 110 },  // gold
        { r: 232, g: 185, b: 168 },  // rose-lt
        { r: 232, g: 213, b: 176 },  // gold-lt
        { r: 255, g: 248, b: 236 },  // ivory warm
    ];

    let orbs = [], dots = [], curves = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.offsetWidth;
        H = canvas.offsetHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        build();
    }

    function build() {
        const isMobile = W < 600;

        // Orbs atmosféricos
        const orbN = isMobile ? 4 : 7;
        orbs = Array.from({ length: orbN }, (_, i) => {
            const c = PALETTE[i % PALETTE.length];
            return {
                bx: Math.random(), by: Math.random(),
                r: (0.18 + Math.random() * 0.3) * Math.min(W, H),
                op: 0.04 + Math.random() * 0.05,
                spd: 0.00025 + Math.random() * 0.0004,
                ph: Math.random() * Math.PI * 2,
                c, px: 0.02 + Math.random() * 0.04,
            };
        });

        // Pontos brilhantes (sempre círculos, nunca quadrados)
        const dotN = isMobile ? 50 : 100;
        dots = Array.from({ length: dotN }, () => {
            const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            const big = Math.random() < 0.1;
            return {
                bx: Math.random(), by: Math.random(),
                size: big ? 1.4 + Math.random() * 1.2 : 0.3 + Math.random() * 0.85,
                op: 0.15 + Math.random() * 0.6,
                spdX: 0.0005 + Math.random() * 0.001,
                spdY: 0.0004 + Math.random() * 0.0009,
                phX: Math.random() * Math.PI * 2,
                phY: Math.random() * Math.PI * 2,
                c, px: 0.01 + Math.random() * 0.04,
                twSpd: 0.006 + Math.random() * 0.014,
                twPh: Math.random() * Math.PI * 2,
                glow: Math.random() < 0.2,
            };
        });

        // Linhas curvas fluidas
        const curveN = isMobile ? 3 : 5;
        curves = Array.from({ length: curveN }, (_, i) => {
            const c = PALETTE[i % 2 === 0 ? 0 : 1];
            return {
                pts: Array.from({ length: 5 }, () => ({
                    x: Math.random(), y: Math.random(),
                    vx: (Math.random() - 0.5) * 0.0005,
                    vy: (Math.random() - 0.5) * 0.0005,
                })),
                c, op: 0.022 + Math.random() * 0.028,
                w: 0.4 + Math.random() * 0.7,
            };
        });
    }

    let t = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Lerp mouse
        lerpMouse.x += (mouse.x - lerpMouse.x) * 0.028;
        lerpMouse.y += (mouse.y - lerpMouse.y) * 0.028;

        // 1 ── Orbs
        orbs.forEach(o => {
            const px2 = o.bx + Math.sin(t * o.spd * 1000 + o.ph) * 0.07;
            const py2 = o.by + Math.cos(t * o.spd * 1000 + o.ph * 1.4) * 0.055;
            const mx = (lerpMouse.x - 0.5) * o.px;
            const my = (lerpMouse.y - 0.5) * o.px;
            const cx = (px2 + mx) * W;
            const cy = (py2 + my) * H;

            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
            const { r, g: gg, b } = o.c;
            g.addColorStop(0, `rgba(${r},${gg},${b},${o.op})`);
            g.addColorStop(0.55, `rgba(${r},${gg},${b},${o.op * 0.3})`);
            g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2 ── Linhas curvas (skip on reduced motion)
        if (!prefersReduced) {
            curves.forEach(curve => {
                // move pontos
                curve.pts.forEach(p => {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > 1) p.vx *= -1;
                    if (p.y < 0 || p.y > 1) p.vy *= -1;
                    p.x = Math.max(0, Math.min(1, p.x));
                    p.y = Math.max(0, Math.min(1, p.y));
                });
                // desenha
                const pts = curve.pts;
                ctx.beginPath();
                ctx.moveTo(pts[0].x * W, pts[0].y * H);
                for (let i = 1; i < pts.length - 2; i++) {
                    const cx2 = (pts[i].x + pts[i + 1].x) / 2 * W;
                    const cy2 = (pts[i].y + pts[i + 1].y) / 2 * H;
                    ctx.quadraticCurveTo(pts[i].x * W, pts[i].y * H, cx2, cy2);
                }
                ctx.quadraticCurveTo(pts[pts.length - 2].x * W, pts[pts.length - 2].y * H,
                    pts[pts.length - 1].x * W, pts[pts.length - 1].y * H);
                const { r, g, b } = curve.c;
                ctx.strokeStyle = `rgba(${r},${g},${b},${curve.op})`;
                ctx.lineWidth = curve.w;
                ctx.lineCap = 'round';
                ctx.stroke();
            });
        }

        // 3 ── Pontos brilhantes — sempre arc() = círculo
        dots.forEach(d => {
            const px2 = d.bx + Math.sin(t * d.spdX * 800 + d.phX) * 0.038;
            const py2 = d.by + Math.cos(t * d.spdY * 700 + d.phY) * 0.03;
            const mx = (lerpMouse.x - 0.5) * d.px;
            const my = (lerpMouse.y - 0.5) * d.px;
            const cx = (px2 + mx) * W;
            const cy = (py2 + my) * H;

            const twinkle = 0.55 + 0.45 * Math.sin(t * d.twSpd * 1000 + d.twPh);
            const finalOp = d.op * twinkle;
            const { r, g, b } = d.c;

            if (d.glow) {
                const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, d.size * 5.5);
                halo.addColorStop(0, `rgba(${r},${g},${b},${finalOp * 0.45})`);
                halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(cx, cy, d.size * 5.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Círculo sólido perfeito
            ctx.beginPath();
            ctx.arc(cx, cy, d.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${finalOp})`;
            ctx.fill();
        });

        t += 0.016;
        animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener('resize', () => {
        cancelAnimationFrame(animId);
        resize();
        animId = requestAnimationFrame(draw);
    });

    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
    });
    document.addEventListener('touchmove', e => {
        mouse.x = e.touches[0].clientX / window.innerWidth;
        mouse.y = e.touches[0].clientY / window.innerHeight;
    }, { passive: true });
}

/* ── About mini 3D ── */
export function initAbout3D() {
    const canvas = document.getElementById('sobre-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 50);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.6 + Math.random() * 0.5;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xC9A96E, size: 0.03,
        transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));

    let tt = 0;
    (function animate() {
        requestAnimationFrame(animate);
        tt += 0.005;
        scene.rotation.y = tt * 0.3;
        scene.rotation.x = Math.sin(tt * 0.4) * 0.15;
        renderer.render(scene, camera);
    })();
}

/* ── Filter bar elevation ── */
export function initFilterBarElevation() {
    const bar = document.querySelector('.filter-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        bar.classList.toggle('elevated', window.scrollY > 200);
    }, { passive: true });
}

/* ════════════════════════════════════════════
   MELHORIA 4 — Contadores animados no Hero
   Números sobem do zero até o valor final
   quando a section aparece na viewport
════════════════════════════════════════════ */
export function initCounters() {
    const stats = document.querySelectorAll('.hero-stat-value[data-count]');
    if (!stats.length) return;

    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

    function animateCounter(el) {
        const raw = el.dataset.count;         // ex: "500", "4.9", "100"
        const prefix = el.dataset.prefix || ''; // ex: "+"
        const suffix = el.dataset.suffix || ''; // ex: "★", "h", "%"
        const target = parseFloat(raw);
        const isFloat = raw.includes('.');
        const duration = 1800;
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = ease(progress);
            const current = isFloat
                ? (target * eased).toFixed(1)
                : Math.round(target * eased);
            el.textContent = prefix + current + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                animateCounter(e.target);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════
   MELHORIA 1 — Carrossel de Depoimentos
   Drag/swipe + auto-play + dots
════════════════════════════════════════════ */
export function initDepoimentos() {
    const section = document.querySelector('.depoimentos');
    const track = document.getElementById('dep-track');
    const dotsEl = document.getElementById('dep-dots');
    if (!track || !section) return;

    const cards = track.querySelectorAll('.dep-card');
    const total = cards.length;
    let current = 0;
    let autoId = null;
    let animating = false;
    let sectionVisible = false; // usuário está vendo a seção?

    /* ── Dots ── */
    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dep-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); resetAuto(); });
        dotsEl.appendChild(dot);
    });

    function getCardWidth() {
        return cards[0].getBoundingClientRect().width + 20;
    }

    function goTo(idx) {
        if (animating) return;
        animating = true;
        current = ((idx % total) + total) % total;
        track.style.transform = `translateX(-${current * getCardWidth()}px)`;
        dotsEl.querySelectorAll('.dep-dot').forEach((d, i) =>
            d.classList.toggle('active', i === current)
        );
        setTimeout(() => { animating = false; }, 460);
    }

    function next() { goTo(current + 1 >= total ? 0 : current + 1); }
    function prev() { goTo(current - 1 < 0 ? total - 1 : current - 1); }

    /* ── Auto-play: só roda quando a seção está visível ── */
    function startAuto() {
        if (!sectionVisible) return;   // <-- não inicia se fora da tela
        stopAuto();
        autoId = setInterval(next, 4200);
    }
    function stopAuto() {
        clearInterval(autoId);
        autoId = null;
    }
    function resetAuto() {
        stopAuto();
        startAuto();
    }

    /* ── IntersectionObserver na seção ── */
    const sectionObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            sectionVisible = entry.isIntersecting;
            if (sectionVisible) {
                startAuto();          // começa quando entra na tela
            } else {
                stopAuto();           // para quando sai
            }
        });
    }, { threshold: 0.2 }); // 20% da seção visível já basta

    sectionObs.observe(section);

    /* ── Page visibility API: pausa quando aba fica em background ── */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAuto();
        } else if (sectionVisible) {
            startAuto();
        }
    });

    /* ── Touch/swipe nativo ── */
    const wrap = track.parentElement;
    let touchStartX = 0, touchStartY = 0, touchMoved = false;

    wrap.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
        stopAuto();
    }, { passive: true });

    wrap.addEventListener('touchmove', e => {
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > dy && dx > 8) {
            touchMoved = true;
            e.preventDefault();
        }
    }, { passive: false });

    wrap.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (touchMoved) {
            if (diff < -40) next();
            else if (diff > 40) prev();
        }
        resetAuto();
    }, { passive: true });

    /* ── Mouse drag (desktop) ── */
    let mouseStartX = 0, isDragging = false, mouseMoved = false;

    wrap.addEventListener('mousedown', e => {
        isDragging = true; mouseMoved = false;
        mouseStartX = e.clientX;
        stopAuto();
        wrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        mouseMoved = Math.abs(e.clientX - mouseStartX) > 6;
    });

    window.addEventListener('mouseup', e => {
        if (!isDragging) return;
        isDragging = false;
        wrap.style.cursor = 'grab';
        if (mouseMoved) {
            const diff = e.clientX - mouseStartX;
            if (diff < -40) next();
            else if (diff > 40) prev();
        }
        resetAuto();
    });

    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', () => { if (!isDragging) startAuto(); });

    window.addEventListener('resize', () => goTo(current), { passive: true });

    goTo(0);
    // NÃO chama startAuto() aqui — o Observer cuida disso
}