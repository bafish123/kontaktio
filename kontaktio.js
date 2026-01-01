
(function () {
  if (window.KontaktioLoaded) return;
  window.KontaktioLoaded = true;

  const script = document.currentScript;
  const CLIENT_ID = script?.getAttribute("data-client") || "demo";
  const BACKEND_URL = "https://chatbot-backend-x2cy.onrender.com/chat";

  let sessionId = null;
  let isOpen = false;
  let isLoading = false;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const POS_KEY = `kontaktio-pos-${CLIENT_ID}`;
  const DARK_KEY = `kontaktio-dark-${CLIENT_ID}`;
  const HISTORY_KEY = `kontaktio-history-${CLIENT_ID}`;

  const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "null");
  let darkMode = localStorage.getItem(DARK_KEY) === "1";

  /* =========================
     LAYOUTS
     ========================= */
  const LAYOUTS = {
    demo: {
      id: "demo",
      name: "Kontaktio NeoGlass",
      subtitle: "Futurystyczny Asystent AI",
      logoType: "emoji",
      logo: "🔮",
      style: "neoglass",
      bg: "#020617",
      primary: "#4f46e5",
      accent: "#22d3ee",
      quick: [
        "Co potrafi ten asystent?",
        "Jak mogę go wdrożyć u siebie?",
        "Jakie są przykładowe zastosowania?"
      ],
      avatarBot: "🤖",
      avatarUser: "🧑"
    },
    amico: {
      id: "amico",
      name: "AMICO",
      subtitle: "Pracownia Kamieniarska – Asystent",
      logoType: "text",
      logo: "AMICO",
      style: "friendly",
      bg: "#f7f6f2",
      primary: "#111827",
      accent: "#c9a24d",
      quick: [
        "Jakie wykonujecie blaty kuchenne?",
        "Z jakich materiałów pracujecie?",
        "Jak wygląda wycena i realizacja?"
      ],
      avatarBot: "🪨",
      avatarUser: "🧑"
    },
    enterprise: {
      id: "enterprise",
      name: "Kontaktio Enterprise",
      subtitle: "Asystent dla biznesu",
      logoType: "emoji",
      logo: "🏢",
      style: "corporate",
      bg: "#ffffff",
      primary: "#0f766e",
      accent: "#0891b2",
      quick: [
        "Jak zintegrować asystenta z naszym CRM?",
        "Czy obsługuje wiele języków?",
        "Jak wygląda bezpieczeństwo danych?"
      ],
      avatarBot: "💼",
      avatarUser: "🧑‍💼"
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
    --k-text:#0f172a;
    --k-radius:18px;
    --k-radius-lg:24px;
    --k-shadow-soft:0 18px 60px rgba(15,23,42,.35);
    --k-shadow-strong:0 30px 120px rgba(15,23,42,.65);
    --k-border-subtle:rgba(148,163,184,.4);
  }
  .k-dark {
    --k-bg:#020617;
    --k-text:#e5e7eb;
    --k-border-subtle:rgba(51,65,85,.8);
  }

  /* Launcher */
  #k-launcher {
    position:fixed;right:24px;bottom:24px;
    width:60px;height:60px;border-radius:50%;
    background:linear-gradient(135deg,var(--k-primary),var(--k-accent));
    color:#fff;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;z-index:99999;
    box-shadow:var(--k-shadow-soft);
    transition:transform .2s ease, box-shadow .2s ease, opacity .2s ease;
    opacity:0;transform:translateY(10px) scale(.95);
    font-size:26px;
  }
  #k-launcher.k-visible {
    opacity:1;
    transform:translateY(0) scale(1);
  }
  #k-launcher:hover {
    transform:translateY(-2px) scale(1.03);
    box-shadow:var(--k-shadow-strong);
  }

  /* Widget base */
  #k-widget {
    position:fixed;right:24px;bottom:96px;
    width:400px;height:600px;
    background:var(--k-bg);
    border-radius:var(--k-radius-lg);
    display:flex;flex-direction:column;
    box-shadow:var(--k-shadow-strong);
    opacity:0;pointer-events:none;
    transform:translateY(20px) scale(.97);
    transition:opacity .25s ease, transform .25s ease;
    z-index:99999;
    color:var(--k-text);
    overflow:hidden;
    font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
  }
  #k-widget.open {
    opacity:1;pointer-events:auto;transform:translateY(0) scale(1);
  }

  /* STYLES VARIANTS */
  #k-widget.k-style-neoglass {
    background:radial-gradient(circle at top left,#0f172a 0,#020617 40%,#020617 100%);
    border:1px solid rgba(148,163,184,.3);
    backdrop-filter:blur(26px);
  }
  #k-widget.k-style-neoglass #k-header {
    background:linear-gradient(120deg,rgba(79,70,229,.95),rgba(8,145,178,.95));
    border-bottom:1px solid rgba(148,163,184,.4);
  }
  #k-widget.k-style-neoglass .k-msg.k-bot {
    background:rgba(15,23,42,.85);
    border:1px solid rgba(148,163,184,.45);
  }
  #k-widget.k-style-neoglass .k-msg.k-user {
    background:linear-gradient(135deg,#4f46e5,#22d3ee);
    color:#ecfeff;
  }

  #k-widget.k-style-friendly {
    background:linear-gradient(180deg,#faf5f0,#f6f4ef);
  }
  #k-widget.k-style-friendly #k-header {
    background:linear-gradient(120deg,#111827,#4b5563);
  }
  #k-widget.k-style-friendly .k-msg.k-bot {
    background:#f3eee4;
    border:1px solid rgba(148,163,184,.25);
  }
  #k-widget.k-style-friendly .k-msg.k-user {
    background:#111827;
    color:#f9fafb;
  }

  #k-widget.k-style-corporate {
    background:#ffffff;
  }
  #k-widget.k-style-corporate #k-header {
    background:linear-gradient(120deg,#0f766e,#0f766e);
  }
  #k-widget.k-style-corporate .k-msg.k-bot {
    background:#f1f5f9;
    border:1px solid rgba(148,163,184,.3);
  }
  #k-widget.k-style-corporate .k-msg.k-user {
    background:#0f766e;
    color:#e0f2f1;
  }

  /* Header */
  #k-header {
    display:flex;align-items:center;gap:10px;
    padding:14px 16px;
    color:#fff;cursor:move;user-select:none;
  }
  #k-header-logo {
    width:32px;height:32px;border-radius:999px;
    display:flex;align-items:center;justify-content:center;
    background:rgba(15,23,42,.15);
    font-weight:600;font-size:15px;
  }
  #k-header main {
    display:flex;flex-direction:column;line-height:1.2;
  }
  #k-header main strong {
    font-size:14px;
  }
  #k-header main small {
    font-size:11px;opacity:.82;
  }
  #k-controls {
    margin-left:auto;display:flex;gap:8px;align-items:center;
  }
  #k-controls button {
    background:rgba(15,23,42,.18);border:none;color:#e5e7eb;
    cursor:pointer;font-size:14px;border-radius:999px;
    width:28px;height:28px;display:flex;align-items:center;justify-content:center;
    transition:background .15s ease, transform .15s ease;
  }
  #k-controls button:hover {
    background:rgba(15,23,42,.32);
    transform:translateY(-1px);
  }

  #k-status-bar {
    display:flex;align-items:center;gap:8px;
    padding:8px 14px;
    font-size:11px;
    border-bottom:1px solid rgba(148,163,184,.25);
    background:rgba(15,23,42,.02);
  }
  #k-status-indicator {
    width:8px;height:8px;border-radius:999px;
    background:#22c55e;
    box-shadow:0 0 0 4px rgba(34,197,94,.25);
  }
  #k-status-text {
    color:rgba(148,163,184,1);
  }
  #k-status-actions {
    margin-left:auto;display:flex;gap:6px;
  }
  #k-status-actions button {
    border:none;background:none;font-size:11px;cursor:pointer;
    color:#64748b;padding:2px 6px;border-radius:999px;
  }
  #k-status-actions button:hover {
    background:rgba(148,163,184,.2);
  }

  /* Quick actions */
  #k-quick {
    display:flex;gap:8px;padding:10px 14px 2px;
    flex-wrap:wrap;
  }
  .k-q {
    padding:7px 11px;border-radius:999px;border:1px solid rgba(148,163,184,.4);
    cursor:pointer;background:rgba(15,23,42,.02);
    color:#64748b;font-size:11px;
    display:inline-flex;align-items:center;gap:6px;
    transition:background .15s ease,border-color .15s ease, color .15s ease, transform .1s ease;
  }
  .k-q::before {
    content:"⚡";font-size:11px;
  }
  .k-q:hover {
    background:rgba(15,23,42,.04);
    border-color:var(--k-accent);
    color:#0f172a;
    transform:translateY(-1px);
  }

  /* Messages */
  #k-messages-wrapper {
    position:relative;
    flex:1;
    padding:2px 14px 10px;
    overflow:hidden;
  }
  #k-messages {
    height:100%;
    overflow-y:auto;
    padding-right:6px;
    scroll-behavior:smooth;
  }
  #k-messages::-webkit-scrollbar {
    width:6px;
  }
  #k-messages::-webkit-scrollbar-thumb {
    background:rgba(148,163,184,.6);
    border-radius:999px;
  }
  .k-msg-row {
    display:flex;gap:8px;margin-bottom:10px;
    align-items:flex-end;
  }
  .k-msg-row.k-user {
    justify-content:flex-end;
  }
  .k-avatar {
    width:24px;height:24px;border-radius:999px;
    display:flex;align-items:center;justify-content:center;
    font-size:13px;
    background:rgba(148,163,184,.3);
    flex-shrink:0;
  }
  .k-msg {
    max-width:78%;
    padding:9px 12px;
    border-radius:14px;
    font-size:13px;
    line-height:1.45;
    position:relative;
    white-space:pre-wrap;
    word-wrap:break-word;
  }
  .k-msg.k-user {
    border-bottom-right-radius:4px;
  }
  .k-msg.k-bot {
    border-bottom-left-radius:4px;
  }
  .k-msg .k-meta {
    margin-top:3px;
    font-size:10px;
    opacity:.7;
  }
  .k-msg a {
    color:var(--k-accent);
    text-decoration:none;
  }
  .k-msg a:hover {text-decoration:underline;}

  .k-typing {
    opacity:.7;font-style:italic;
  }

  /* Footer / Input */
  #k-footer {
    border-top:1px solid rgba(148,163,184,.3);
    padding:10px 12px 12px;
    background:linear-gradient(to top,rgba(15,23,42,.03),transparent);
  }
  #k-input-top {
    display:flex;align-items:center;justify-content:space-between;
    font-size:11px;color:#6b7280;
    margin-bottom:4px;
  }
  #k-input-top span {
    display:flex;align-items:center;gap:6px;
  }
  #k-input-top span::before {
    content:"✨";
  }
  #k-input {
    display:flex;gap:8px;align-items:flex-end;
  }
  #k-text {
    flex:1;padding:10px 11px;
    border-radius:13px;
    border:1px solid rgba(148,163,184,.7);
    font-size:13px;
    outline:none;
    resize:none;
    max-height:80px;
    min-height:38px;
    line-height:1.35;
    font-family:inherit;
    background:rgba(15,23,42,.01);
    color:var(--k-text);
  }
  #k-text:focus {
    border-color:var(--k-accent);
    box-shadow:0 0 0 1px rgba(56,189,248,.4);
    background:rgba(15,23,42,.02);
  }
  #k-send {
    padding:0 15px;border-radius:999px;border:none;
    background:var(--k-primary);color:#fff;cursor:pointer;
    height:36px;min-width:36px;
    display:flex;align-items:center;justify-content:center;
    font-size:13px;
    box-shadow:0 10px 25px rgba(37,99,235,.45);
    transition:background .15s ease, transform .12s ease, box-shadow .12s ease, opacity .12s ease;
  }
  #k-send span {margin-left:4px;}
  #k-send[disabled] {
    opacity:.6;cursor:default;box-shadow:none;
  }
  #k-send:not([disabled]):hover {
    transform:translateY(-1px);
    box-shadow:0 18px 35px rgba(37,99,235,.55);
  }
  #k-send:not([disabled]):active {
    transform:translateY(0);
    box-shadow:0 10px 25px rgba(37,99,235,.4);
  }

  /* Utility / Badges */
  .k-badge {
    padding:2px 8px;border-radius:999px;
    font-size:10px;
    border:1px solid rgba(148,163,184,.6);
    color:#64748b;
  }

  /* Fullscreen / Minimized (optional future use) */
  #k-widget.k-minimized {
    height:56px;
  }

  @media (max-width: 640px) {
    #k-widget {
      width:100%;
      height:100%;
      right:0;bottom:0;
      border-radius:0;
    }
    #k-launcher {
      right:16px;bottom:16px;
    }
  }
  `;
  document.head.appendChild(style);

  /* =========================
     HTML
     ========================= */
  const launcher = document.createElement("div");
  launcher.id = "k-launcher";
  launcher.textContent = "💬";

  const widget = document.createElement("div");
  widget.id = "k-widget";
  widget.classList.add(`k-style-${L.style}`);
  if (darkMode) widget.classList.add("k-dark");

  const logoContent = L.logoType === "emoji"
    ? `<span>${L.logo}</span>`
    : `<span style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${L.logo}</span>`;

  widget.innerHTML = `
    <div id="k-header">
      <div id="k-header-logo">${logoContent}</div>
      <main>
        <strong>${L.name}</strong>
        <small>${L.subtitle}</small>
      </main>
      <div id="k-controls">
        <button id="k-history" title="Wyczyść historię">🧹</button>
        <button id="k-theme" title="Przełącz motyw">🌓</button>
        <button id="k-close" title="Zamknij">✕</button>
      </div>
    </div>
    <div id="k-status-bar">
      <div id="k-status-indicator"></div>
      <div id="k-status-text">Online – połączono z asystentem</div>
      <div id="k-status-actions">
        <button id="k-expand-toggle">Pełny widok</button>
      </div>
    </div>
    <div id="k-quick"></div>
    <div id="k-messages-wrapper">
      <div id="k-messages"></div>
    </div>
    <div id="k-footer">
      <div id="k-input-top">
        <span>Obsługuje naturalny język i kontekst</span>
        <div class="k-badge">Enter – wyślij • Shift+Enter – nowa linia</div>
      </div>
      <div id="k-input">
        <textarea id="k-text" placeholder="Napisz wiadomość…" rows="1"></textarea>
        <button id="k-send"><span>➤</span></button>
      </div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(widget);

  // show launcher with slight delay for smooth animation
  requestAnimationFrame(() => launcher.classList.add("k-visible"));

  if (savedPos) {
    widget.style.left = savedPos.x + "px";
    widget.style.top = savedPos.y + "px";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
  }

  const header = widget.querySelector("#k-header");
  const messagesWrapper = widget.querySelector("#k-messages-wrapper");
  const messages = widget.querySelector("#k-messages");
  const input = widget.querySelector("#k-text");
  const sendBtn = widget.querySelector("#k-send");
  const themeBtn = widget.querySelector("#k-theme");
  const closeBtn = widget.querySelector("#k-close");
  const quick = widget.querySelector("#k-quick");
  const historyBtn = widget.querySelector("#k-history");
  const expandBtn = widget.querySelector("#k-expand-toggle");
  const statusIndicator = widget.querySelector("#k-status-indicator");
  const statusText = widget.querySelector("#k-status-text");

  /* =========================
     Utility: Markdown-lite rendering
     ========================= */
  function renderMarkdown(text) {
    if (!text) return "";
    let t = text;
    // escape basic HTML
    t = t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // links [text](url)
    t = t.replace(/

\[([^\]

]+)\]

\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // bold **text**
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic *text*
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // simple line breaks
    t = t.replace(/\n/g, "<br>");
    return t;
  }

  /* =========================
     Quick actions
     ========================= */
  L.quick.forEach(q => {
    const b = document.createElement("button");
    b.className = "k-q";
    b.textContent = q;
    b.onclick = () => {
      input.value = q;
      autoResizeInput();
      send();
    };
    quick.appendChild(b);
  });

  /* =========================
     Dragging
     ========================= */
  header.addEventListener("mousedown", e => {
    // ignore if clicking on controls
    if (e.target.closest("#k-controls")) return;
    isDragging = true;
    const r = widget.getBoundingClientRect();
    dragOffsetX = e.clientX - r.left;
    dragOffsetY = e.clientY - r.top;
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    widget.style.left = Math.max(0, e.clientX - dragOffsetX) + "px";
    widget.style.top = Math.max(0, e.clientY - dragOffsetY) + "px";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    localStorage.setItem(POS_KEY, JSON.stringify({
      x: widget.offsetLeft,
      y: widget.offsetTop
    }));
  });

  /* =========================
     History
     ========================= */
  function loadHistory() {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  let history = loadHistory();

  function renderHistory() {
    messages.innerHTML = "";
    if (!history.length) {
      addBot("W czym mogę pomóc?", { meta: "Nowa sesja" });
      return;
    }
    history.forEach(item => {
      if (item.role === "user") {
        addUser(item.content, { store:false, meta:item.meta });
      } else if (item.role === "assistant") {
        addBot(item.content, { store:false, meta:item.meta });
      }
    });
  }

  /* =========================
     Messaging helpers
     ========================= */
  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight + 999;
  }

  function addMessageElement(html, clsRow, clsMsg, avatar, metaText) {
    const row = document.createElement("div");
    row.className = `k-msg-row ${clsRow}`;

    const avatarDiv = document.createElement("div");
    avatarDiv.className = "k-avatar";
    avatarDiv.textContent = avatar || "";

    const msg = document.createElement("div");
    msg.className = `k-msg ${clsMsg}`;
    msg.innerHTML = html;

    if (metaText) {
      const meta = document.createElement("div");
      meta.className = "k-meta";
      meta.textContent = metaText;
      msg.appendChild(meta);
    }

    if (clsRow === "k-user") {
      row.appendChild(msg);
      row.appendChild(avatarDiv);
    } else {
      row.appendChild(avatarDiv);
      row.appendChild(msg);
    }

    messages.appendChild(row);
    scrollToBottom();

    return row;
  }

  function addUser(text, opts = {}) {
    const meta = opts.meta || "Ty";
    const html = renderMarkdown(text);
    addMessageElement(html, "k-user", "k-user", L.avatarUser, meta);

    if (opts.store !== false) {
      history.push({ role:"user", content:text, meta });
      saveHistory(history);
    }
  }

  function addBot(text, opts = {}) {
    const meta = opts.meta || "Asystent";
    const html = renderMarkdown(text);
    addMessageElement(html, "k-bot-row", "k-bot", L.avatarBot, meta);

    if (opts.store !== false) {
      history.push({ role:"assistant", content:text, meta });
      saveHistory(history);
    }
  }

  function addTyping() {
    const row = document.createElement("div");
    row.className = "k-msg-row k-bot-row";
    const avatarDiv = document.createElement("div");
    avatarDiv.className = "k-avatar";
    avatarDiv.textContent = L.avatarBot;

    const msg = document.createElement("div");
    msg.className = "k-msg k-bot k-typing";
    msg.textContent = "Asystent pisze…";

    row.appendChild(avatarDiv);
    row.appendChild(msg);
    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  /* =========================
     Input resizing
     ========================= */
  function autoResizeInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 80) + "px";
  }

  input.addEventListener("input", autoResizeInput);

  /* =========================
     Send
     ========================= */
  async function send() {
    const text = input.value.trim();
    if (!text || isLoading) return;
    isLoading = true;
    sendBtn.disabled = true;
    statusIndicator.style.background = "#eab308";
    statusText.textContent = "Wysyłanie…";

    addUser(text);
    input.value = "";
    autoResizeInput();

    const typingRow = addTyping();

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, clientId: CLIENT_ID })
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      sessionId = data.sessionId || sessionId;

      typingRow.remove();
      addBot(data.reply || "Brak odpowiedzi z serwera.");

      statusIndicator.style.background = "#22c55e";
      statusText.textContent = "Online – odpowiedź odebrana";
    } catch (err) {
      typingRow.remove();
      addBot("Wystąpił błąd połączenia. Spróbuj ponownie za chwilę.");
      statusIndicator.style.background = "#ef4444";
      statusText.textContent = "Offline – problem z połączeniem";
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }

  /* =========================
     Events
     ========================= */
  launcher.onclick = () => {
    isOpen = !isOpen;
    widget.classList.toggle("open", isOpen);
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  };

  closeBtn.onclick = e => {
    e.stopPropagation();
    widget.classList.remove("open");
    isOpen = false;
  };

  // zapobiegamy drag/klik-rozlaniom na przyciskach w headerze
  ["click","mousedown","mouseup"].forEach(ev => {
    themeBtn.addEventListener(ev, e => e.stopPropagation());
    historyBtn.addEventListener(ev, e => e.stopPropagation());
    closeBtn.addEventListener(ev, e => e.stopPropagation());
    expandBtn.addEventListener(ev, e => e.stopPropagation());
  });

  themeBtn.onclick = e => {
    e.preventDefault();
    darkMode = !darkMode;
    widget.classList.toggle("k-dark", darkMode);
    localStorage.setItem(DARK_KEY, darkMode ? "1" : "0");
  };

  historyBtn.onclick = e => {
    e.preventDefault();
    if (!confirm("Czy na pewno chcesz wyczyścić historię rozmowy dla tego asystenta?")) return;
    history = [];
    saveHistory(history);
    renderHistory();
  };

  let fullscreen = false;
  expandBtn.onclick = e => {
    e.preventDefault();
    fullscreen = !fullscreen;
    if (fullscreen) {
      widget.style.left = "0";
      widget.style.top = "0";
      widget.style.right = "0";
      widget.style.bottom = "0";
      widget.style.width = "100%";
      widget.style.height = "100%";
      widget.style.borderRadius = "0";
      expandBtn.textContent = "Zwiń widok";
    } else {
      widget.removeAttribute("style");
      widget.classList.add(`k-style-${L.style}`);
      if (darkMode) widget.classList.add("k-dark");
      if (savedPos) {
        widget.style.left = savedPos.x + "px";
        widget.style.top = savedPos.y + "px";
        widget.style.right = "auto";
        widget.style.bottom = "auto";
      }
      expandBtn.textContent = "Pełny widok";
    }
  };

  sendBtn.onclick = send;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // click inside widget shouldn't close anything accidentally
  widget.addEventListener("click", e => {
    e.stopPropagation();
  });

  // initial history render
  renderHistory();

})();

