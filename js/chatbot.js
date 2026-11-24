(function () {
  const root = document.querySelector("[data-chatbot]");
  if (!root) return;

  const MAX_LEN = 800;
  const MAX_TURNS = 12;
  const STORAGE_KEY = "vk_chatbot_v3";
  const SCRIPT_URL = String((window.PORTFOLIO_CONFIG || {}).GOOGLE_SCRIPT_URL || "").trim();

  const panel = root.querySelector("[data-chatbot-panel]");
  const launcher = root.querySelector("[data-chatbot-launcher]");
  const tipEl = root.querySelector("[data-chatbot-tip]");
  const tipTextEl = root.querySelector("[data-chatbot-tip-text]");
  const messagesEl = root.querySelector("[data-chatbot-messages]");
  const form = root.querySelector("[data-chatbot-form]");
  const input = root.querySelector("[data-chatbot-input]");
  const sendBtn = root.querySelector("[data-chatbot-send]");
  const statusEl = root.querySelector("[data-chatbot-status]");
  const suggestionsEl = root.querySelector("[data-chatbot-suggestions]");
  const charCountEl = root.querySelector("[data-chatbot-char]");

  const TIP_MESSAGES = [
    "Ask me anything",
    "About my skills?",
    "See my projects",
    "Need a quick intro?",
    "How can I help?",
  ];
  const SUGGESTIONS = [
    "What are your technical skills?",
    "Tell me about your projects.",
    "What is your Angular experience?",
    "Do you have experience with Ionic?",
    "What backend technologies do you know?",
    "How can I hire you?",
    "How can I contact you?",
    "Where are you based?",
    "What is your work experience?",
  ];
  const TIP_SHOW_MS = 4200;
  const TIP_FIRST_DELAY_MS = 4500;
  const TIP_INTERVAL_MS = 22000;
  const SUGGESTION_COUNT = 3;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let open = false;
  let busy = false;
  let submitted = false;
  let state = loadState();
  let tipIndex = 0;
  let tipHideTimer = 0;
  let tipLoopTimer = 0;
  let askedQuestions = new Set();

  function uid(prefix) {
    const r =
      crypto.randomUUID?.().replace(/-/g, "") ||
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}_${r}`.slice(0, 48);
  }

  function loadState() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "");
      return {
        id: String(parsed.id || uid("c")),
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        submitted: Boolean(parsed.submitted),
      };
    } catch {
      return { id: uid("c"), messages: [], submitted: false };
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: state.id, messages: state.messages, submitted })
      );
    } catch {
      /* ignore */
    }
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.toggle("is-error", Boolean(isError && text));
  }

  function hideTip() {
    window.clearTimeout(tipHideTimer);
    tipEl?.classList.remove("is-visible");
    if (tipEl) tipEl.hidden = true;
  }

  function showTip() {
    if (!tipEl || !tipTextEl || open || reducedMotion) return;
    tipTextEl.textContent = TIP_MESSAGES[tipIndex % TIP_MESSAGES.length];
    tipIndex += 1;
    tipEl.hidden = false;
    // Force reflow so the enter transition always plays
    void tipEl.offsetWidth;
    tipEl.classList.add("is-visible");
    window.clearTimeout(tipHideTimer);
    tipHideTimer = window.setTimeout(hideTip, TIP_SHOW_MS);
  }

  function scheduleTips() {
    if (reducedMotion || !tipEl) return;
    window.clearTimeout(tipLoopTimer);
    tipLoopTimer = window.setTimeout(function tipTick() {
      if (!open) showTip();
      tipLoopTimer = window.setTimeout(tipTick, TIP_INTERVAL_MS);
    }, TIP_FIRST_DELAY_MS);
  }

  function setPageScrollLocked(locked) {
    const lenis = window.__lenis;
    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    }
    document.documentElement.classList.toggle("chatbot-scroll-lock", locked);
    document.body.classList.toggle("chatbot-scroll-lock", locked);
  }

  function setOpen(next) {
    open = next;
    root.classList.toggle("is-open", open);
    launcher?.setAttribute("aria-expanded", open ? "true" : "false");
    panel?.setAttribute("aria-hidden", open ? "false" : "true");
    setPageScrollLocked(open);
    if (open) {
      hideTip();
      window.setTimeout(() => input?.focus(), 160);
    }
  }

  function scrollBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Keep wheel/touch scroll inside the chat — don’t pass it to the page/Lenis
  function keepScrollInsideChat(e) {
    if (!open) return;
    e.stopPropagation();
  }

  panel?.addEventListener("wheel", keepScrollInsideChat, { passive: true });
  panel?.addEventListener("touchmove", keepScrollInsideChat, { passive: true });
  messagesEl?.addEventListener("wheel", keepScrollInsideChat, { passive: true });
  messagesEl?.addEventListener("touchmove", keepScrollInsideChat, { passive: true });

  function addBubble(role, text) {
    const row = document.createElement("div");
    row.className = `chatbot__msg chatbot__msg--${role === "assistant" ? "bot" : "user"}`;
    const bubble = document.createElement("div");
    bubble.className = "chatbot__bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  function setTyping(on) {
    messagesEl.querySelector("[data-chatbot-typing]")?.remove();
    if (!on) return;
    const row = document.createElement("div");
    row.className = "chatbot__msg chatbot__msg--bot";
    row.setAttribute("data-chatbot-typing", "");
    const bubble = document.createElement("div");
    bubble.className = "chatbot__bubble chatbot__bubble--typing";
    bubble.setAttribute("aria-label", "Assistant is typing");
    bubble.innerHTML = "<span></span><span></span><span></span>";
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  function getReply(question) {
    return window.PORTFOLIO_CHAT?.reply?.(question) ||
      "Ask about Vidhun's skills, projects, experience, or contact details.";
  }

  function pickSuggestions(exclude) {
    const skip = new Set([...(exclude || []), ...askedQuestions]);
    const unused = SUGGESTIONS.filter((q) => !skip.has(q));
    const pool = unused.length >= SUGGESTION_COUNT ? unused : SUGGESTIONS.filter((q) => q !== exclude);
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SUGGESTION_COUNT);
  }

  function renderSuggestions(exclude) {
    if (!suggestionsEl) return;
    suggestionsEl.hidden = false;
    suggestionsEl.innerHTML = "";
    pickSuggestions(exclude).forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chatbot__chip";
      btn.setAttribute("data-chatbot-suggestion", q);
      btn.textContent = q;
      suggestionsEl.appendChild(btn);
    });
  }

  function renderWelcome() {
    askedQuestions = new Set();
    messagesEl.innerHTML = "";
    addBubble(
      "assistant",
      "Hi! I'm Vidhun's portfolio assistant. I can help you learn about his skills, projects, experience and background. What would you like to know?"
    );
    renderSuggestions();
  }

  function restore() {
    askedQuestions = new Set(
      state.messages.filter((m) => m.role === "user").map((m) => String(m.content || "").trim())
    );
    if (!state.messages.length) {
      renderWelcome();
      return;
    }
    messagesEl.innerHTML = "";
    state.messages.forEach((m) => addBubble(m.role, m.content));
    renderSuggestions();
  }

  function ask(raw) {
    if (busy) return;
    const content = String(raw || "").trim();
    if (!content) return setStatus("Please enter a message.", true);
    if (content.length > MAX_LEN) return setStatus(`Keep under ${MAX_LEN} characters.`, true);
    if (state.messages.filter((m) => m.role === "user").length >= MAX_TURNS) {
      return setStatus("Conversation limit reached. Start a new conversation.", true);
    }

    askedQuestions.add(content);
    addBubble("user", content);
    state.messages.push({ role: "user", content });
    persist();

    busy = true;
    if (sendBtn) sendBtn.disabled = true;
    if (input) input.disabled = true;
    setStatus("");
    setTyping(true);

    window.setTimeout(() => {
      const reply = getReply(content);
      setTyping(false);
      addBubble("assistant", reply);
      state.messages.push({ role: "assistant", content: reply });
      persist();
      busy = false;
      if (input) {
        input.disabled = false;
        input.value = "";
        input.focus();
      }
      updateChar();
      if (sendBtn) sendBtn.disabled = true;
      renderSuggestions(content);
    }, 350);
  }

  function transcriptText() {
    return state.messages
      .map((m) => `${m.role === "assistant" ? "Assistant" : "Visitor"}: ${m.content}`)
      .join("\n\n")
      .slice(0, 18000);
  }

  async function emailTranscript(reason, quiet) {
    if (submitted || !state.messages.some((m) => m.role === "user")) return true;
    if (!SCRIPT_URL) {
      if (!quiet) setStatus("Conversation ended.");
      submitted = true;
      persist();
      return true;
    }

    if (!quiet) setStatus("Saving conversation…");
    try {
      const body = new FormData();
      body.append("formType", "AIChatConversations");
      body.append("conversationId", state.id);
      body.append("sessionId", state.id);
      body.append("summary", `Chat with ${state.messages.filter((m) => m.role === "user").length} visitor question(s).`);
      body.append("transcript", transcriptText());
      body.append("messageCount", String(state.messages.length));
      body.append("reason", reason || "end");
      body.append("date", new Date().toISOString().slice(0, 10));
      body.append("time", new Date().toISOString().slice(11, 19) + "Z");
      body.append("Submitted At", new Date().toISOString());

      await fetch(SCRIPT_URL, { method: "POST", body, mode: "no-cors" });
      submitted = true;
      persist();
      if (!quiet) {
        setStatus("Conversation saved. Thanks for chatting!");
        window.showSnackbar?.("Conversation summary sent.", "success");
      }
      return true;
    } catch {
      if (!quiet) setStatus("Could not email this chat. You can retry End Conversation.", true);
      return false;
    }
  }

  function newChat() {
    void emailTranscript("new", true).finally(() => {
      submitted = false;
      state = { id: uid("c"), messages: [], submitted: false };
      persist();
      renderWelcome();
      setStatus("New conversation started.");
    });
  }

  function updateChar() {
    if (charCountEl && input) charCountEl.textContent = `${input.value.length}/${MAX_LEN}`;
  }

  launcher?.addEventListener("click", () => setOpen(!open));
  launcher?.addEventListener("mouseenter", hideTip);
  launcher?.addEventListener("focus", hideTip);
  root.querySelector("[data-chatbot-minimize]")?.addEventListener("click", () => {
    void emailTranscript("close", true);
    setOpen(false);
  });
  root.querySelector("[data-chatbot-new]")?.addEventListener("click", newChat);

  suggestionsEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chatbot-suggestion]");
    if (btn) ask(btn.getAttribute("data-chatbot-suggestion") || btn.textContent);
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input?.value);
  });

  input?.addEventListener("input", () => {
    updateChar();
    if (sendBtn) sendBtn.disabled = busy || !input.value.trim();
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form?.requestSubmit();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) {
      void emailTranscript("close", true);
      setOpen(false);
    }
  });

  submitted = Boolean(state.submitted);
  restore();
  updateChar();
  if (sendBtn) sendBtn.disabled = true;
  scheduleTips();
})();
