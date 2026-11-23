(function () {
  const ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5M12 16.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 11v5M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  function ensureHost() {
    let host = document.querySelector(".snackbar-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "snackbar-host";
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-relevant", "additions");
      document.body.appendChild(host);
    }
    return host;
  }

  window.clearSnackbars = function clearSnackbars() {
    const host = document.querySelector(".snackbar-host");
    if (!host) return;
    host.querySelectorAll(".snackbar").forEach((el) => {
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 280);
    });
  };

  window.showSnackbar = function showSnackbar(message, type = "info", duration = 3500) {
    const host = ensureHost();
    window.clearSnackbars();
    const el = document.createElement("div");
    const safeType = ["success", "error", "info"].includes(type) ? type : "info";
    el.className = `snackbar snackbar--${safeType}`;
    el.setAttribute("role", safeType === "error" ? "alert" : "status");
    el.innerHTML = `
      <div class="snackbar__icon">${ICONS[safeType]}</div>
      <div class="snackbar__body"><p class="snackbar__title"></p></div>
      <div class="snackbar__progress" aria-hidden="true"></div>
    `;
    el.querySelector(".snackbar__title").textContent = message;
    host.appendChild(el);

    const timer = window.setTimeout(() => {
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 320);
    }, duration);

    el.addEventListener("click", () => {
      window.clearTimeout(timer);
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 320);
    });
  };
})();
