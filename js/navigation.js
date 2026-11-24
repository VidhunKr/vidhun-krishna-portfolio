(function () {
  const header = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobile = document.querySelector("[data-nav-mobile]");
  const desktopLinks = document.querySelectorAll("[data-nav-links] [data-nav-link]");
  const allNavLinks = document.querySelectorAll("[data-nav-link]");
  const indicator = document.querySelector("[data-nav-indicator]");
  const sections = document.querySelectorAll("main section[id]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let menuOpen = false;
  let menuClosing = false;
  let closeTimer = 0;
  let lastFocused = null;
  const MENU_CLOSE_MS = reducedMotion ? 0 : 560;

  function setScrolled() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function moveIndicator(activeLink) {
    if (!indicator || !activeLink) return;
    const linksWrap = activeLink.parentElement;
    if (!linksWrap) return;

    const wrapRect = linksWrap.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const left = linkRect.left - wrapRect.left;

    indicator.style.width = `${linkRect.width}px`;
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.opacity = "1";
  }

  function setActiveLink(id) {
    if (!id) return;
    // Services is not in the navbar — don't steal the active state
    if (id === "services") return;

    let activeDesktop = null;

    desktopLinks.forEach((link) => {
      const match = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", match);
      if (match) activeDesktop = link;
    });

    document.querySelectorAll(".nav__mobile-links [data-nav-link]").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });

    if (activeDesktop) moveIndicator(activeDesktop);
  }

  // Used by smooth-scroll click handlers so Contact doesn't look like Projects mid-flight
  window.__setActiveNavLink = setActiveLink;

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  function openMenu() {
    if (!toggle || !mobile || menuOpen || menuClosing) return;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    }

    menuOpen = true;
    menuClosing = false;
    lastFocused = document.activeElement;
    mobile.classList.remove("is-closing");
    toggle.classList.add("is-open");
    mobile.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    mobile.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");

    const focusable = getFocusable(mobile);
    if (focusable.length) focusable[0].focus({ preventScroll: true });
  }

  function closeMenu(opts = {}) {
    if (!toggle || !mobile || (!menuOpen && !menuClosing)) return;
    if (!menuOpen && menuClosing) return;

    menuOpen = false;
    menuClosing = true;
    toggle.classList.remove("is-open");
    mobile.classList.remove("is-open");
    mobile.classList.add("is-closing");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");

    // Skip focus restore on in-page nav — it fights Lenis scrollTo on mobile
    if (opts.restoreFocus !== false && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }

    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      mobile.classList.remove("is-closing");
      mobile.setAttribute("aria-hidden", "true");
      menuClosing = false;
      closeTimer = 0;
    }, MENU_CLOSE_MS);
  }

  window.__closeMobileNav = closeMenu;
  window.__isMobileNavOpen = () => menuOpen || document.body.classList.contains("nav-open");

  function revealNavbar() {
    if (!header) return;

    if (reducedMotion || typeof gsap === "undefined") {
      header.classList.add("is-ready");
      return;
    }

    const shell = header.querySelector(".nav-shell");
    const logo = header.querySelector(".logo");
    const links = header.querySelectorAll(".nav__link");
    const availability = header.querySelector(".nav__availability:not(.nav__availability--mobile)");
    const cta = header.querySelector(".nav__cta:not(.nav__cta--mobile)");
    const burger = header.querySelector(".nav__toggle");
    const logoHandoff = document.body.classList.contains("has-logo-handoff");

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => header.classList.add("is-ready"),
    });

    if (shell) {
      if (logoHandoff) {
        // Bar fades in under the flying crystal — no vertical slide so the landing stays locked
        tl.fromTo(shell, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
      } else {
        tl.fromTo(
          shell,
          { y: -18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          0
        );
      }
    }

    if (logo) {
      if (logoHandoff) {
        gsap.set(logo, { opacity: 1, y: 0 });
      } else {
        tl.fromTo(
          logo,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55 },
          0.15
        );
      }
    }

    if (links.length) {
      tl.fromTo(
        links,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.045 },
        0.28
      );
    }

    if (availability) {
      tl.fromTo(
        availability,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        0.42
      );
    }

    if (cta) {
      tl.fromTo(
        cta,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        0.48
      );
    }

    if (burger) {
      tl.fromTo(
        burger,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        0.35
      );
    }
  }

  setScrolled();

  // Update nav state on scroll without a perpetual rAF loop
  let scrollRaf = 0;
  let lastScrollY = window.scrollY;
  function onScrollTick() {
    scrollRaf = 0;
    const y = window.scrollY;
    if (y !== lastScrollY) {
      lastScrollY = y;
      setScrolled();
    }
  }
  window.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(onScrollTick);
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      const active = document.querySelector(".nav__link.is-active");
      if (active) moveIndicator(active);
      if (window.innerWidth >= 1024) closeMenu();
    },
    { passive: true }
  );

  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    mobile.addEventListener("keydown", (e) => {
      if (!menuOpen || e.key !== "Tab") return;
      const focusable = getFocusable(mobile);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) closeMenu();
  });

  allNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href") || "";
      const isSection = href.startsWith("#") && href.length > 1;
      if (menuOpen) closeMenu({ restoreFocus: !isSection });
      if (isSection) setActiveLink(href.slice(1));
    });
  });

  // Scroll-spy: pick the section under the navbar, force Contact near page end
  const navSectionIds = ["home", "about", "skills", "projects", "experience", "contact"];
  const navSections = Array.from(sections).filter((s) => navSectionIds.includes(s.id));

  function updateActiveFromScroll() {
    const scrollY = window.__lenis?.scroll ?? window.scrollY ?? 0;
    const maxScroll = Math.max(
      0,
      (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight
    );

    // Contact can't always reach the viewport center — lock active state near the bottom
    if (maxScroll > 0 && scrollY >= maxScroll - 140) {
      setActiveLink("contact");
      return;
    }

    const shell = document.querySelector(".nav-shell");
    const marker = (shell ? shell.getBoundingClientRect().height : header?.offsetHeight || 80) + 12;
    let current = "home";
    for (let i = 0; i < navSections.length; i += 1) {
      const section = navSections[i];
      const top = section.getBoundingClientRect().top;
      if (top - marker <= 0) current = section.id;
    }
    setActiveLink(current);
  }

  let spyRaf = 0;
  function queueSpy() {
    if (spyRaf) return;
    spyRaf = requestAnimationFrame(() => {
      spyRaf = 0;
      updateActiveFromScroll();
    });
  }

  window.addEventListener("scroll", queueSpy, { passive: true });
  window.addEventListener("resize", queueSpy, { passive: true });

  function bindLenisSpy() {
    const lenis = window.__lenis;
    if (!lenis || typeof lenis.on !== "function" || lenis.__navSpyBound) return;
    lenis.on("scroll", queueSpy);
    lenis.__navSpyBound = true;
  }
  bindLenisSpy();
  window.setTimeout(bindLenisSpy, 0);
  window.setTimeout(bindLenisSpy, 400);
  queueSpy();

  const topBtn = document.querySelector("[data-back-to-top]");
  if (topBtn) {
    topBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (reducedMotion) {
        window.scrollTo(0, 0);
        return;
      }
      // Lenis owns scrolling — native smooth scroll feels like a sudden jump
      const lenis = window.__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, {
          duration: 1.7,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function bootNavbar() {
    revealNavbar();
    requestAnimationFrame(() => {
      const active = document.querySelector(".nav__link.is-active");
      if (active) moveIndicator(active);
    });
  }

  // Wait for logo handoff (or full ready) — don't boot on early paint
  const preloader = document.querySelector(".preloader");
  function canBootNavbar() {
    return (
      document.body.classList.contains("has-logo-handoff") ||
      document.body.classList.contains("is-ready")
    );
  }

  if (preloader && !canBootNavbar()) {
    const readyObserver = new MutationObserver(() => {
      if (canBootNavbar()) {
        readyObserver.disconnect();
        bootNavbar();
      }
    });
    readyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // Safety: never leave the glass bar invisible if preloader handoff stalls
    window.setTimeout(() => {
      if (!header.classList.contains("is-ready")) bootNavbar();
    }, 4200);
  } else {
    bootNavbar();
  }
})();
