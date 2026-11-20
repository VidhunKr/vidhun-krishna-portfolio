(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealContactPanelNow() {
    const panel = document.querySelector("[data-contact-panel]");
    if (!panel || panel.classList.contains("is-in")) return;
    panel.classList.add("is-in");
    if (typeof gsap !== "undefined") {
      const rises = panel.querySelectorAll("[data-contact-rise]");
      gsap.killTweensOf([panel, ...rises]);
      gsap.set(panel, { autoAlpha: 1, y: 0, clearProps: "" });
      if (rises.length) gsap.set(rises, { autoAlpha: 1, y: 0 });
    } else {
      panel.style.opacity = "1";
      panel.style.transform = "none";
    }
  }

  window.__revealContactPanel = revealContactPanelNow;

  // Lenis smooth scroll — longer coast, softer wheel response
  let lenis;
  if (!reducedMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.65,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.55,
      wheelMultiplier: 0.68,
      infinite: false,
    });

    window.__lenis = lenis;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        // Back-to-top is handled separately for a true top scroll
        if (anchor.hasAttribute("data-back-to-top")) return;
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (id === "#contact") revealContactPanelNow();
        const header = document.querySelector("[data-nav]");
        const offset = header ? -(header.offsetHeight + 8) : -88;
        lenis.scrollTo(target, {
          offset,
          duration: id === "#contact" ? 0.85 : 1.15,
        });
      });
    });
  } else {
    document.querySelectorAll('a[href="#contact"]').forEach((anchor) => {
      anchor.addEventListener("click", () => revealContactPanelNow());
    });
  }

  // Reveal on scroll (fallback if GSAP missing)
  const reveals = document.querySelectorAll(".reveal");
  const contactPanelFallback = document.querySelector("[data-contact-panel]");
  if (reducedMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    if (contactPanelFallback) contactPanelFallback.classList.add("is-in");
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
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("is-visible"));
    }
  }

  if (!reducedMotion && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ force3D: true });
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      // Allow lag catch-up — lagSmoothing(0) caused scroll hitching
      gsap.ticker.lagSmoothing(500, 33);
    }

    // Batch reveals — fewer ScrollTriggers, play once
    gsap.set(".reveal", { autoAlpha: 0, y: 22 });
    ScrollTrigger.batch(".reveal", {
      start: "top 92%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.05,
          overwrite: true,
          onStart() {
            batch.forEach((el) => el.classList.add("is-visible"));
          },
        });
      },
    });

    // Contact panel: light rise — keep form readable quickly
    const contactPanel = document.querySelector("[data-contact-panel]");
    if (contactPanel && !contactPanel.classList.contains("is-in")) {
      const rises = contactPanel.querySelectorAll("[data-contact-rise]");
      gsap.set(contactPanel, { autoAlpha: 0.45, y: 18 });
      if (rises.length) gsap.set(rises, { autoAlpha: 0.55, y: 12 });

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
        y: 0,
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
            y: 0,
            duration: 0.35,
            stagger: 0.04,
          },
          "-=0.28"
        );
      }
    }

    gsap.utils.toArray(".projects__item").forEach((item) => {
      const media = item.querySelector(".projects__media");
      const content = item.querySelector(".projects__content");
      if (media) {
        gsap.from(media, {
          scrollTrigger: { trigger: item, start: "top 82%", once: true },
          y: 40,
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
        });
      }
      if (content) {
        gsap.from(content, {
          scrollTrigger: { trigger: item, start: "top 82%", once: true },
          y: 28,
          opacity: 0,
          duration: 0.75,
          delay: 0.08,
          ease: "power2.out",
        });
      }
    });

    // Soft scrub with lag so scroll stays smooth
    const glow = document.querySelector(".hero__glow");
    if (glow) {
      gsap.to(glow, {
        y: 56,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }

    const footer = document.querySelector("[data-footer]");
    if (footer) {
      const watermark = footer.querySelector("[data-footer-parallax]");
      const monogram = footer.querySelector("[data-footer-parallax-slow]");
      if (watermark) {
        gsap.set(watermark, { xPercent: -50, yPercent: -50 });
        gsap.to(watermark, {
          y: 40,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.75,
          },
        });
      }
      if (monogram) {
        gsap.to(monogram, {
          y: 24,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.75,
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

  // Magnetic buttons (rAF-throttled)
  if (!reducedMotion) {
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
  }

  // Hero + card tilt (lighter, rAF-throttled)
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
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

    document.querySelectorAll(".projects__media").forEach((card) => {
      bindPointerRaf(
        card,
        (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          card.style.transform = `translate3d(0,-4px,0) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg)`;
        },
        () => {
          card.style.transform = "";
        }
      );
    });

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

    bindTiltCards("[data-service-card]", "[data-service-glow]", 5);
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
        const duration = 1400;
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
  if (lenis && (typeof gsap === "undefined" || reducedMotion)) {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
})();
