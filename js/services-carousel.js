(() => {
  const root = document.querySelector("[data-services-carousel]");
  const el = document.querySelector("[data-services-swiper]");
  if (!root || !el || typeof Swiper === "undefined") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wrapper = el.querySelector(".swiper-wrapper");

  const SUIT_PATHS = {
    spade:
      "M50 4C50 4 14 40 14 62c0 13.8 10.5 24 24.5 24 3.2 0 6.2-.7 8.5-1.9 0 0 .8 7.4-.5 14.9H50h3.5c-1.3-7.5-.5-14.9-.5-14.9 2.3 1.2 5.3 1.9 8.5 1.9C75.5 86 86 75.8 86 62 86 40 50 4 50 4z",
    heart:
      "M50 92C50 92 8 62 8 36 8 22.2 18.5 12 31.5 12c7.4 0 13.4 3.6 16.5 9.1C51.1 15.6 57.1 12 64.5 12 77.5 12 88 22.2 88 36c0 26-42 56-42 56z",
    diamond: "M50 4L92 50 50 96 8 50z",
    club:
      "M50 34c-1.2 0-2.3.1-3.4.3C45.2 22.8 36.8 14 26 14 14.4 14 5 23.4 5 35s9.4 21 21 21c2.8 0 5.4-.5 7.8-1.5C30.6 64 26 72.2 26 72.2h48S69.4 64 66.2 54.5c2.4 1 5 1.5 7.8 1.5 11.6 0 21-9.4 21-21S85.6 14 74 14c-10.8 0-19.2 8.8-20.6 20.3-1.1-.2-2.2-.3-3.4-.3zm-8 38.2c-.8 6.4.2 15.8.2 15.8h15.6s1-9.4.2-15.8H42z",
  };

  function goldDefs(uid) {
    return `
      <defs>
        <linearGradient id="g-${uid}" x1="8%" y1="4%" x2="92%" y2="96%">
          <stop offset="0%" stop-color="#2a4578"/>
          <stop offset="16%" stop-color="#5b8cff"/>
          <stop offset="34%" stop-color="#d4e2ff"/>
          <stop offset="50%" stop-color="#3a5f9a"/>
          <stop offset="68%" stop-color="#9bb8ff"/>
          <stop offset="100%" stop-color="#2e4d84"/>
        </linearGradient>
        <linearGradient id="g-shine-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef4ff" stop-opacity="0.55"/>
          <stop offset="45%" stop-color="#eef4ff" stop-opacity="0"/>
          <stop offset="100%" stop-color="#eef4ff" stop-opacity="0.2"/>
        </linearGradient>
      </defs>`;
  }

  function suitSvg(suit, uid, sizeClass) {
    const path = SUIT_PATHS[suit] || SUIT_PATHS.spade;
    return `
      <svg class="${sizeClass}" data-suit-svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        ${goldDefs(uid)}
        <path d="${path}" fill="url(#g-${uid})"/>
        <path d="${path}" fill="url(#g-shine-${uid})" opacity="0.45"/>
      </svg>`;
  }

  let svgIndex = 0;
  wrapper.querySelectorAll(".playing-card").forEach((card) => {
    const suit = card.getAttribute("data-suit") || "spade";
    const main = card.querySelector(".playing-card__suit");
    if (main) {
      main.innerHTML = suitSvg(suit, `m${svgIndex++}`, "playing-card__suit-svg");
      main.classList.add("playing-card__suit--svg");
    }
    card.querySelectorAll(".playing-card__pip").forEach((pip) => {
      pip.innerHTML = suitSvg(suit, `p${svgIndex++}`, "playing-card__pip-svg");
      pip.classList.add("playing-card__pip--svg");
    });
  });

  const originals = Array.from(wrapper.children);
  const total = originals.length;
  // Five decks → center copy always has full neighbors (never an empty end)
  const COPIES = 5;
  for (let c = 1; c < COPIES; c += 1) {
    originals.forEach((slide) => wrapper.appendChild(slide.cloneNode(true)));
  }

  wrapper.querySelectorAll("svg[data-suit-svg]").forEach((svg, i) => {
    const uid = `x${i}`;
    svg.querySelectorAll("[id]").forEach((node) => {
      const oldId = node.getAttribute("id");
      const nextId = `${oldId}-${uid}`;
      node.setAttribute("id", nextId);
      svg.querySelectorAll(`[fill="url(#${oldId})"]`).forEach((n) => {
        n.setAttribute("fill", `url(#${nextId})`);
      });
    });
  });

  // Middle copy indices: [14, 21) when total === 7
  const bandStart = total * 2;
  const bandEnd = total * 3;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;

  const coverflowBase = {
    rotate: 34,
    stretch: -36,
    depth: 220,
    modifier: 1.05,
    slideShadows: false,
  };

  const coverflowMobile = {
    rotate: 16,
    stretch: -10,
    depth: 100,
    modifier: 1,
    slideShadows: false,
  };

  let wrapping = false;
  let lastActive = -1;
  let autoTimer = 0;
  let inView = false;

  function snapScroll() {
    const y = window.__lenis?.scroll ?? window.scrollY;
    if (window.__lenis?.scrollTo) window.__lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  }

  function silentTo(sw, index) {
    wrapping = true;
    sw.slideTo(index, 0, false);
    snapScroll();
    wrapping = false;
  }

  /** Normalize active index into the middle deck so both sides stay filled */
  function keepInBand(sw) {
    if (wrapping) return false;
    let i = sw.activeIndex;
    if (i >= bandStart && i < bandEnd) return false;
    while (i < bandStart) i += total;
    while (i >= bandEnd) i -= total;
    silentTo(sw, i);
    return true;
  }

  function neutralizeFocus(sw) {
    sw.slides.forEach((slide) => {
      if (slide.getAttribute("tabindex") !== "-1") slide.setAttribute("tabindex", "-1");
    });
    const ae = document.activeElement;
    if (ae?.closest?.(".swiper-slide")) ae.blur();
  }

  function logicalIndex(sw) {
    return ((sw.activeIndex % total) + total) % total;
  }

  const slideSpeed = reducedMotion ? 0 : isMobile || isCoarse ? 420 : 600;

  const swiper = new Swiper(el, {
    effect: "coverflow",
    grabCursor: !isCoarse,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: false,
    speed: slideSpeed,
    watchSlidesProgress: true,
    spaceBetween: isMobile ? -12 : -24,
    initialSlide: bandStart,
    resistanceRatio: 0.7,
    longSwipesRatio: 0.2,
    longSwipesMs: 240,
    threshold: isCoarse ? 14 : 8,
    followFinger: true,
    // Critical for Lenis / native vertical scroll on mobile — don't trap the page
    touchStartPreventDefault: false,
    touchMoveStopPropagation: false,
    touchReleaseOnEdges: true,
    touchAngle: 28,
    passiveListeners: true,
    a11y: { enabled: false },
    keyboard: { enabled: false },
    navigation: false,
    autoplay: false,
    coverflowEffect: isMobile ? { ...coverflowMobile } : { ...coverflowBase },
    breakpoints: {
      0: {
        spaceBetween: -10,
        speed: reducedMotion ? 0 : 400,
        coverflowEffect: { ...coverflowMobile },
      },
      768: {
        spaceBetween: -20,
        speed: reducedMotion ? 0 : 520,
        coverflowEffect: {
          rotate: 28,
          stretch: -26,
          depth: 190,
          modifier: 1,
          slideShadows: false,
        },
      },
      1024: {
        spaceBetween: -26,
        speed: reducedMotion ? 0 : 600,
        coverflowEffect: { ...coverflowBase },
      },
    },
    on: {
      init(sw) {
        root.classList.add("is-ready");
        if (isMobile || isCoarse) root.classList.add("is-touch");
        buildBullets();
        neutralizeFocus(sw);
        keepInBand(sw);
        markActive(sw);
        syncBullets(sw);
        requestAnimationFrame(() => {
          window.__lenis?.resize?.();
          if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
        });
      },
      slideChange(sw) {
        neutralizeFocus(sw);
        markActive(sw);
        syncBullets(sw);
      },
      slideChangeTransitionEnd(sw) {
        if (keepInBand(sw)) lastActive = -1;
        markActive(sw);
        syncBullets(sw);
      },
      transitionEnd(sw) {
        if (keepInBand(sw)) lastActive = -1;
      },
      touchStart() {
        stopAuto();
      },
      touchEnd() {
        if (inView && !reducedMotion) startAuto();
      },
      sliderFirstMove() {
        stopAuto();
      },
    },
  });

  function go(dir) {
    if (wrapping) return;
    keepInBand(swiper);
    const target = swiper.activeIndex + dir;
    if (target < 0 || target >= swiper.slides.length) {
      keepInBand(swiper);
      return;
    }
    swiper.slideTo(target, slideSpeed);
  }

  const prev = root.querySelector("[data-services-prev]");
  const next = root.querySelector("[data-services-next]");
  prev?.addEventListener("click", (e) => {
    e.preventDefault();
    go(-1);
  });
  next?.addEventListener("click", (e) => {
    e.preventDefault();
    go(1);
  });

  function stopAuto() {
    clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function startAuto() {
    if (reducedMotion) return;
    stopAuto();
    autoTimer = window.setTimeout(() => {
      // Autoplay only advances forward — seamless 07 → 01 → 02…
      if (inView && !root.matches(":hover") && !swiper.animating) go(1);
      if (inView) startAuto();
    }, 4200);
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) startAuto();
          else stopAuto();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(root);
  } else {
    inView = true;
    startAuto();
  }

  root.addEventListener("pointerenter", stopAuto);
  root.addEventListener("pointerleave", () => {
    if (inView) startAuto();
  });

  el.addEventListener(
    "focusin",
    (e) => {
      if (e.target?.closest?.(".swiper-slide")) e.target.blur?.();
    },
    true
  );

  function markActive(sw) {
    const active = sw.activeIndex;
    if (active === lastActive) return;
    lastActive = active;

    sw.slides.forEach((slide, index) => {
      const card = slide.querySelector(".playing-card");
      if (!card) return;
      const dist = Math.abs(index - active);
      const on = dist === 0;
      if (card.classList.contains("is-active") !== on) {
        card.classList.toggle("is-active", on);
      }
      const nextDepth = dist === 2 ? "2" : dist === 3 ? "3" : dist > 3 ? "far" : null;
      const prevDepth = slide.getAttribute("data-depth");
      if (nextDepth) {
        if (prevDepth !== nextDepth) slide.setAttribute("data-depth", nextDepth);
      } else if (prevDepth) {
        slide.removeAttribute("data-depth");
      }
    });
  }

  function buildBullets() {
    const host = root.querySelector("[data-services-pagination]");
    if (!host) return;
    host.innerHTML = "";
    for (let i = 0; i < total; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "services__bullet";
      btn.setAttribute("aria-label", `Go to card ${i + 1}`);
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        swiper.slideTo(bandStart + i);
      });
      host.appendChild(btn);
    }
  }

  function syncBullets(sw) {
    const bullets = root.querySelectorAll(".services__bullet");
    const active = logicalIndex(sw);
    bullets.forEach((bullet, i) => {
      bullet.classList.toggle("is-active", i === active);
    });
  }
})();
