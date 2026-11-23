(function () {
  const root = document.querySelector("[data-chatbot]");
  if (!root) return;

  const MAX_LEN = 800;
  const MAX_TURNS = 12;
  const STORAGE_KEY = "vk_chatbot_v3";
  const SCRIPT_URL = String((window.PORTFOLIO_CONFIG || {}).GOOGLE_SCRIPT_URL || "").trim();

  const panel = root.querySelector("[data-chatbot-panel]");
  const launcher = root.querySelector("[data-chatbot-launcher]");
  const messagesEl = root.querySelector("[data-chatbot-messages]");
  const form = root.querySelector("[data-chatbot-form]");
  const input = root.querySelector("[data-chatbot-input]");
  const sendBtn = root.querySelector("[data-chatbot-send]");
  const statusEl = root.querySelector("[data-chatbot-status]");
  const suggestionsEl = root.querySelector("[data-chatbot-suggestions]");
  const charCountEl = root.querySelector("[data-chatbot-char]");

  let open = false;
  let busy = false;
  let submitted = false;
  let state = loadState();

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

  function setOpen(next) {
    open = next;
    root.classList.toggle("is-open", open);
    launcher?.setAttribute("aria-expanded", open ? "true" : "false");
    panel?.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) window.setTimeout(() => input?.focus(), 160);
  }

  function scrollBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

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

  function showSuggestions(show) {
    if (suggestionsEl) suggestionsEl.hidden = !show;
  }

  function renderWelcome() {
    messagesEl.innerHTML = "";
    addBubble(
      "assistant",
      "Hi! I'm Vidhun's portfolio assistant. I can help you learn about his skills, projects, experience and background. What would you like to know?"
    );
    showSuggestions(true);
  }

  function restore() {
    if (!state.messages.length) {
      renderWelcome();
      return;
    }
    messagesEl.innerHTML = "";
    state.messages.forEach((m) => addBubble(m.role, m.content));
    showSuggestions(!state.messages.some((m) => m.role === "user"));
  }

  function ask(raw) {
    if (busy) return;
    const content = String(raw || "").trim();
    if (!content) return setStatus("Please enter a message.", true);
    if (content.length > MAX_LEN) return setStatus(`Keep under ${MAX_LEN} characters.`, true);
    if (state.messages.filter((m) => m.role === "user").length >= MAX_TURNS) {
      return setStatus("Conversation limit reached. Start a new conversation.", true);
    }

    showSuggestions(false);
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
})();
