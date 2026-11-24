(function () {
  const preloader = document.querySelector(".preloader");
  if (!preloader) {
    document.body.classList.add("is-ready");
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progressEl = preloader.querySelector("[data-preloader-bar]") || preloader.querySelector(".preloader__progress");
  const percentEl = preloader.querySelector("[data-preloader-count]");
  const percentWrap = preloader.querySelector(".preloader__percent");
  const statusEl = preloader.querySelector("[data-preloader-status]");
  const barGlow = preloader.querySelector(".preloader__bar-glow");
  const logoWrap = preloader.querySelector(".preloader__logo-wrap");
  const SAFE_TIMEOUT = 2600;
  const MIN_DISPLAY = reducedMotion ? 0 : 900;

  const STATUS = [
    [0, "Initializing"],
    [18, "Loading assets"],
    [42, "Preparing interface"],
    [68, "Composing experience"],
    [88, "Almost ready"],
    [100, "Welcome"],
  ];

  document.body.classList.add("is-loading");
  preloader.classList.add("is-animating");
  if (logoWrap && !reducedMotion) logoWrap.classList.add("is-floating");

  let progress = 0;
  let finished = false;
  let assetsReady = false;
  const startedAt = performance.now();

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function setStatus(value) {
    if (!statusEl) return;
    let label = STATUS[0][1];
    for (let i = 0; i < STATUS.length; i++) {
      if (value >= STATUS[i][0]) label = STATUS[i][1];
    }
    if (statusEl.textContent !== label) statusEl.textContent = label;
  }

  function setProgress(value) {
    progress = Math.max(progress, Math.min(100, value));
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (barGlow) barGlow.style.left = `${progress}%`;
    const rounded = Math.round(progress);
    if (percentEl) percentEl.textContent = pad(rounded);
    else if (percentWrap) percentWrap.textContent = `${rounded}%`;
    setStatus(progress);
  }

  function finishHandoff(flyer) {
    if (flyer && flyer.parentNode) flyer.remove();
    const navLogo = document.querySelector(".logo");
    if (navLogo) navLogo.classList.remove("logo--awaiting");

    preloader.classList.add("is-done");
    // is-ready first so main never has a frame with neither class (that caused the blink)
    document.body.classList.add("is-ready");
    document.body.classList.remove("is-loading");
    requestAnimationFrame(() => playHero());
  }

  function prepareHero() {
    if (reducedMotion || typeof gsap === "undefined") return;
    // Lock out CSS fallback before is-ready so the hero never double-animates / blinks
    document.body.classList.add("has-hero-gsap");
    gsap.set(".hero__title .line > .hero__title-text", { yPercent: 110 });
    gsap.set(".hero__label", { autoAlpha: 0, y: 16 });
    gsap.set(".hero__intro", { autoAlpha: 0, y: 18 });
    gsap.set(".hero__actions", { autoAlpha: 0, y: 18 });
    gsap.set(".hero__meta", { autoAlpha: 0, y: 14 });
    gsap.set(".hero__frame", { autoAlpha: 0, y: 40, scale: 0.96 });
    gsap.set(".hero__chip", { autoAlpha: 0, y: 22 });
    gsap.set(".hero__glow", { autoAlpha: 0, scale: 0.9 });
    gsap.set(".hero__scroll", { autoAlpha: 0, y: -8 });
  }

  function exitPreloader() {
    if (!reducedMotion && typeof gsap !== "undefined") {
      const logoSource = logoWrap || preloader.querySelector(".preloader__logo-wrap");
      const navShell = document.querySelector(".nav-shell");
      const navLogo = document.querySelector(".logo");
      const navMark = document.querySelector(".logo__mark");

      if (logoSource) logoSource.classList.remove("is-floating");
      prepareHero();

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
      });

      tl.to(".preloader__progress-wrap", { autoAlpha: 0, y: 8, duration: 0.3 }, 0)
        .to(".preloader__brand", { autoAlpha: 0, y: -10, duration: 0.35 }, 0.02)
        .to(".preloader__orbit", { autoAlpha: 0, scale: 1.12, stagger: 0.03, duration: 0.4 }, 0.04)
        .to([".preloader__pulse", ".preloader__shine"], { autoAlpha: 0, duration: 0.22 }, 0.05);

      if (logoSource && navMark) {
        // Settle nav layout so the landing rect matches the final bar position
        if (navShell) gsap.set(navShell, { y: 0, opacity: 0 });
        if (navLogo) {
          gsap.set(navLogo, { y: 0, opacity: 0 });
          navLogo.classList.add("logo--awaiting");
        }

        const from = logoSource.getBoundingClientRect();
        const to = navMark.getBoundingClientRect();

        const flyer = logoSource.cloneNode(true);
        flyer.classList.remove("is-floating");
        flyer.classList.add("preloader__logo-fly");
        flyer.setAttribute("aria-hidden", "true");
        document.body.appendChild(flyer);

        gsap.set(logoSource, { autoAlpha: 0 });
        gsap.set(flyer, {
          position: "fixed",
          top: from.top,
          left: from.left,
          width: from.width,
          height: from.height,
          margin: 0,
          x: 0,
          y: 0,
          scale: 1,
          transformOrigin: "center center",
          zIndex: 10001,
          autoAlpha: 1,
        });

        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = Math.min(to.width / from.width, to.height / from.height);

        const flyStart = 0.1;
        const flyDuration = 0.7;
        const landAt = flyStart + flyDuration;

        tl.to(
          flyer,
          {
            x: dx,
            y: dy,
            scale,
            duration: flyDuration,
            ease: "power3.inOut",
          },
          flyStart
        );

        // Nav only — keep is-ready until the curtain is fully gone (avoids page blink)
        tl.add(() => {
          document.body.classList.add("has-logo-handoff");
        }, landAt - 0.28);

        // Crossfade flyer → real mark so the swap never pops
        tl.add(() => {
          if (navLogo) navLogo.classList.remove("logo--awaiting");
        }, landAt - 0.04);
        tl.to(flyer, { autoAlpha: 0, duration: 0.14, ease: "power1.out" }, landAt - 0.02);
        tl.add(() => {
          if (flyer && flyer.parentNode) flyer.remove();
        }, landAt + 0.14);

        tl.to(".preloader__stage", { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, flyStart + 0.18);
        tl.to(
          preloader,
          {
            autoAlpha: 0,
            duration: 0.55,
            ease: "power2.out",
            onComplete: finishHandoff,
          },
          landAt
        );
      } else {
        tl.to(".preloader__logo-wrap", { autoAlpha: 0, scale: 1.06, duration: 0.45 }, 0.1).to(
          preloader,
          {
            autoAlpha: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: finishHandoff,
          },
          0.22
        );
      }
      return;
    }

    finishHandoff();
  }

  function playHero() {
    if (reducedMotion || typeof gsap === "undefined") return;
    if (!document.body.classList.contains("has-hero-gsap")) prepareHero();

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(".hero__title .line > .hero__title-text", { yPercent: 0, duration: 0.95, stagger: 0.12 }, 0)
      .to(".hero__label", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.08)
      .to(".hero__intro", { autoAlpha: 1, y: 0, duration: 0.75 }, 0.18)
      .to(".hero__actions", { autoAlpha: 1, y: 0, duration: 0.75 }, 0.28)
      .to(".hero__meta", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.38)
      .to(".hero__frame", { autoAlpha: 1, y: 0, scale: 1, duration: 1.1 }, 0.12)
      .to(".hero__chip", { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.85 }, 0.35)
      .to(".hero__glow", { autoAlpha: 1, scale: 1, duration: 1.2 }, 0.2)
      .to(".hero__scroll", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.7);
  }

  function finish() {
    if (finished) return;
    finished = true;

    const wait = Math.max(0, MIN_DISPLAY - (performance.now() - startedAt));

    setTimeout(() => {
      setProgress(100);
      window.setTimeout(exitPreloader, reducedMotion ? 0 : 180);
    }, wait);
  }

  function tickFakeProgress() {
    if (finished) return;
    if (progress >= (assetsReady ? 94 : 78)) return;
    const step = assetsReady ? 6 + Math.random() * 8 : 2.8 + Math.random() * 4.5;
    setProgress(progress + step);
    window.setTimeout(tickFakeProgress, assetsReady ? 55 : 95);
  }

  function markReady() {
    assetsReady = true;
    setProgress(Math.max(progress, 90));
    const settle = window.setInterval(() => {
      if (progress >= 100) {
        window.clearInterval(settle);
        finish();
        return;
      }
      setProgress(progress + 3.5);
    }, 36);
  }

  // Only warm above-the-fold assets — don't wait for the full window load
  function warmCriticalImages() {
    const urls = [
      "assets/images/portrait-hero.webp?v=3",
      "assets/images/logo/vk-logo-dark.svg",
    ];
    return Promise.all(
      urls.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.decoding = "async";
            const done = () => resolve();
            img.onload = done;
            img.onerror = done;
            // Cap wait per image so a slow network never stalls the preloader
            window.setTimeout(done, 900);
            img.src = src;
          })
      )
    );
  }

  setProgress(6);
  if (!reducedMotion) tickFakeProgress();
  else setProgress(100);

  const assetsGate = warmCriticalImages().then(markReady);

  window.setTimeout(() => {
    if (!finished) {
      assetsReady = true;
      setProgress(100);
      finish();
    }
  }, SAFE_TIMEOUT);

  // Keep the promise referenced so bundlers/linters don't drop it
  void assetsGate;
})();
