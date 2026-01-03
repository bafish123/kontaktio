(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script =
    document.currentScript ||
    document.querySelector('script[data-client][data-kontaktio]');

  const CLIENT_ID = script?.getAttribute("data-client") || "demo";
  const SUPABASE_URL = script?.getAttribute("data-supabase-url") || "";
  const SUPABASE_KEY = script?.getAttribute("data-supabase-key") || "";

  const STORAGE_KEY_HISTORY = `kontaktio-history-${CLIENT_ID}`;
  const STORAGE_KEY_SESSION = `kontaktio-session-${CLIENT_ID}`;
  const STORAGE_KEY_OPEN = `kontaktio-open-${CLIENT_ID}`;

  let CLIENT_CONFIG = null;
  let THEME = {};
  let sessionId = null;
  let isOpen = false;
  let isSending = false;

  async function loadClientConfig() {
    try {
      const url = `${SUPABASE_URL}/rest/v1/clients?select=*&id=eq.${CLIENT_ID}`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!res.ok) {
        console.warn("[Kontaktio] Błąd pobierania configu:", res.status);
        return null;
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        console.warn("[Kontaktio] Brak klienta w Supabase:", CLIENT_ID);
        return null;
      }

      const cfg = data[0];
      CLIENT_CONFIG = cfg;
      THEME = cfg.theme || {};

      window.KONTAKTIO_CONFIG = cfg;
      window.KONTAKTIO_THEME = THEME;

      return cfg;
    } catch (e) {
      console.error("[Kontaktio] loadClientConfig error:", e);
      return null;
    }
  }

  function saveSessionId(id) {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, id);
    } catch {}
  }

  function loadSessionId() {
    try {
      return localStorage.getItem(STORAGE_KEY_SESSION);
    } catch {
      return null;
    }
  }

  function saveOpenState(open) {
    try {
      localStorage.setItem(STORAGE_KEY_OPEN, open ? "1" : "0");
    } catch {}
  }

  function loadOpenState() {
    try {
      return localStorage.getItem(STORAGE_KEY_OPEN) === "1";
    } catch {
      return false;
    }
  }

  function saveHistory(messages) {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(messages));
    } catch {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function injectStyles(css) {
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function generateCSS() {
    const t = THEME || {};
    const radius = t.radius || 18;
    const inputBg = t.inputBg || "#ffffff";
    const buttonBg = t.buttonBg || "#202667";

    const css = `
      #kontaktio-launcher {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${buttonBg};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999999;
      }

      #kontaktio-widget {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 360px;
        max-height: 600px;
        background: ${inputBg};
        border-radius: ${radius}px;
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        font-family: system-ui, sans-serif;
      }

      #kontaktio-header {
        background: ${buttonBg};
        color: #fff;
        padding: 12px 16px;
        font-weight: bold;
      }

      #kontaktio-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .kontaktio-msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: ${radius}px;
        margin-bottom: 10px;
        line-height: 1.4;
        white-space: pre-wrap;
      }

      .kontaktio-msg-user {
        background: #202667;
        color: #fff;
        margin-left: auto;
      }

      .kontaktio-msg-bot {
        background: #f3f4f6;
        color: #111827;
        margin-right: auto;
      }

      #kontaktio-input-wrap {
        padding: 12px;
        border-top: 1px solid #ccc;
        background: ${inputBg};
      }

      #kontaktio-input {
        width: 100%;
        padding: 10px;
        border-radius: ${radius}px;
        border: 1px solid #ccc;
        outline: none;
      }
    `;

    injectStyles(css);
  }

  function createLauncher() {
    const launcher = document.createElement("div");
    launcher.id = "kontaktio-launcher";
    launcher.innerHTML = CLIENT_CONFIG.launcher_icon || "💬";
    launcher.addEventListener("click", toggleWidget);
    document.body.appendChild(launcher);
  }

  function createWidget() {
    const widget = document.createElement("div");
    widget.id = "kontaktio-widget";

    widget.innerHTML = `
      <div id="kontaktio-header">
        ${CLIENT_CONFIG.company?.name || "Asystent"}
      </div>
      <div id="kontaktio-messages"></div>
      <div id="kontaktio-input-wrap">
        <input id="kontaktio-input" placeholder="Napisz wiadomość..." />
      </div>
    `;

    document.body.appendChild(widget);

    const input = document.getElementById("kontaktio-input");
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendUserMessage(input.value);
        }
      });
    }
  }

  function toggleWidget() {
    isOpen = !isOpen;
    saveOpenState(isOpen);

    const widget = document.getElementById("kontaktio-widget");
    if (!widget) return;

    widget.style.display = isOpen ? "flex" : "none";

    if (isOpen) {
      scrollMessagesToBottom();
      focusInput();
    }
  }

  function focusInput() {
    const input = document.getElementById("kontaktio-input");
    if (input) input.focus();
  }

  function addMessage(role, text) {
    const wrap = document.getElementById("kontaktio-messages");
    if (!wrap) return;

    const div = document.createElement("div");
    div.className = `kontaktio-msg kontaktio-msg-${role}`;
    div.textContent = text;

    wrap.appendChild(div);
    scrollMessagesToBottom();

    const history = loadHistory();
    history.push({ role, text });
    saveHistory(history);
  }

  function scrollMessagesToBottom() {
    const wrap = document.getElementById("kontaktio-messages");
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }

  async function sendUserMessage(text) {
    if (!text || !text.trim()) return;
    if (isSending) return;

    const input = document
