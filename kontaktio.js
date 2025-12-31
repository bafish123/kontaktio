(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;
  const CLIENT_ID = script.getAttribute("data-client") || "demo";
  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let isOpen = false;
  let isLoading = false;
  let theme = null;
  let darkMode = localStorage.getItem("kontaktio-dark") === "1";

  /* ===================== CSS ===================== */
  const style = document.createElement("style");
  style.textContent = `
  :root {
    --k-header-bg: #111;
    --k-header-text: #fff;
    --k-user-bg: #111;
    --k-user-text: #fff;
    --k-bot-bg: #e5e7eb;
    --k-bot-text: #111;
    --k-widget-bg: #f8fafc;
    --k-input-bg: #fff;
    --k-input-text: #111;
    --k-button-bg: #111;
    --k-button-text: #fff;
    --k-radius: 14px;
  }

  body.k-dark {
    --k-widget-bg: #0f172a;
    --k-input-bg: #020617;
    --k-input-text: #e5e7eb;
    --k-bot-bg: #1e293b;
    --k-bot-text: #e5e7eb;
  }

  #k-launcher {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--k-button-bg);
    color: var(--k-button-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 99999;
  }

  #k-widget {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 360px;
    height: 520px;
    background: var(--k-widget-bg);
    border-radius: var(--k-radius);
    display: none;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,.45);
  }

  #k-header {
    background: var(--k-header-bg);
    color: var(--k-header-text);
    padding: 12px;
    display: flex;
    justify-content: space-between;
  }

  #k-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
  }

  .k-msg {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 14px;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .k-user {
    background: var(--k-user-bg);
    color: var(--k-user-text);
    margin-left: auto;
  }

  .k-bot {
    background: var(--k-bot-bg);
    color: var(--k-bot-text);
  }

  #k-input {
    display: flex;
    border-top: 1px solid rgba(0,0,0,.1);
  }

  #k-input input {
    flex: 1;
    padding: 12px;
    border: none;
    outline: none;
    background: var(--k-input-bg);
    color: var(--k-input-text);
  }

  #k-input button {
    padding: 0 16px;
    border: none;
    background: var(--k-button-bg);
    color: var(--k-button-text);
    cursor: pointer;
  }

  #k-input button:disabled {
    opacity: .6;
  }
  `;
  document.head.appendChild(style);

  /* ===================== HTML ===================== */
  const launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = "💬";

  const widget = document.createElement("div");
  widget.id = "k-widget";
  widget.innerHTML = `
    <div id="k-header">
      <span>Asystent</span>
      <div>
        <button id="k-theme">🌓</button>
        <button id="k-close">✕</button>
      </div>
    </div>
    <div id="k-messages">
      <div class="k-msg k-bot">Dzień dobry 👋 W czym mogę pomóc?</div>
    </div>
    <div id="k-input">
      <input placeholder="Napisz wiadomość…" />
      <button>Wyślij</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(widget);

  const messages = widget.querySelector("#k-messages");
  const input = widget.querySelector("input");
  const button = widget.querySelector("button");
  const closeBtn = widget.querySelector("#k-close");
  const themeBtn = widget.querySelector("#k-theme");

  if (darkMode) document.body.classList.add("k-dark");

  function applyTheme(t) {
    const r = document.documentElement.style;
    for (const key in t) {
      r.setProperty("--k-" + key.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), t[key]);
    }
  }

  function add(text, cls) {
    const div = document.createElement("div");
    div.className = "k-msg " + cls;
    div.textContent = text || "(brak odpowiedzi)";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    button.disabled = true;

    add(text, "k-user");
    input.value = "";

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, clientId: CLIENT_ID })
      });

      const data = await res.json();
      sessionId = data.sessionId || sessionId;

      if (!theme && data.theme) {
        theme = data.theme;
        applyTheme(theme);
      }

      add(data.reply, "k-bot");
    } catch (e) {
      add("Błąd połączenia z serwerem.", "k-bot");
    } finally {
      isLoading = false;
      button.disabled = false;
      input.focus();
    }
  }

  launcher.onclick = () => {
    isOpen = !isOpen;
    widget.style.display = isOpen ? "flex" : "none";
    if (isOpen) input.focus();
  };

  closeBtn.onclick = () => {
    isOpen = false;
    widget.style.display = "none";
  };

  themeBtn.onclick = () => {
    darkMode = !darkMode;
    document.body.classList.toggle("k-dark", darkMode);
    localStorage.setItem("kontaktio-dark", darkMode ? "1" : "0");
  };

  button.onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
})();
