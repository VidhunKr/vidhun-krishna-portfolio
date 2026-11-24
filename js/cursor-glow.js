/**
 * Crisp mouse spark trail — fine luminous dots + thin ribbon (not smoke).
 * Desktop / fine pointer only. Native cursor preserved.
 */
(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  const cores = navigator.hardwareConcurrency || 4;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (saveData || cores <= 2) return;

  const canvas = document.createElement("canvas");
  canvas.className = "page-spark-trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  document.documentElement.classList.add("has-spark-trail");

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const MAX = 56;
  const MAX_RIBBON = 14;
  const IDLE_MS = 160;
  const COLORS = [
    "rgba(220, 235, 255,",
    "rgba(142, 180, 255,",
    "rgba(91, 140, 255,",
    "rgba(196, 165, 116,",
    "rgba(255, 245, 230,",
  ];

  const sparks = [];
  const ribbon = [];

  let w = 0;
  let h = 0;
  let mx = -999;
  let my = -999;
  let px = -999;
  let py = -999;
  let vx = 0;
  let vy = 0;
  let hovering = false;
  let menuHover = false;
  let lastT = performance.now();
  let lastMoveT = 0;
  let running = false;
  let rafId = 0;

  const MENU_SEL = [
    ".site-footer__nav a",
    ".nav__link",
    ".nav__mobile-links a",
    ".site-footer__socials a",
    "input",
    "textarea",
    "button",
    ".btn",
    ".contact__submit",
    ".nav__cta",
    ".nav__toggle",
    ".site-footer__cta-btn",
    ".site-footer__top-btn",
    ".form-dialog__action",
    ".form-dialog__close",
    ".crystal-field",
  ].join(", ");

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawn(x, y, force) {
    const count = force ? 3 + ((Math.random() * 2) | 0) : 1;
    for (let i = 0; i < count; i++) {
      if (sparks.length >= MAX) sparks.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = (force ? 0.85 : 0.35) + Math.random() * (force ? 1.5 : 0.85);
      sparks.push({
        x: x + (Math.random() - 0.5) * (force ? 12 : 6),
        y: y + (Math.random() - 0.5) * (force ? 12 : 6),
        vx: Math.cos(angle) * speed * 0.35 + vx * 0.02,
        vy: Math.sin(angle) * speed * 0.35 + vy * 0.02 - 0.14,
        life: 1,
        decay: 0.014 + Math.random() * 0.016,
        size: (force ? 2 : 1.15) + Math.random() * (force ? 2.4 : 1.6),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  function setMenuHover(on) {
    menuHover = on;
    canvas.classList.toggle("is-menu-hidden", on);
    document.documentElement.classList.toggle("menu-hover-active", on);
    if (on) {
      sparks.length = 0;
      ribbon.length = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    ctx.clearRect(0, 0, w, h);
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      const nx = e.clientX;
      const ny = e.clientY;
      lastMoveT = performance.now();

      if (px > -100) {
        vx = nx - px;
        vy = ny - py;
      }
      const dist = Math.hypot(vx, vy);

      if (!menuHover) {
        if (px > -100 && dist > 2) {
          const steps = Math.min(4, Math.max(1, Math.floor(dist / 10)));
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            spawn(px + vx * t, py + vy * t, hovering && dist > 8);
          }
        }

        ribbon.push({ x: nx, y: ny, life: 1 });
        if (ribbon.length > MAX_RIBBON) ribbon.shift();
        startLoop();
      }

      mx = px = nx;
      my = py = ny;
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerover",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;

      const onMenu = !!t.closest(MENU_SEL);
      if (onMenu !== menuHover) setMenuHover(onMenu);

      const next =
        !onMenu &&
        !!t.closest(
          "a, button, .btn, [data-magnetic], [data-skill-card], .playing-card, .projects__media, input, textarea"
        );
      if (next && !hovering && mx > 0 && !menuHover) {
        spawn(mx, my, true);
        startLoop();
      }
      hovering = next;
      canvas.classList.toggle("is-rich", hovering && !menuHover);
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    mx = my = px = py = -999;
    sparks.length = 0;
    ribbon.length = 0;
    stopLoop();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
  });

  function drawRibbon() {
    const len = ribbon.length;
    if (len < 2) return;
    ctx.lineCap = "round";
    for (let i = 1; i < len; i++) {
      const a = ribbon[i - 1];
      const b = ribbon[i];
      const t = i / len;
      const alpha = a.life * b.life * t * (hovering ? 0.26 : 0.14);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(130, 175, 255, ${alpha})`;
      ctx.lineWidth = (hovering ? 1.8 : 1.15) * t;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function frame(now) {
    if (!running) return;

    const dt = Math.min(32, now - lastT) / 16.67;
    lastT = now;
    ctx.clearRect(0, 0, w, h);

    if (menuHover || document.hidden) {
      running = false;
      rafId = 0;
      return;
    }

    ctx.globalCompositeOperation = "lighter";
    drawRibbon();

    for (let i = ribbon.length - 1; i >= 0; i--) {
      ribbon[i].life -= 0.055 * dt;
      if (ribbon[i].life <= 0) ribbon.splice(i, 1);
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.96;
      s.vy = s.vy * 0.96 - 0.012 * dt;
      s.twinkle += 0.14 * dt;
      s.life -= s.decay * dt;

      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      const pulse = 0.8 + Math.sin(s.twinkle) * 0.2;
      const alpha = Math.max(0, s.life) * pulse;
      const radius = s.size * (0.65 + alpha * 0.55);

      // Crisp spark core
      ctx.beginPath();
      ctx.fillStyle = `${s.color}${alpha * 0.9})`;
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Tiny white pin
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.75})`;
      ctx.arc(s.x, s.y, Math.max(0.45, radius * 0.35), 0, Math.PI * 2);
      ctx.fill();

      // Tight halo (keeps it sparkly, not smoky)
      ctx.beginPath();
      ctx.fillStyle = `${s.color}${alpha * 0.16})`;
      ctx.arc(s.x, s.y, radius * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const idle = now - lastMoveT > IDLE_MS && sparks.length === 0 && ribbon.length === 0;
    if (idle) {
      running = false;
      rafId = 0;
      ctx.clearRect(0, 0, w, h);
      return;
    }

    rafId = requestAnimationFrame(frame);
  }

  resize();
  let resizeRaf = 0;
  window.addEventListener(
    "resize",
    () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    },
    { passive: true }
  );
})();
