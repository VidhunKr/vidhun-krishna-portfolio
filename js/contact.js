(function () {
  const config = window.PORTFOLIO_CONFIG || {};
  const SCRIPT_URL = String(config.GOOGLE_SCRIPT_URL || "").trim();

  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const submitBtn = form.querySelector("[data-submit-btn]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const status = form.querySelector("[data-form-status]");
  const dialog = document.querySelector("[data-form-dialog]");
  const dialogTitle = dialog?.querySelector("[data-form-dialog-title]");
  const dialogDesc = dialog?.querySelector("[data-form-dialog-desc]");
  const dialogAction = dialog?.querySelector("[data-form-dialog-action]");
  const dialogEyebrow = dialog?.querySelector("[data-form-dialog-eyebrow]");
  const dialogMetaText = dialog?.querySelector("[data-form-dialog-meta-text]");
  const dialogActionLabel = dialog?.querySelector("[data-form-dialog-action-label]");
  const fields = {
    name: form.querySelector("#name"),
    email: form.querySelector("#email"),
    message: form.querySelector("#message"),
  };

  const LIMITS = {
    nameMin: 2,
    nameMax: 60,
    messageMin: 10,
    messageMax: 1000,
  };

  let submitting = false;
  let autoCloseTimer = null;
  let previouslyFocused = null;
  let attemptedSubmit = false;

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function clearFieldError(input) {
    if (!input) return;
    const wrap = input.closest(".contact__field");
    if (!wrap) return;
    wrap.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    const err = wrap.querySelector(".contact__error");
    if (err) err.textContent = "";
  }

  function clearFieldErrors() {
    Object.values(fields).forEach((input) => clearFieldError(input));
  }

  function setFieldError(input, message) {
    if (!input) return;
    const wrap = input.closest(".contact__field");
    if (!wrap) return;
    wrap.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    let err = wrap.querySelector(".contact__error");
    if (!err) {
      err = document.createElement("p");
      err.className = "contact__error";
      err.setAttribute("aria-live", "polite");
      wrap.appendChild(err);
    }
    err.textContent = message;
  }

  function getValues() {
    return {
      name: String(fields.name?.value || "").trim().replace(/\s+/g, " "),
      email: String(fields.email?.value || "").trim().toLowerCase(),
      message: String(fields.message?.value || "").trim(),
      honey: String(form.querySelector('[name="_honey"]')?.value || ""),
    };
  }

  function validateName(name) {
    if (!name) return "Please enter your full name.";
    if (name.length < LIMITS.nameMin) return `Name must be at least ${LIMITS.nameMin} characters.`;
    if (name.length > LIMITS.nameMax) return `Name must be under ${LIMITS.nameMax} characters.`;
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
      return "Use letters only (spaces, hyphens, and apostrophes allowed).";
    }
    if (!/[A-Za-z]{2,}/.test(name.replace(/[^A-Za-z]/g, ""))) {
      return "Please enter a valid name.";
    }
    return "";
  }

  function validateEmail(email) {
    if (!email) return "Please enter your email address.";
    // Practical email check: local@domain.tld
    if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
        email
      )
    ) {
      return "Please enter a valid email address.";
    }
    if (email.length > 120) return "Email is too long.";
    return "";
  }

  function validateMessage(message) {
    if (!message) return "Please enter your message.";
    if (message.length < LIMITS.messageMin) {
      return `Message should be at least ${LIMITS.messageMin} characters.`;
    }
    if (message.length > LIMITS.messageMax) {
      return `Message must be under ${LIMITS.messageMax} characters.`;
    }
    return "";
  }

  function fieldErrorFor(key, values) {
    if (key === "name") return validateName(values.name);
    if (key === "email") return validateEmail(values.email);
    if (key === "message") return validateMessage(values.message);
    return "";
  }

  function validate(values, { focusFirst = false } = {}) {
    let ok = true;
    let firstInvalid = null;

    ["name", "email", "message"].forEach((key) => {
      const input = fields[key];
      const message = fieldErrorFor(key, values);
      if (message) {
        setFieldError(input, message);
        ok = false;
        if (!firstInvalid) firstInvalid = input;
      } else {
        clearFieldError(input);
      }
    });

    if (!ok && focusFirst && firstInvalid) {
      // preventScroll: Lenis owns page scroll — native jump feels stuck/janky
      firstInvalid.focus({ preventScroll: true });
      const lenis = window.__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(firstInvalid, {
          offset: -120,
          duration: 0.85,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
      } else {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return ok;
  }

  function dismissValidationFeedback() {
    if (typeof window.clearSnackbars === "function") {
      window.clearSnackbars();
    }
    setStatus("");
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("is-loading", isLoading);
    if (submitLabel) {
      submitLabel.textContent = isLoading ? "Sending..." : "Send Message";
    }
  }

  function clearAutoClose() {
    if (autoCloseTimer) {
      window.clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
  }

  function closeDialog() {
    if (!dialog || dialog.hidden) return;
    clearAutoClose();
    dialog.classList.remove("is-visible");
    dialog.setAttribute("hidden", "");
    document.body.classList.remove("form-dialog-open");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  }

  function openDialog(type) {
    if (!dialog) return;
    clearAutoClose();
    previouslyFocused = document.activeElement;

    const isSuccess = type === "success";
    dialog.classList.toggle("form-dialog--success", isSuccess);
    dialog.classList.toggle("form-dialog--error", !isSuccess);

    if (dialogEyebrow) {
      dialogEyebrow.textContent = isSuccess ? "Sent successfully" : "Send failed";
    }
    if (dialogTitle) {
      dialogTitle.textContent = isSuccess ? "Message delivered" : "Couldn't send that";
    }
    if (dialogDesc) {
      dialogDesc.textContent = isSuccess
        ? "Thanks for reaching out — I’ll get back to you soon."
        : "Something went wrong. Please try again in a moment.";
    }
    if (dialogMetaText) {
      dialogMetaText.textContent = isSuccess
        ? "Notification sent to my inbox"
        : "No message was delivered";
    }
    if (dialogActionLabel) {
      dialogActionLabel.textContent = isSuccess ? "Continue Exploring" : "Try Again";
    } else if (dialogAction) {
      dialogAction.textContent = isSuccess ? "Continue Exploring" : "Try Again";
    }

    dialog.removeAttribute("hidden");
    void dialog.offsetWidth;
    dialog.classList.add("is-visible");
    document.body.classList.add("form-dialog-open");
    dialogAction?.focus();

    if (isSuccess) {
      autoCloseTimer = window.setTimeout(() => {
        closeDialog();
      }, 4200);
    }
  }

  async function sendMessage(values) {
    if (!SCRIPT_URL) {
      throw new Error("Contact form is not configured.");
    }

    const body = new FormData();
    body.append("name", values.name);
    body.append("email", values.email);
    body.append("message", values.message);
    body.append("formType", "ContactForm");
    body.append("Submitted At", new Date().toISOString());

    await fetch(SCRIPT_URL, {
      method: "POST",
      body,
      mode: "no-cors",
    });
  }

  Object.entries(fields).forEach(([key, input]) => {
    if (!input) return;

    input.addEventListener("input", () => {
      // Auto-close this field's validation as soon as the user types
      clearFieldError(input);
      dismissValidationFeedback();
    });

    input.addEventListener("blur", () => {
      const raw = String(input.value || "").trim();
      // Don't nag empty fields until the user has tried to submit
      if (!attemptedSubmit && !raw) {
        clearFieldError(input);
        return;
      }
      const message = fieldErrorFor(key, getValues());
      if (message) setFieldError(input, message);
      else clearFieldError(input);
    });
  });

  // Hard length caps while typing
  if (fields.name) fields.name.setAttribute("maxlength", String(LIMITS.nameMax));
  if (fields.email) fields.email.setAttribute("maxlength", "120");
  if (fields.message) fields.message.setAttribute("maxlength", String(LIMITS.messageMax));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;

    const values = getValues();
    if (values.honey) return;

    attemptedSubmit = true;

    if (!validate(values, { focusFirst: true })) {
      setStatus("");
      if (typeof window.showSnackbar === "function") {
        window.showSnackbar("Please fix the highlighted fields.", "info", 2800);
      }
      return;
    }

    submitting = true;
    setLoading(true);
    setStatus("Sending your message...");
    dismissValidationFeedback();

    try {
      await sendMessage(values);
      form.reset();
      attemptedSubmit = false;
      clearFieldErrors();
      setStatus("");
      openDialog("success");
    } catch (_err) {
      setStatus("");
      openDialog("error");
    } finally {
      submitting = false;
      setLoading(false);
    }
  });

  dialog?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches("[data-form-dialog-close]")) {
      closeDialog();
    }
  });

  dialogAction?.addEventListener("click", () => {
    const isError = dialog?.classList.contains("form-dialog--error");
    closeDialog();
    if (isError) {
      form.requestSubmit();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog && !dialog.hidden) {
      e.preventDefault();
      closeDialog();
    }
  });
})();
