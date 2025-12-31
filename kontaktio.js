(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;

  const CLIENT_ID = script.getAttribute("data-client") || "demo";
  const BRAND = script.getAttribute("data-brand") || "Kontaktio";
  const COLOR = script.getAttribute("data-color") || "#111";

  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let open = false;

  const style = document.createElement("style");
  style.textContent = `
  #k-launcher {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${COLOR};
    color: #fff;
    font-size: 24px;
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
    background: ${COLOR};
    color: #fff;
    padding: 12px;
    font-weight: bold;
  }

  #k-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    background: #f6f6f6;
  }

  .k-msg {
    margin-bottom: 10px;
    padding: 10px 14px;
    border-radius: 16px;
    max-width: 80%;
    font-size: 14px;
  }

  .k-user {
    background: ${COLOR};
    color: #fff;
    margin-left: auto;
  }

  .k-bot {
    background: #e5e5e5;
    color: #000;
  }

  #k-input {
    display: flex;
    border-top: 1px solid #ddd;
  }

  #k-input input {
    flex: 1;
    padding: 12px;
    border: none;
    outline: none;
  }

  #k-input button {
    background: ${COLOR};
    color: #fff;
    border: none;
    padding: 0 16px;
    cursor: pointer;
  }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = "💬";

  const widget = document.createElement("div");
  widget.id = "k-widget";
  widget.innerHTML = `
    <div id="k-header">${BRAND}</div>
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

  launcher.onclick = () => {
    open = !open;
    widget.style.display = open ? "flex" : "none";
  };

  button.onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
})();
