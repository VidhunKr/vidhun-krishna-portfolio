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

  let submitting = false;
  let autoCloseTimer = null;
  let previouslyFocused = null;

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function clearFieldErrors() {
    form.querySelectorAll(".contact__field").forEach((field) => {
      field.classList.remove("has-error");
      const err = field.querySelector(".contact__error");
      if (err) err.textContent = "";
    });
  }

  function setFieldError(input, message) {
    if (!input) return;
    const wrap = input.closest(".contact__field");
    if (!wrap) return;
    wrap.classList.add("has-error");
    let err = wrap.querySelector(".contact__error");
    if (!err) {
      err = document.createElement("p");
      err.className = "contact__error";
      wrap.appendChild(err);
    }
    err.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getValues() {
    return {
      name: String(fields.name?.value || "").trim(),
      email: String(fields.email?.value || "").trim(),
      message: String(fields.message?.value || "").trim(),
      honey: String(form.querySelector('[name="_honey"]')?.value || ""),
    };
  }

  function validate(values) {
    clearFieldErrors();
    let ok = true;

    if (!values.name) {
      setFieldError(fields.name, "Please enter your name.");
      ok = false;
    }
    if (!values.email) {
      setFieldError(fields.email, "Please enter your email.");
      ok = false;
    } else if (!isValidEmail(values.email)) {
      setFieldError(fields.email, "Please enter a valid email address.");
      ok = false;
    }
    if (!values.message) {
      setFieldError(fields.message, "Please enter your message.");
      ok = false;
    } else if (values.message.length < 10) {
      setFieldError(fields.message, "Message should be at least 10 characters.");
      ok = false;
    }

    return ok;
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
    // Force reflow so enter animation runs
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

    // Apps Script web apps block readable CORS responses.
    // FormData + no-cors is the same AVS pattern; completed request = sent.
    await fetch(SCRIPT_URL, {
      method: "POST",
      body,
      mode: "no-cors",
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitting) return;

    const values = getValues();
    if (values.honey) return;

    if (!validate(values)) {
      setStatus("");
      if (typeof window.showSnackbar === "function") {
        window.showSnackbar("Please fill in all required fields.", "info");
      }
      return;
    }

    submitting = true;
    setLoading(true);
    setStatus("Sending your message...");

    try {
      await sendMessage(values);
      form.reset();
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
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog && !dialog.hidden) {
      e.preventDefault();
      closeDialog();
    }
  });
})();
