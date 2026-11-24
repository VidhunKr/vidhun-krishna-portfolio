(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  // Phones/tablets: native scroll only — Lenis + GSAP scrub was the main lag source
  const preferNativeScroll = coarsePointer || narrowViewport;

  function revealContactPanelNow() {
    const panel = document.querySelector("[data-contact-panel]");
    if (!panel || panel.classList.contains("is-in")) return;
    panel.classList.add("is-in");
    if (typeof gsap !== "undefined") {
      const rises = panel.querySelectorAll("[data-contact-rise]");
      gsap.killTweensOf([panel, ...rises]);
      gsap.set(panel, { autoAlpha: 1, y: 0, force3D: true });
      if (rises.length) gsap.set(rises, { autoAlpha: 1, y: 0, force3D: true });
    } else {
      panel.style.opacity = "1";
    }
  }

  window.__revealContactPanel = revealContactPanelNow;

  function navOffsetPx() {
    const shell = document.querySelector(".nav-shell");
    if (shell) return Math.round(shell.getBoundingClientRect().height) + 20;
    return 72;
  }

  function bindHashScroll(scrollFn) {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        if (anchor.hasAttribute("data-back-to-top")) return;
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        if (!document.getElementById(href.slice(1))) return;
        e.preventDefault();
        scrollFn(href, { fromMobile: !!anchor.closest("[data-nav-mobile]") });
      });
    });
  }

  function scrollToSectionNative(hash, opts = {}) {
    const id = (hash || "").replace(/^#/, "");
    const target = document.getElementById(id);
    if (!target) return;

    const fromMobile = !!opts.fromMobile;
    if (
      (fromMobile || document.body.classList.contains("nav-open")) &&
      typeof window.__closeMobileNav === "function"
    ) {
      window.__closeMobileNav({ restoreFocus: false });
    }

    const run = () => {
      if (id === "contact") revealContactPanelNow();
      if (typeof window.__setActiveNavLink === "function") {
        window.__setActiveNavLink(id);
      }
      const offset = navOffsetPx();
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      // Correct once after layout settles (lazy images / fonts)
      window.setTimeout(() => {
        const corrected = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
        if (Math.abs(corrected - window.scrollY) > 24) {
          window.scrollTo({ top: corrected, behavior: "auto" });
        }
      }, 280);
    };

    window.setTimeout(run, fromMobile ? 120 : 0);
  }

  // Lenis — desktop / fine pointer only (keeps wheel smooth without mobile lag)
  let lenis;
  if (!reducedMotion && !preferNativeScroll && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5,
      wheelMultiplier: 0.78,
      infinite: false,
    });

    window.__lenis = lenis;

    if (typeof lenis.on === "function" && !lenis.__navSpyBound) {
      lenis.on("scroll", () => {
        window.dispatchEvent(new Event("scroll"));
      });
      lenis.__navSpyBound = true;
    }

    document.querySelectorAll(".contact__form input, .contact__form textarea").forEach((field) => {
      field.addEventListener(
        "focus",
        () => {
          requestAnimationFrame(() => {
            if (typeof lenis.resize === "function") lenis.resize();
          });
        },
        { passive: true }
      );
    });

    function scrollToSection(hash, opts = {}) {
      const id = (hash || "").replace(/^#/, "");
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      const fromMobile = !!opts.fromMobile;
      if (
        (fromMobile || document.body.classList.contains("nav-open")) &&
        typeof window.__closeMobileNav === "function"
      ) {
        window.__closeMobileNav({ restoreFocus: false });
      }

      const run = () => {
        if (id === "contact") revealContactPanelNow();
        if (typeof window.__setActiveNavLink === "function") {
          window.__setActiveNavLink(id);
        }

        if (typeof lenis.start === "function") lenis.start();
        if (typeof lenis.resize === "function") lenis.resize();

        const offset = navOffsetPx();
        const current = typeof lenis.scroll === "number" ? lenis.scroll : window.scrollY || 0;
        let y = Math.max(0, current + target.getBoundingClientRect().top - offset);
        if (typeof lenis.limit === "number" && lenis.limit > 0) {
          y = Math.min(y, lenis.limit);
        }

        lenis.scrollTo(y, {
          duration: reducedMotion ? 0 : 0.9,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          immediate: !!reducedMotion,
          onComplete: () => {
            if (typeof lenis.resize === "function") lenis.resize();
            const cur = typeof lenis.scroll === "number" ? lenis.scroll : window.scrollY || 0;
            let corrected = Math.max(0, cur + target.getBoundingClientRect().top - offset);
            if (typeof lenis.limit === "number" && lenis.limit > 0) {
              corrected = Math.min(corrected, lenis.limit);
            }
            if (Math.abs(corrected - cur) > 24) {
              lenis.scrollTo(corrected, {
                duration: 0.35,
                easing: (t) => 1 - Math.pow(1 - t, 3),
              });
            }
          },
        });
      };

      const delay = fromMobile ? 120 : 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.setTimeout(run, delay);
        });
      });
    }

    window.__scrollToSection = scrollToSection;
    bindHashScroll(scrollToSection);
  } else {
    window.__lenis = null;
    window.__scrollToSection = scrollToSectionNative;
    bindHashScroll(scrollToSectionNative);
  }

  // Lightweight reveals (mobile + reduced motion + no GSAP)
  const reveals = document.querySelectorAll(".reveal");
  const contactPanelFallback = document.querySelector("[data-contact-panel]");
  const useLiteReveals =
    reducedMotion || preferNativeScroll || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined";

  if (useLiteReveals) {
    if (contactPanelFallback) contactPanelFallback.classList.add("is-in");
    document.querySelectorAll(".projects__item").forEach((el) => el.classList.add("is-visible"));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
      );
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("is-visible"));
    }
  }

  // Full GSAP motion — desktop only
  if (!reducedMotion && !preferNativeScroll && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ force3D: true });
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(300, 16);
    }

    gsap.set(".reveal", { autoAlpha: 0, y: 18 });
    ScrollTrigger.batch(".reveal", {
      start: "top 92%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.04,
          overwrite: true,
          onStart() {
            batch.forEach((el) => el.classList.add("is-visible"));
          },
        });
      },
    });

    const contactPanel = document.querySelector("[data-contact-panel]");
    if (contactPanel && !contactPanel.classList.contains("is-in")) {
      const rises = contactPanel.querySelectorAll("[data-contact-rise]");
      gsap.set(contactPanel, { autoAlpha: 0.55, y: 0, force3D: true });
      if (rises.length) gsap.set(rises, { autoAlpha: 0.7, y: 0, force3D: true });

      const contactTl = gsap.timeline({
        scrollTrigger: {
          trigger: contactPanel,
          start: "top 96%",
          once: true,
        },
        defaults: { ease: "power2.out" },
      });

      contactTl.to(contactPanel, {
        autoAlpha: 1,
        duration: 0.4,
        onStart() {
          contactPanel.classList.add("is-in");
        },
      });

      if (rises.length) {
        contactTl.to(
          rises,
          {
            autoAlpha: 1,
            duration: 0.3,
            stagger: 0.03,
          },
          "-=0.25"
        );
      }
    }

    const projectItems = gsap.utils.toArray(".projects__item");
    if (projectItems.length) {
      gsap.set(projectItems, { autoAlpha: 0, y: 18 });
      ScrollTrigger.batch(projectItems, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
            overwrite: true,
          });
        },
      });
    }

    const glow = document.querySelector(".hero__glow");
    if (glow) {
      gsap.to(glow, {
        y: 40,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.85,
        },
      });
    }

    const footer = document.querySelector("[data-footer]");
    if (footer) {
      const watermark = footer.querySelector("[data-footer-parallax]");
      const monogram = footer.querySelector("[data-footer-parallax-slow]");
      if (watermark) {
        gsap.set(watermark, { x: 0, yPercent: -50 });
        gsap.to(watermark, {
          y: 28,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
      if (monogram) {
        gsap.to(monogram, {
          y: 16,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }
  }

  function bindPointerRaf(el, onMove, onLeave) {
    let raf = 0;
    let latest = null;
    el.addEventListener(
      "pointermove",
      (e) => {
        latest = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (latest) onMove(latest);
        });
      },
      { passive: true }
    );
    el.addEventListener("pointerleave", () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      latest = null;
      onLeave();
    });
  }

  // Magnetic + tilt — fine pointer / desktop only (never on phones)
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".btn").forEach((btn) => {
      bindPointerRaf(
        btn,
        (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate3d(${x * 0.12}px, ${y * 0.16}px, 0)`;
        },
        () => {
          btn.style.transform = "";
        }
      );
    });

    const visual = document.querySelector(".hero__visual");
    if (visual) {
      const frame = visual.querySelector(".hero__frame");
      bindPointerRaf(
        visual,
        (e) => {
          if (!frame) return;
          const rect = visual.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          frame.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 5}deg)`;
        },
        () => {
          if (frame) frame.style.transform = "";
        }
      );
    }

    function bindTiltCards(selector, glowSelector, strength = 5) {
      document.querySelectorAll(selector).forEach((card) => {
        const glow = card.querySelector(glowSelector);
        bindPointerRaf(
          card,
          (e) => {
            const rect = card.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const px = (mx / rect.width - 0.5) * 2;
            const py = (my / rect.height - 0.5) * 2;
            card.style.transform = `perspective(1000px) rotateY(${px * strength}deg) rotateX(${-py * (strength - 1)}deg) translate3d(0,-5px,0)`;
            if (glow) {
              glow.style.setProperty("--gx", `${(mx / rect.width) * 100}%`);
              glow.style.setProperty("--gy", `${(my / rect.height) * 100}%`);
            }
          },
          () => {
            card.style.transform = "";
            if (glow) {
              glow.style.setProperty("--gx", "50%");
              glow.style.setProperty("--gy", "35%");
            }
          }
        );
      });
    }

    bindTiltCards("[data-skill-card]", "[data-skill-glow]", 4);
  }

  // Stat counters
  const stats = document.querySelectorAll("[data-count]");
  const countIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.getAttribute("data-count") || 0);
        if (!target) {
          el.textContent = "—";
          countIo.unobserve(el);
          return;
        }
        const suffix = el.getAttribute("data-suffix") || "";
        const decimals = Number(el.getAttribute("data-decimals") || 0);
        const duration = preferNativeScroll ? 900 : 1400;
        const start = performance.now();
        function format(value) {
          if (decimals > 0) return value.toFixed(decimals);
          return String(Math.round(value));
        }
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const current = target * eased;
          el.textContent = `${format(p === 1 ? target : current)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countIo.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  stats.forEach((s) => countIo.observe(s));

  // Drive Lenis via rAF when GSAP ticker is not handling it
  if (lenis && (typeof gsap === "undefined" || reducedMotion || preferNativeScroll)) {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();
