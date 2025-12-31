(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;
  const CLIENT_ID = script.getAttribute("data-client") || "demo";
  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let themeApplied = false;
  let widget, launcher, messages;

  const style = document.createElement("style");
  style.textContent = `
  #k-launcher {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #111;
    color: #fff;
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
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0,0,0,.3);
    display: none;
    flex-direction: column;
    font-family: Arial, sans-serif;
    z-index: 99999;
  }

  #k-header {
    padding: 12px;
    font-weight: bold;
    color: #fff;
  }

  #k-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
  }

  .k-msg {
    margin-bottom: 10px;
    padding: 10px 14px;
    border-radius: 16px;
    max-width: 80%;
    font-size: 14px;
  }

  .k-user { margin-left: auto; color: #fff; }
  .k-bot { background: #e5e5e5; }

  #k-input {
    display: flex;
    border-top: 1px solid #ddd;
  }

  #k-input input {
    flex: 1;
    padding: 12px;
    border: none;
  }

  #k-input button {
    border: none;
    padding: 0 16px;
    cursor: pointer;
    color: #fff;
  }
  `;
  document.head.appendChild(style);

  launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = "💬";

  widget = document.createElement("div");
  widget.id = "k-widget";
  widget.innerHTML = `
    <div id="k-header">Asystent</div>
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

  messages = widget.querySelector("#k-messages");
  const input = widget.querySelector("input");
  const button = widget.querySelector("button");

  function applyTheme(theme) {
    if (!theme) return;

    launcher.style.background = theme.primary;
    widget.style.borderRadius = theme.radius + "px";
    widget.querySelector("#k-header").style.background = theme.primary;
    widget.querySelector("#k-input button").style.background = theme.primary;
    messages.style.background = theme.background;

    if (theme.position === "left") {
      launcher.style.left = "20px";
      widget.style.left = "20px";
      launcher.style.right = widget.style.right = "auto";
    }
  }

  function add(text, cls) {
    const d = document.createElement("div");
    d.className = "k-msg " + cls;
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;
    add(text, "k-user");
    input.value = "";

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId, clientId: CLIENT_ID })
    });

    const data = await res.json();
    sessionId = data.sessionId;
    if (!themeApplied && data.theme) {
      applyTheme(data.theme);
      themeApplied = true;
    }
    add(data.reply, "k-bot");
  }

  launcher.onclick = () =>
    (widget.style.display = widget.style.display === "flex" ? "none" : "flex");

  button.onclick = send;
  input.addEventListener("keydown", e => e.key === "Enter" && send());
})();
