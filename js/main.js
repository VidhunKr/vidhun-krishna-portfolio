(function () {
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const config = window.PORTFOLIO_CONFIG || {};
  const social = config.SOCIAL || {};
  document.querySelectorAll("[data-social]").forEach((link) => {
    const key = link.getAttribute("data-social");
    const href = social[key];
    if (!href) {
      link.setAttribute("hidden", "");
      return;
    }
    link.setAttribute("href", href);
    if (key !== "email") {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reducedMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 18;
      let raf = 0;
      let latest = null;
      el.addEventListener(
        "pointermove",
        (e) => {
          latest = e;
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            if (!latest) return;
            const rect = el.getBoundingClientRect();
            const x = latest.clientX - rect.left - rect.width / 2;
            const y = latest.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate3d(${x / strength}px, ${y / strength - 3}px, 0)`;
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
        el.style.transform = "";
      });
    });
  }

  // Official-ish brand marks via Simple Icons CDN; unknown techs get initials.
  const TECH_LOGOS = {
    Angular: ["angular", "DD0031"],
    TypeScript: ["typescript", "3178C6"],
    JavaScript: ["javascript", "F7DF1E"],
    HTML5: ["html5", "E34F26"],
    CSS3: ["css", "663399"],
    SCSS: ["sass", "CC6699"],
    Bootstrap: ["bootstrap", "7952B3"],
    RxJS: ["reactivex", "B7178C"],
    "Angular Material": ["materialdesign", "757575"],
    Ionic: ["ionic", "3880FF"],
    Cordova: ["apachecordova", "E8E8E8"],
    "Node.js": ["nodedotjs", "5FA04E"],
    "Express.js": ["express", "FFFFFF"],
    MongoDB: ["mongodb", "47A248"],
    React: ["react", "61DAFB"],
    Firebase: ["firebase", "DD2C00"],
    "Chart.js": ["chartdotjs", "FF6384"],
    Git: ["git", "F05032"],
    GitHub: ["github", "FFFFFF"],
    "VS Code": ["visualstudiocode", "007ACC"],
    Figma: ["figma", "F24E1E"],
  };

  function techInitials(name) {
    return String(name)
      .split(/[\s./-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function logoForTech(name) {
    const entry = TECH_LOGOS[name];
    if (!entry) {
      return `<span class="skills__logo-mark">${techInitials(name)}</span>`;
    }
    const [slug, color] = entry;
    const src = `https://cdn.simpleicons.org/${slug}/${color}`;
    const initials = techInitials(name);
    return `<img src="${src}" alt="" width="24" height="24" loading="lazy" decoding="async" data-fallback="${initials}" onerror="this.outerHTML='<span class=&quot;skills__logo-mark&quot;>'+this.dataset.fallback+'</span>'" />`;
  }

  const CATEGORY_ACCENTS = {
    Frontend: "#5b8cff",
    "UI Libraries": "#8fa8ff",
    "Mobile Development": "#7eb6ff",
    Backend: "#6fbf73",
    Database: "#9bb0d4",
    "Tools & Workflow": "#c4a574",
  };

  const featuredSet = new Set(window.PORTFOLIO_SKILL_FEATURED || []);

  // Skills — compact interactive tech showcase carousel
  const carousel = document.querySelector("[data-skills-carousel]");
  const tabsRoot = document.querySelector("[data-skills-tabs]");
  const track = document.querySelector("[data-skills-track]");
  const counterEl = document.querySelector("[data-skills-counter]");
  const progressEl = document.querySelector("[data-skills-progress]");
  const prevBtn = document.querySelector("[data-skills-prev]");
  const nextBtn = document.querySelector("[data-skills-next]");
  const viewport = carousel?.querySelector("[data-skills-viewport]");

  if (carousel && tabsRoot && track && viewport && window.PORTFOLIO_SKILLS) {
    const categories = Object.entries(window.PORTFOLIO_SKILLS);
    const total = categories.length;
    let index = 0;
    let autoTimer = null;
    let resumeTimer = null;
    let animLock = false;
    let animUnlockTimer = null;
    let paused = false;
    let sectionInView = false;
    const AUTO_MS = 3000;
    const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SLIDE_MS = reduceMotionMQ ? 0 : 850;
    const FADE_MS = reduceMotionMQ ? 0 : 280;

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    tabsRoot.innerHTML = categories
      .map(([category], i) => {
        const accent = CATEGORY_ACCENTS[category] || "#5b8cff";
        return `<button
          class="skills__tab${i === 0 ? " is-active" : ""}"
          type="button"
          role="tab"
          id="skills-tab-${i}"
          aria-selected="${i === 0 ? "true" : "false"}"
          aria-controls="skills-slide-${i}"
          data-skills-tab="${i}"
          style="--skill-accent:${accent}"
        ><span class="skills__tab-index">${pad(i + 1)}</span>${category}</button>`;
      })
      .join("");

    track.innerHTML = categories
      .map(([category, items], i) => {
        const accent = CATEGORY_ACCENTS[category] || "#5b8cff";
        return `
      <div
        class="skills__slide${i === 0 ? " is-active" : ""}"
        id="skills-slide-${i}"
        role="tabpanel"
        aria-labelledby="skills-tab-${i}"
        data-skills-slide="${i}"
        style="--skill-accent:${accent}"
        aria-hidden="${i === 0 ? "false" : "true"}"
      >
        <div class="skills__slide-head">
          <p class="skills__slide-label"><span>${pad(i + 1)}</span> ${category}</p>
          <span class="skills__slide-count">${items.length} tech</span>
        </div>
        <ul class="skills__grid">
          ${items
            .map((item) => {
              const featured = featuredSet.has(item);
              return `
            <li class="skills__tile${featured ? " skills__tile--featured" : ""}" data-skill-card>
              <article class="skills__card">
                <span class="skills__card-border" aria-hidden="true"></span>
                <div class="skills__card-glow" data-skill-glow aria-hidden="true"></div>
                <span class="skills__logo" aria-hidden="true">${logoForTech(item)}</span>
                <span class="skills__name">${item}</span>
              </article>
            </li>`;
            })
            .join("")}
        </ul>
      </div>`;
      })
      .join("");

    const slides = Array.from(track.querySelectorAll("[data-skills-slide]"));
    const tabs = Array.from(tabsRoot.querySelectorAll("[data-skills-tab]"));

    function setTrack(i, instant) {
      if (instant || reduceMotionMQ) {
        track.classList.add("is-instant");
        track.style.transform = `translate3d(-${i * 100}%, 0, 0)`;
        void track.offsetWidth;
        track.classList.remove("is-instant");
      } else {
        track.classList.remove("is-instant");
        track.style.transform = `translate3d(-${i * 100}%, 0, 0)`;
      }
    }

    function scrollTabIntoView(i) {
      const activeTab = tabs[i];
      if (!activeTab || !tabsRoot) return;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const rootWidth = tabsRoot.clientWidth;
      const target = tabLeft - (rootWidth - tabWidth) / 2;
      const max = tabsRoot.scrollWidth - rootWidth;
      const nextScroll = Math.max(0, Math.min(target, max));
      if (typeof tabsRoot.scrollTo === "function") {
        tabsRoot.scrollTo({ left: nextScroll, behavior: reduceMotionMQ ? "auto" : "smooth" });
      } else {
        tabsRoot.scrollLeft = nextScroll;
      }
    }

    function syncChrome(i) {
      const accent = CATEGORY_ACCENTS[categories[i][0]] || "#5b8cff";
      carousel.style.setProperty("--skill-accent", accent);
      viewport.style.setProperty("--skill-accent", accent);

      slides.forEach((slide, s) => {
        const active = s === i;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });

      tabs.forEach((tab, t) => {
        const active = t === i;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });

      scrollTabIntoView(i);

      if (counterEl) counterEl.textContent = `${pad(i + 1)} / ${pad(total)}`;
      if (progressEl) {
        // Soft progress — never snap back to 0%
        progressEl.style.width = `${((i + 1) / total) * 100}%`;
      }
    }

    function unlockAnim() {
      animLock = false;
      if (animUnlockTimer) {
        clearTimeout(animUnlockTimer);
        animUnlockTimer = null;
      }
      viewport.classList.remove("is-crossfading");
    }

    function finishGoTo(next, { user = false, instant = false } = {}) {
      index = next;
      setTrack(index, instant || reduceMotionMQ);
      syncChrome(index);

      if (user) pauseForInteraction();
      else if (sectionInView && !paused) startAutoplay();
    }

    function goTo(nextIndex, { user = false, instant = false } = {}) {
      const next = ((nextIndex % total) + total) % total;
      if (next === index) {
        if (user) pauseForInteraction();
        return;
      }
      if (animLock && !instant) return;

      const wraps =
        !instant &&
        !reduceMotionMQ &&
        ((index === total - 1 && next === 0) || (index === 0 && next === total - 1));

      animLock = !instant && !reduceMotionMQ;
      if (animUnlockTimer) clearTimeout(animUnlockTimer);

      if (wraps) {
        // Fade instead of sliding across every panel when looping
        viewport.classList.add("is-crossfading");
        animUnlockTimer = window.setTimeout(() => {
          finishGoTo(next, { user, instant: true });
          requestAnimationFrame(() => {
            viewport.classList.remove("is-crossfading");
            animUnlockTimer = window.setTimeout(unlockAnim, FADE_MS + 40);
          });
        }, FADE_MS);
        return;
      }

      if (animLock) animUnlockTimer = window.setTimeout(unlockAnim, SLIDE_MS + 40);
      finishGoTo(next, { user, instant });
    }

    function clearAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function clearResume() {
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    }

    function canAutoplay() {
      return !reduceMotionMQ && sectionInView && !paused && document.visibilityState !== "hidden" && total > 1;
    }

    function startAutoplay() {
      clearAuto();
      if (!canAutoplay()) return;
      // Use timeout chain so each advance waits a full 3s after the previous settles
      autoTimer = window.setTimeout(() => {
        autoTimer = null;
        if (!canAutoplay()) return;
        unlockAnim();
        goTo(index + 1);
      }, AUTO_MS);
    }

    function pauseForInteraction() {
      paused = true;
      clearAuto();
      clearResume();
      resumeTimer = window.setTimeout(() => {
        paused = false;
        startAutoplay();
      }, AUTO_MS);
    }

    function resetToFirstTab({ start = false } = {}) {
      unlockAnim();
      index = 0;
      setTrack(0, true);
      syncChrome(0);
      paused = false;
      clearResume();
      clearAuto();
      if (start) startAutoplay();
    }

    // Fixed stage height from densest slide — sparse slides stay centered, no jump
    function lockStageHeight() {
      const prev = track.style.transform;
      track.classList.add("is-instant");
      track.style.transform = "translate3d(0,0,0)";

      let max = 0;
      slides.forEach((slide) => {
        slide.classList.add("is-measuring");
        slide.style.minHeight = "auto";
        max = Math.max(max, slide.scrollHeight);
        slide.classList.remove("is-measuring");
      });

      const h = Math.max(Math.ceil(max), 200);
      slides.forEach((slide) => {
        slide.style.minHeight = `${h}px`;
      });
      viewport.style.height = `${h}px`;

      track.style.transform = prev || `translate3d(-${index * 100}%, 0, 0)`;
      requestAnimationFrame(() => track.classList.remove("is-instant"));
    }

    track.addEventListener("transitionend", (e) => {
      if (e.target !== track || e.propertyName !== "transform") return;
      unlockAnim();
    });

    prevBtn?.addEventListener("click", () => {
      unlockAnim();
      goTo(index - 1, { user: true });
    });
    nextBtn?.addEventListener("click", () => {
      unlockAnim();
      goTo(index + 1, { user: true });
    });
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        unlockAnim();
        goTo(Number(tab.getAttribute("data-skills-tab")), { user: true });
      });
    });

    // Keep autoplay running while the section is visible — only real clicks pause it
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clearAuto();
      else if (sectionInView && !paused) startAutoplay();
    });

    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        unlockAnim();
        goTo(index + 1, { user: true });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        unlockAnim();
        goTo(index - 1, { user: true });
      } else if (e.key === "Home") {
        e.preventDefault();
        unlockAnim();
        goTo(0, { user: true });
      } else if (e.key === "End") {
        e.preventDefault();
        unlockAnim();
        goTo(total - 1, { user: true });
      }
    });

    let touchX = 0;
    let touchY = 0;
    let swiping = false;
    viewport.addEventListener(
      "touchstart",
      (e) => {
        const t = e.changedTouches[0];
        touchX = t.clientX;
        touchY = t.clientY;
        swiping = true;
        clearAuto();
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      (e) => {
        if (!swiping) return;
        swiping = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchX;
        const dy = t.clientY - touchY;
        if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) {
          if (!paused) startAutoplay();
          return;
        }
        unlockAnim();
        goTo(dx < 0 ? index + 1 : index - 1, { user: true });
      },
      { passive: true }
    );

    if (!reduceMotionMQ && !reducedMotion) {
      track.querySelectorAll("[data-skill-card]").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--gx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty("--gy", `${((e.clientY - rect.top) / rect.height) * 100}%`);
        });
      });
    }

    // Refresh / load: always show Frontend first — autoplay only after section is reached
    resetToFirstTab({ start: false });

    const skillsSection = document.getElementById("skills") || carousel;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== skillsSection) return;
            if (entry.isIntersecting) {
              const wasOut = !sectionInView;
              sectionInView = true;
              if (wasOut) {
                // Entering the section → Frontend first, then auto-advance every 3s
                resetToFirstTab({ start: true });
              } else {
                startAutoplay();
              }
            } else {
              sectionInView = false;
              clearAuto();
              clearResume();
              paused = false;
              resetToFirstTab({ start: false });
            }
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(skillsSection);
    } else {
      sectionInView = true;
      startAutoplay();
    }

    const scheduleLock = () => {
      requestAnimationFrame(() => {
        lockStageHeight();
        setTrack(index, true);
      });
    };
    scheduleLock();
    window.addEventListener("resize", scheduleLock);
    window.addEventListener("load", () => {
      resetToFirstTab({ start: sectionInView });
      scheduleLock();
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) resetToFirstTab({ start: sectionInView });
    });
    if (document.fonts?.ready) document.fonts.ready.then(scheduleLock).catch(() => {});
    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", scheduleLock, { once: true });
    });
  }

  // Projects
  const projectsRoot = document.querySelector("[data-projects]");
  if (projectsRoot && window.PORTFOLIO_PROJECTS) {
    projectsRoot.innerHTML = window.PORTFOLIO_PROJECTS.map((project, index) => {
      const live =
        project.liveUrl && project.liveUrl.trim()
          ? `<a class="projects__link" href="${project.liveUrl}" target="_blank" rel="noopener noreferrer">View Project</a>`
          : `<span class="projects__link projects__link--disabled">View Project — soon</span>`;
      const github =
        project.githubUrl && project.githubUrl.trim()
          ? `<a class="projects__link" href="${project.githubUrl}" target="_blank" rel="noopener noreferrer">GitHub</a>`
          : `<span class="projects__link projects__link--disabled">GitHub — private</span>`;

      const portraitMedia = /clikpay/i.test(project.id || "") ? " projects__media--portrait" : "";
      return `
      <article class="projects__item ${project.featured ? "projects__item--featured" : ""}">
        <div class="projects__media${portraitMedia}">
          <span class="projects__badge">${project.badge || "Project"}</span>
          <img src="${project.image}" alt="${project.name} preview" loading="${index === 0 ? "eager" : "lazy"}" width="1200" height="750" />
        </div>
        <div class="projects__content">
          <p class="projects__category">${project.category}</p>
          <h3 class="projects__name">${project.name}</h3>
          <p class="projects__desc">${project.description}</p>
          <div class="projects__tech">
            ${project.tech.map((t) => `<span class="tech-chip">${t}</span>`).join("")}
          </div>
          <div class="projects__links">${live}${github}</div>
        </div>
      </article>`;
    }).join("");
  }

  // Experience
  const expRoot = document.querySelector("[data-experience]");
  if (expRoot) {
    const items = window.PORTFOLIO_EXPERIENCE || [];
    if (!items.length) {
      expRoot.innerHTML = `
        <div class="experience__empty reveal">
          <p>Add your roles in <code>js/data/experience.js</code>.</p>
        </div>`;
    } else {
      expRoot.innerHTML = `
        <div class="experience__timeline">
          ${items
            .map(
              (item) => `
            <article class="experience__item reveal">
              <span class="experience__dot" aria-hidden="true"></span>
              <h3 class="experience__role">${item.role}</h3>
              <p class="experience__company">${item.company}</p>
              <p class="experience__duration">${item.duration}</p>
              <ul class="experience__duties">
                ${(item.duties || []).map((d) => `<li>${d}</li>`).join("")}
              </ul>
              <div class="experience__tech">
                ${(item.tech || []).map((t) => `<span class="tech-chip">${t}</span>`).join("")}
              </div>
            </article>`
            )
            .join("")}
        </div>`;
    }
  }

})();
