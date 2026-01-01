(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;
  const CLIENT_ID = script?.getAttribute("data-client") || "demo";
  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let isOpen = false;
  let isLoading = false;
  let darkMode = localStorage.getItem("kontaktio-dark") === "1";

  /* =========================
     LAYOUT DEFINITIONS
     ========================= */
  const LAYOUTS = {
    demo: {
      name: "Kontaktio Demo",
      subtitle: "Asystent AI",
      logo: "💬",
      style: "saas",
      position: "right",
      bg: "#f8fafc",
      primary: "#2563eb",
      accent: "#3b82f6",
      showQuick: true,
      quick: [
        "Co potrafi ten asystent?",
        "Jak wygląda wdrożenie?",
        "Dla jakich firm to działa?"
      ]
    },

    amico: {
      name: "AMICO",
      subtitle: "Pracownia Kamieniarska",
      logo: "🪨",
      style: "brand",
      position: "right",
      bg: "#f7f6f2",
      primary: "#111111",
      accent: "#c9a24d",
      showQuick: true,
      quick: [
        "Jakie wykonujecie blaty?",
        "Czy robicie schody z granitu?",
        "Jak się z Wami skontaktować?"
      ]
    },

    premium: {
      name: "Kontaktio Premium",
      subtitle: "Exclusive AI Assistant",
      logo: "✦",
      style: "luxury",
      position: "center",
      bg: "#020617",
      primary: "#7c3aed",
      accent: "#a78bfa",
      showQuick: false,
      quick: []
    }
  };

  const L = LAYOUTS[CLIENT_ID] || LAYOUTS.demo;

  /* =========================
     CSS
     ========================= */
  const style = document.createElement("style");
  style.textContent = `
  :root {
    --k-bg:${L.bg};
    --k-primary:${L.primary};
    --k-accent:${L.accent};
    --k-text:#111;
  }

  body.k-dark {
    --k-bg:#020617;
    --k-text:#e5e7eb;
  }

  #k-launcher {
    position:fixed;
    ${L.position === "center" ? "left:50%;transform:translateX(-50%);" : "right:20px;"}
    bottom:20px;
    width:58px;height:58px;
    border-radius:50%;
    background:var(--k-primary);
    color:#fff;
    font-size:24px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:99999;
    box-shadow:0 10px 30px rgba(0,0,0,.35);
  }

  #k-widget {
    position:fixed;
    ${L.position === "center" ? "left:50%;transform:translateX(-50%) scale(.92);" : "right:20px;"}
    bottom:90px;
    width:${L.style === "luxury" ? "420px" : "360px"};
    height:560px;
    background:var(--k-bg);
    border-radius:${L.style === "luxury" ? "24px" : "14px"};
    display:flex;
    flex-direction:column;
    box-shadow:0 40px 120px rgba(0,0,0,.6);
    opacity:0;
    pointer-events:none;
    transition:all .5s cubic-bezier(.16,1,.3,1);
    z-index:99999;
  }

  #k-widget.open {
    opacity:1;
    transform:${L.position === "center" ? "translateX(-50%) scale(1)" : "none"};
    pointer-events:auto;
  }

  #k-header {
    padding:${L.style === "brand" ? "18px" : "14px"};
    background:${L.style === "saas"
      ? "linear-gradient(135deg,#2563eb,#1e40af)"
      : L.style === "brand"
      ? "linear-gradient(135deg,#111,#c9a24d)"
      : "linear-gradient(135deg,#020617,#0f172a)"};
    color:#fff;
    display:flex;
    align-items:center;
    gap:12px;
    cursor:move;
  }

  #k-header .logo {
    font-size:${L.style === "luxury" ? "22px" : "20px"};
  }

  #k-header small {
    opacity:.75;
    font-size:12px;
  }

  #k-quick {
    display:${L.showQuick ? "grid" : "none"};
    grid-template-columns:${L.style === "brand" ? "1fr 1fr" : "auto"};
    gap:8px;
    padding:12px;
  }

  .k-q {
    padding:10px;
    border-radius:12px;
    border:none;
    cursor:pointer;
    background:var(--k-accent);
    color:#fff;
    font-size:12px;
  }

  #k-messages {
    flex:1;
    padding:14px;
    overflow-y:auto;
    color:var(--k-text);
  }

  .k-msg {
    max-width:80%;
    padding:10px 14px;
    margin-bottom:10px;
    border-radius:14px;
    font-size:14px;
  }

  .k-user {
    background:var(--k-primary);
    color:#fff;
    margin-left:auto;
  }

  .k-bot {
    background:${L.style === "luxury" ? "#0f172a" : "#e5e7eb"};
    color:${L.style === "luxury" ? "#e5e7eb" : "#111"};
  }

  #k-input {
    display:flex;
    padding:12px;
    gap:8px;
    border-top:1px solid rgba(0,0,0,.1);
  }

  #k-input input {
    flex:1;
    padding:12px;
    border-radius:12px;
    border:1px solid #ddd;
  }

  #k-input button {
    padding:0 18px;
    border-radius:12px;
    border:none;
    background:var(--k-primary);
    color:#fff;
    cursor:pointer;
  }
  `;
  document.head.appendChild(style);

  /* =========================
     HTML
     ========================= */
  const launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = L.logo;

  const widget = document.createElement("div");
  widget.id = "k-widget";
  widget.innerHTML = `
    <div id="k-header">
      <div class="logo">${L.logo}</div>
      <div>
        <strong>${L.name}</strong><br>
        <small>${L.subtitle}</small>
      </div>
    </div>

    <div id="k-quick"></div>

    <div id="k-messages">
      <div class="k-msg k-bot">W czym mogę pomóc?</div>
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
  const sendBtn = widget.querySelector("button");
  const quick = widget.querySelector("#k-quick");

  if (L.showQuick) {
    L.quick.forEach(q => {
      const b = document.createElement("button");
      b.className = "k-q";
      b.textContent = q;
      b.onclick = () => {
        input.value = q;
        send();
      };
      quick.appendChild(b);
    });
  }

  function add(text, cls) {
    const div = document.createElement("div");
    div.className = "k-msg " + cls;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text || isLoading) return;
    isLoading = true;

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
      add(data.reply, "k-bot");
    } catch {
      add("Błąd połączenia.", "k-bot");
    } finally {
      isLoading = false;
    }
  }

  launcher.onclick = () => {
    isOpen = !isOpen;
    widget.classList.toggle("open", isOpen);
  };

  sendBtn.onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
})();
