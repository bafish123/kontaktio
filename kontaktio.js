(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;

  const CLIENT_ID = script.getAttribute("data-client") || "demo";
  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let open = false;
  let darkMode = false;
  let theme = null;

  /* ================= FETCH THEME ================= */
  async function loadTheme() {
    try {
      const res = await fetch(
        `https://chatbot-backend-x2cy.onrender.com/theme/${CLIENT_ID}`
      );
      theme = await res.json();
    } catch {
      theme = null;
    }
  }

  /* ================= CSS ================= */
  const style = document.createElement("style");
  style.textContent = `
  #k-launcher {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--button-bg);
    color: var(--button-text);
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 99999;
    transition: transform .3s ease;
  }
  #k-launcher:hover { transform: scale(1.1); }

  #k-widget {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 360px;
    height: 520px;
    background: var(--widget-bg);
    border-radius: var(--radius);
    box-shadow: 0 20px 50px rgba(0,0,0,.3);
    display: none;
    flex-direction: column;
    font-family: Arial, sans-serif;
    z-index: 99999;
    animation: k-enter .35s ease;
  }

  @keyframes k-enter {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  #k-header {
    background: var(--header-bg);
    color: var(--header-text);
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #k-header button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
  }

  #k-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    background: var(--widget-bg);
  }

  .k-msg {
    margin-bottom: 10px;
    padding: 10px 14px;
    border-radius: 16px;
    max-width: 80%;
    font-size: 14px;
  }

  .k-user {
    background: var(--user-bg);
    color: var(--user-text);
    margin-left: auto;
  }

  .k-bot {
    background: var(--bot-bg);
    color: var(--bot-text);
  }

  #k-input {
    display: flex;
    border-top: 1px solid #ddd;
    background: var(--input-bg);
  }

  #k-input input {
    flex: 1;
    padding: 12px;
    border: none;
    outline: none;
    color: var(--input-text);
    background: transparent;
  }

  #k-input button {
    background: var(--button-bg);
    color: var(--button-text);
    border: none;
    padding: 0 16px;
    cursor: pointer;
  }
  `;
  document.head.appendChild(style);

  /* ================= HTML ================= */
  const launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = "💬";

  const widget = document.createElement("div");
  widget.id = "k-widget";
  widget.innerHTML = `
    <div id="k-header">
      <span>Asystent</span>
      <button id="k-toggle">🌙</button>
    </div>
    <div id="k-messages">
      <div class="k-msg k-bot">Dzień dobry 👋 W czym mogę pomóc?</div>
    </div>
    <div id="k-input">
      <input placeholder="Napisz wiadomość..." />
      <button>Wyślij</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(widget);

  const messages = widget.querySelector("#k-messages");
  const input = widget.querySelector("input");
  const button = widget.querySelector("button");
  const toggle = widget.querySelector("#k-toggle");

  /* ================= APPLY THEME ================= */
  function applyTheme() {
    const t = theme?.theme || {};
    document.documentElement.style.setProperty("--header-bg", t.headerBg || "#111");
    document.documentElement.style.setProperty("--header-text", t.headerText || "#fff");
    document.documentElement.style.setProperty("--user-bg", t.userBubbleBg || "#111");
    document.documentElement.style.setProperty("--user-text", t.userBubbleText || "#fff");
    document.documentElement.style.setProperty("--bot-bg", t.botBubbleBg || "#eee");
    document.documentElement.style.setProperty("--bot-text", t.botBubbleText || "#111");
    document.documentElement.style.setProperty("--widget-bg", t.widgetBg || "#fff");
    document.documentElement.style.setProperty("--input-bg", t.inputBg || "#fff");
    document.documentElement.style.setProperty("--input-text", t.inputText || "#111");
    document.documentElement.style.setProperty("--button-bg", t.buttonBg || "#111");
    document.documentElement.style.setProperty("--button-text", t.buttonText || "#fff");
    document.documentElement.style.setProperty("--radius", (t.radius || 12) + "px");
  }

  /* ================= CHAT ================= */
  function add(text, cls) {
    const div = document.createElement("div");
    div.className = "k-msg " + cls;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;

    add(text, "k-user");
    input.value = "";

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          clientId: CLIENT_ID
        })
      });

      const data = await res.json();
      sessionId = data.sessionId;
      add(data.reply, "k-bot");
    } catch {
      add("Błąd połączenia z serwerem.", "k-bot");
    }
  }

  /* ================= EVENTS ================= */
  launcher.onclick = () => {
    open = !open;
    widget.style.display = open ? "flex" : "none";
  };

  button.onclick = send;
  input.addEventListener("keydown", e => e.key === "Enter" && send());

  toggle.onclick = () => {
    darkMode = !darkMode;
    document.documentElement.style.filter = darkMode
      ? "invert(1) hue-rotate(180deg)"
      : "none";
    toggle.textContent = darkMode ? "☀️" : "🌙";
  };

  /* ================= INIT ================= */
  loadTheme().then(applyTheme);
})();
