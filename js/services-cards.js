(() => {
  const root = document.querySelector("[data-services-cards]");
  if (!root) return;

  const SUIT_PATHS = {
    spade:
      "M50 4C50 4 14 40 14 62c0 13.8 10.5 24 24.5 24 3.2 0 6.2-.7 8.5-1.9 0 0 .8 7.4-.5 14.9H50h3.5c-1.3-7.5-.5-14.9-.5-14.9 2.3 1.2 5.3 1.9 8.5 1.9C75.5 86 86 75.8 86 62 86 40 50 4 50 4z",
    heart:
      "M50 92C50 92 8 62 8 36 8 22.2 18.5 12 31.5 12c7.4 0 13.4 3.6 16.5 9.1C51.1 15.6 57.1 12 64.5 12 77.5 12 88 22.2 88 36c0 26-42 56-42 56z",
    diamond: "M50 4L92 50 50 96 8 50z",
    club:
      "M50 34c-1.2 0-2.3.1-3.4.3C45.2 22.8 36.8 14 26 14 14.4 14 5 23.4 5 35s9.4 21 21 21c2.8 0 5.4-.5 7.8-1.5C30.6 64 26 72.2 26 72.2h48S69.4 64 66.2 54.5c2.4 1 5 1.5 7.8 1.5 11.6 0 21-9.4 21-21S85.6 14 74 14c-10.8 0-19.2 8.8-20.6 20.3-1.1-.2-2.2-.3-3.4-.3zm-8 38.2c-.8 6.4.2 15.8.2 15.8h15.6s1-9.4.2-15.8H42z",
  };

  if (!document.getElementById("services-suit-foil")) {
    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.setAttribute("aria-hidden", "true");
    sprite.setAttribute("focusable", "false");
    sprite.id = "services-suit-foil-sprite";
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    sprite.innerHTML = `
      <defs>
        <linearGradient id="services-suit-foil" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stop-color="#2a3a58"/>
          <stop offset="18%" stop-color="#8eb0e8"/>
          <stop offset="36%" stop-color="#f0f5ff"/>
          <stop offset="52%" stop-color="#5b7ab0"/>
          <stop offset="70%" stop-color="#c8d8f5"/>
          <stop offset="86%" stop-color="#7a98cc"/>
          <stop offset="100%" stop-color="#1e2a40"/>
        </linearGradient>
      </defs>`;
    document.body.appendChild(sprite);
  }

  function suitSvg(suit, sizeClass, { foil = true } = {}) {
    const path = SUIT_PATHS[suit] || SUIT_PATHS.spade;
    if (foil) {
      return `<svg class="${sizeClass}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${path}" fill="url(#services-suit-foil)" stroke="#e8efff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    }
    return `<svg class="${sizeClass}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${path}" fill="#d7e3ff"/></svg>`;
  }

  const cards = Array.from(root.querySelectorAll("[data-services-card]"));
  cards.forEach((card) => {
    const suit = card.getAttribute("data-suit") || "spade";
    const main = card.querySelector(".playing-card__suit");
    if (main) {
      main.innerHTML = suitSvg(suit, "playing-card__suit-svg", { foil: true });
      main.classList.add("playing-card__suit--svg");
    }
    card.querySelectorAll(".playing-card__pip").forEach((pip) => {
      pip.innerHTML = suitSvg(suit, "playing-card__pip-svg", { foil: false });
      pip.classList.add("playing-card__pip--svg");
    });
  });

  const n = cards.length;
  if (!n) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const stage = root.querySelector("[data-services-stage]");
  const counterEl = root.querySelector("[data-services-counter]");
  const progressEl = root.querySelector("[data-services-progress]");
  const prevBtn = root.querySelector("[data-services-prev]");
  const nextBtn = root.querySelector("[data-services-next]");

  // Static grid fallback — no carousel transforms
  if (reducedMotion) {
    root.classList.add("is-static");
    cards.forEach((card, i) => {
      card.style.zIndex = String(n - i);
      card.setAttribute("aria-hidden", "false");
    });
    if (counterEl) counterEl.textContent = `${String(n).padStart(2, "0")} cards`;
    if (progressEl) progressEl.style.width = "100%";
    return;
  }

  let index = 0;
  let dragX = 0;
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let lastMoveX = 0;
  let lastMoveT = 0;
  let velocity = 0;
  let autoTimer = 0;
  let visible = false;

  // Center active + 3 left / 3 right (7 cards total)
  const VISIBLE = 3;
  const BASE_ROT = 0;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  function fanMetrics() {
    const w = window.innerWidth;
    // Split layout (md+) = narrower right column → tighter fan steps
    if (coarse || w < 768) {
      return { stepX: 42, stepY: 4, stepRot: 7 };
    }
    if (w < 1024) {
      return { stepX: 48, stepY: 5, stepRot: 7.5 };
    }
    return { stepX: 62, stepY: 6, stepRot: 8.5 };
  }

  function wrapRel(i, active) {
    let rel = i - active;
    if (rel > n / 2) rel -= n;
    if (rel < -n / 2) rel += n;
    return rel;
  }

  function pad(i) {
    return String(i).padStart(2, "0");
  }

  function layout(dragOffset = 0) {
    const { stepX, stepY, stepRot } = fanMetrics();
    const dragRel = dragOffset / (coarse ? 90 : 120);

    cards.forEach((card, i) => {
      let rel = wrapRel(i, index) + dragRel;
      const abs = Math.abs(rel);
      const hidden = abs > VISIBLE + 0.85;
      const isActive = abs < 0.55;
      const x = rel * stepX;
      const y = Math.abs(rel) * stepY; // slight drop on sides, center stays high
      const rot = BASE_ROT + rel * stepRot;
      const scale = isActive ? 1.06 : Math.max(0.82, 1 - abs * 0.05);
      const opacity = hidden ? 0 : isActive ? 1 : Math.max(0.35, 1 - abs * 0.16);
      const z = Math.round(100 - abs * 10);

      card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(z);
      card.style.pointerEvents = isActive ? "auto" : "none";
      card.setAttribute("aria-hidden", isActive ? "false" : "true");
      card.classList.toggle("is-active", isActive);
    });

    if (counterEl) counterEl.textContent = `${pad(index + 1)} / ${pad(n)}`;
    if (progressEl) progressEl.style.width = `${((index + 1) / n) * 100}%`;
  }

  function goTo(next, { instant = false } = {}) {
    index = ((next % n) + n) % n;
    if (instant) {
      cards.forEach((c) => {
        c.style.transition = "none";
      });
      layout(0);
      // force reflow then restore transition
      void root.offsetHeight;
      cards.forEach((c) => {
        c.style.transition = "";
      });
      return;
    }
    layout(0);
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = 0;
    }
  }

  function startAuto() {
    stopAuto();
    if (coarse || reducedMotion || !visible) return;
    autoTimer = window.setInterval(() => {
      if (!dragging) next();
    }, 4200);
  }

  // Pointer drag — transform only, no scroll hijack beyond threshold
  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    lastMoveX = e.clientX;
    lastMoveT = performance.now();
    velocity = 0;
    dragX = 0;
    root.classList.add("is-dragging");
    cards.forEach((c) => {
      c.style.transition = "none";
    });
    try {
      stage.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    stopAuto();
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const now = performance.now();
    const dx = e.clientX - startX;
    const dt = Math.max(1, now - lastMoveT);
    velocity = (e.clientX - lastMoveX) / dt;
    lastMoveX = e.clientX;
    lastMoveT = now;
    dragX = dx;
    layout(dx);
  }

  function onPointerUp(e) {
    if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
    dragging = false;
    root.classList.remove("is-dragging");
    cards.forEach((c) => {
      c.style.transition = `transform 0.7s ${EASE}, opacity 0.55s ${EASE}`;
    });

    const threshold = coarse ? 42 : 56;
    const flick = Math.abs(velocity) > 0.45;
    if (dragX <= -threshold || (flick && velocity < -0.35)) next();
    else if (dragX >= threshold || (flick && velocity > 0.35)) prev();
    else layout(0);

    dragX = 0;
    pointerId = null;
    startAuto();
  }

  if (stage) {
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    stage.addEventListener(
      "lostpointercapture",
      () => {
        if (dragging) onPointerUp({ pointerId });
      },
      { passive: true }
    );
  }

  prevBtn?.addEventListener("click", () => {
    prev();
    startAuto();
  });
  nextBtn?.addEventListener("click", () => {
    next();
    startAuto();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next();
      startAuto();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      prev();
      startAuto();
    }
  });

  // Pause autoplay when off-screen
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        if (visible) startAuto();
        else stopAuto();
      },
      { threshold: 0.35 }
    );
    io.observe(root);
  } else {
    visible = true;
    startAuto();
  }

  // Init styles once
  cards.forEach((c) => {
    c.style.transition = `transform 0.7s ${EASE}, opacity 0.55s ${EASE}`;
    c.style.willChange = "transform, opacity";
  });
  layout(0);

  window.addEventListener(
    "resize",
    () => {
      layout(0);
    },
    { passive: true }
  );
})();
