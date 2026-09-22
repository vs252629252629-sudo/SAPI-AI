const API_URL = "https://sapi-ai.onrender.com";

const STORAGE_KEY = "sapi_conversations_v3";
const SETTINGS_KEY = "sapi_settings_v2";

let conversations = [];
let currentConversationId = null;

let selectedModel = "google-gemini";
let selectedPersonality = "standard";
let selectedMode = "chat";

let isSending = false;

const $ = (id) => document.getElementById(id);

/* =========================================
   STORAGE
========================================= */

function loadConversations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      conversations = [];
      return;
    }

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      conversations = parsed;
    } else {
      conversations = [];
    }

  } catch (error) {
    console.error("Could not load conversations:", error);
    conversations = [];
  }
}

function saveConversations() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(conversations)
  );
}

function loadSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || "{}"
    );

    selectedModel =
      saved.model ||
      "google-gemini";

    selectedPersonality =
      saved.personality ||
      "standard";

    selectedMode =
      saved.mode ||
      "chat";

  } catch {
    selectedModel = "google-gemini";
    selectedPersonality = "standard";
    selectedMode = "chat";
  }
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      model: selectedModel,
      personality: selectedPersonality,
      mode: selectedMode
    })
  );
}

/* =========================================
   CONVERSATION HELPERS
========================================= */

function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function createConversation() {

  const conversation = {
    id: generateId(),

    title: "New conversation",

    icon: "💬",

    category: "chat",

    createdAt: Date.now(),

    updatedAt: Date.now(),

    messages: []
  };

  conversations.unshift(conversation);

  currentConversationId = conversation.id;

  saveConversations();

  renderRecentChats();

  return conversation;
}

function getCurrentConversation() {
  return conversations.find(
    conversation =>
      conversation.id === currentConversationId
  );
}

/*
  IMPORTANT:
  A message does NOT create a new recent chat.

  Only createConversation() creates a conversation.

  Therefore:
  Hello
  How are you?
  Make a thumbnail
  etc.

  all remain inside the same conversation.
*/

function ensureConversation() {

  let conversation = getCurrentConversation();

  if (!conversation) {
    conversation = createConversation();
  }

  return conversation;
}

/* =========================================
   SMART TITLES
========================================= */

function createSmartTitle(text, mode = "chat") {

  const original = text.trim();

  const lower = original.toLowerCase();

  if (
    lower.includes("thumbnail") ||
    lower.includes("youtube thumbnail")
  ) {
    return "Thumbnail creation";
  }

  if (
    lower.includes("image") ||
    lower.includes("picture") ||
    lower.includes("generate a photo")
  ) {
    return "Image creation";
  }

  if (
    lower.includes("code") ||
    lower.includes("javascript") ||
    lower.includes("python") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("program")
  ) {
    return "Coding help";
  }

  if (
    lower.includes("research") ||
    lower.includes("research about") ||
    mode === "research"
  ) {
    return "Research";
  }

  if (
    lower.includes("study") ||
    lower.includes("learn") ||
    mode === "study"
  ) {
    return "Study session";
  }

  if (
    lower.includes("translate") ||
    lower.includes("translation")
  ) {
    return "Translation";
  }

  if (
    lower.includes("summarize") ||
    lower.includes("summary")
  ) {
    return "Summary";
  }

  if (
    lower.includes("brainstorm") ||
    mode === "brainstorm"
  ) {
    return "Brainstorm";
  }

  if (mode === "code") {
    return "Coding session";
  }

  if (mode === "creative") {
    return "Creative session";
  }

  if (mode === "plan") {
    return "Planning session";
  }

  if (
    lower === "hello" ||
    lower === "hi" ||
    lower === "hey" ||
    lower.startsWith("hello ") ||
    lower.startsWith("hi ")
  ) {
    return "General conversation";
  }

  const cleaned = original
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();

  if (!cleaned) {
    return "New conversation";
  }

  if (cleaned.length <= 34) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return (
    cleaned.slice(0, 34).trim() +
    "…"
  );
}

function getConversationIcon(conversation) {

  if (conversation.icon) {
    return conversation.icon;
  }

  const category =
    conversation.category || "chat";

  const icons = {
    chat: "💬",
    thumbnail: "🖼️",
    image: "🎨",
    code: "💻",
    research: "🔎",
    study: "📚",
    creative: "✦",
    plan: "☷"
  };

  return icons[category] || "💬";
}

function detectCategory(text, mode) {

  const lower = text.toLowerCase();

  if (
    lower.includes("thumbnail")
  ) {
    return "thumbnail";
  }

  if (
    lower.includes("image") ||
    lower.includes("picture")
  ) {
    return "image";
  }

  if (
    mode === "code" ||
    lower.includes("python") ||
    lower.includes("javascript") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("code")
  ) {
    return "code";
  }

  if (
    mode === "research" ||
    lower.includes("research")
  ) {
    return "research";
  }

  if (
    mode === "study" ||
    lower.includes("study")
  ) {
    return "study";
  }

  if (mode === "creative") {
    return "creative";
  }

  if (mode === "plan") {
    return "plan";
  }

  return "chat";
}

/* =========================================
   TIME
========================================= */

function formatTime(timestamp) {

  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  const now = new Date();

  const diff =
    now.getTime() -
    date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h`;
  }

  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}d`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}

/* =========================================
   RECENT CHATS
========================================= */

function renderRecentChats() {

  const container = $("recentChats");
  const empty = $("emptyRecent");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  /*
    ONE SIDEBAR ITEM = ONE CONVERSATION.

    Individual messages are never rendered here.
  */

  const sorted = [...conversations]
    .sort(
      (a, b) =>
        (b.updatedAt || b.createdAt || 0) -
        (a.updatedAt || a.createdAt || 0)
    );

  if (!sorted.length) {

    empty.style.display = "flex";

    return;
  }

  empty.style.display = "none";

  sorted.slice(0, 30).forEach(
    conversation => {

      const item =
        document.createElement("div");

      item.className =
        "recent-chat" +
        (
          conversation.id === currentConversationId
            ? " current"
            : ""
        );

      const messageCount =
        Array.isArray(conversation.messages)
          ? conversation.messages.length
          : 0;

      item.innerHTML = `
        <div class="recent-chat-icon">
          ${getConversationIcon(conversation)}
        </div>

        <div class="recent-chat-content">

          <div class="recent-chat-title">
            ${escapeHtml(
              conversation.title ||
              "New conversation"
            )}
          </div>

          <div class="recent-chat-meta">
            <span>
              ${messageCount} ${
                messageCount === 1
                  ? "message"
                  : "messages"
              }
            </span>

            <span>•</span>

            <span>
              ${formatTime(
                conversation.updatedAt ||
                conversation.createdAt
              )}
            </span>
          </div>

        </div>

        <button
          class="recent-chat-menu"
          title="Conversation options"
        >
          ⋮
        </button>
      `;

      item.addEventListener(
        "click",
        (event) => {

          if (
            event.target.closest(
              ".recent-chat-menu"
            )
          ) {
            return;
          }

          openConversation(
            conversation.id
          );
        }
      );

      const menu =
        item.querySelector(
          ".recent-chat-menu"
        );

      menu.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          showConversationMenu(
            conversation.id
          );
        }
      );

      container.appendChild(item);
    }
  );
}

/* =========================================
   OPEN CONVERSATION
========================================= */

function openConversation(id) {

  const conversation =
    conversations.find(
      item => item.id === id
    );

  if (!conversation) {
    return;
  }

  currentConversationId = id;

  renderConversation();

  renderRecentChats();
}

/* =========================================
   RENDER CONVERSATION
========================================= */

function renderConversation() {

  const messages = $("messages");
  const welcome = $("welcomeScreen");

  messages.innerHTML = "";

  const conversation =
    getCurrentConversation();

  if (
    !conversation ||
    !conversation.messages ||
    conversation.messages.length === 0
  ) {
    welcome.style.display = "flex";
    return;
  }

  welcome.style.display = "none";

  conversation.messages.forEach(
    message => {

      addMessageToUI(
        message.role,
        message.content,
        message.timestamp,
        false
      );
    }
  );

  scrollToBottom();
}

/* =========================================
   MESSAGE UI
========================================= */

function addMessageToUI(
  role,
  content,
  timestamp = Date.now(),
  scroll = true
) {

  const messages = $("messages");

  const row =
    document.createElement("div");

  row.className =
    `message-row ${role}`;

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.textContent =
    content;

  const meta =
    document.createElement("div");

  meta.className =
    "message-meta";

  meta.textContent =
    formatClock(timestamp);

  const wrapper =
    document.createElement("div");

  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);

  row.appendChild(wrapper);

  messages.appendChild(row);

  if (scroll) {
    scrollToBottom();
  }

  return bubble;
}

function formatClock(timestamp) {

  const date =
    new Date(timestamp);

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function addLoadingMessage() {

  const messages = $("messages");

  const row =
    document.createElement("div");

  row.className =
    "message-row assistant";

  row.id =
    "loadingMessage";

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.innerHTML = `
    <div class="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  row.appendChild(bubble);

  messages.appendChild(row);

  scrollToBottom();
}

function removeLoadingMessage() {

  const loading =
    $("loadingMessage");

  if (loading) {
    loading.remove();
  }
}

function scrollToBottom() {

  const area =
    $("chatArea");

  requestAnimationFrame(() => {
    area.scrollTop =
      area.scrollHeight;
  });
}

/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

  if (isSending) {
    return;
  }

  const input =
    $("messageInput");

  const text =
    input.value.trim();

  if (!text) {
    return;
  }

  /*
    THIS IS THE IMPORTANT FIX:

    We do NOT create a new conversation
    for every message.

    We reuse the current conversation.
  */

  const conversation =
    ensureConversation();

  const timestamp =
    Date.now();

  const isFirstMessage =
    conversation.messages.length === 0;

  if (isFirstMessage) {

    conversation.title =
      createSmartTitle(
        text,
        selectedMode
      );

    conversation.category =
      detectCategory(
        text,
        selectedMode
      );

    conversation.icon =
      getConversationIcon(
        conversation
      );
  }

  conversation.messages.push({
    role: "user",
    content: text,
    timestamp
  });

  conversation.updatedAt =
    timestamp;

  saveConversations();

  renderRecentChats();

  addMessageToUI(
    "user",
    text,
    timestamp
  );

  input.value = "";

  autoResizeTextarea();

  $("welcomeScreen").style.display =
    "none";

  isSending = true;

  $("sendBtn").disabled = true;

  addLoadingMessage();

  try {

    const customInstructions =
      $("customInstructions").value.trim();

    const response =
      await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message: text,

            model:
              selectedModel,

            personality:
              selectedPersonality,

            mode:
              selectedMode,

            customInstructions,

            /*
              Send the conversation history too.

              The backend can use this for
              proper context/memory.
            */
            history:
              conversation.messages.map(
                message => ({
                  role: message.role,
                  content: message.content
                })
              )
          })
        }
      );

    const data =
      await response.json();

    removeLoadingMessage();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "SAPI request failed."
      );
    }

    const reply =
      data.response ||
      data.text ||
      data.message ||
      "SAPI returned an empty response.";

    const replyTime =
      Date.now();

    conversation.messages.push({
      role: "assistant",
      content: reply,
      timestamp: replyTime
    });

    conversation.updatedAt =
      replyTime;

    saveConversations();

    addMessageToUI(
      "assistant",
      reply,
      replyTime
    );

    renderRecentChats();

  } catch (error) {

    removeLoadingMessage();

    const errorText =
      `SAPI error: ${error.message}`;

    conversation.messages.push({
      role: "assistant",
      content: errorText,
      timestamp: Date.now()
    });

    conversation.updatedAt =
      Date.now();

    saveConversations();

    addMessageToUI(
      "assistant",
      errorText
    );

    renderRecentChats();

    console.error(error);
  }

  isSending = false;

  $("sendBtn").disabled = false;

  input.focus();
}

/* =========================================
   CONVERSATION MENU
========================================= */

function showConversationMenu(id) {

  const conversation =
    conversations.find(
      item => item.id === id
    );

  if (!conversation) {
    return;
  }

  const action =
    prompt(
      `Conversation: ${conversation.title}\n\n` +
      `Type:\n` +
      `rename — rename conversation\n` +
      `delete — delete conversation\n` +
      `pin — pin conversation`
    );

  if (!action) {
    return;
  }

  const normalized =
    action.trim().toLowerCase();

  if (normalized === "rename") {

    const newTitle =
      prompt(
        "New conversation name:",
        conversation.title
      );

    if (
      newTitle &&
      newTitle.trim()
    ) {
      conversation.title =
        newTitle.trim();

      conversation.updatedAt =
        Date.now();

      saveConversations();

      renderRecentChats();
    }

    return;
  }

  if (normalized === "delete") {

    conversations =
      conversations.filter(
        item => item.id !== id
      );

    if (
      currentConversationId === id
    ) {
      currentConversationId = null;

      $("messages").innerHTML = "";

      $("welcomeScreen").style.display =
        "flex";
    }

    saveConversations();

    renderRecentChats();

    return;
  }

  if (normalized === "pin") {

    conversation.pinned =
      !conversation.pinned;

    saveConversations();

    renderRecentChats();

    return;
  }
}

/* =========================================
   NEW CHAT
========================================= */

function startNewChat() {

  currentConversationId = null;

  $("messages").innerHTML = "";

  $("welcomeScreen").style.display =
    "flex";

  $("messageInput").value = "";

  autoResizeTextarea();

  renderRecentChats();

  $("messageInput").focus();
}

/* =========================================
   SMART SELECTS
========================================= */

function closeAllSmartSelects(
  except = null
) {

  document
    .querySelectorAll(".smart-select.open")
    .forEach(select => {

      if (select !== except) {
        select.classList.remove("open");
      }

    });
}

function setupSmartSelects() {

  document
    .querySelectorAll(".smart-select")
    .forEach(select => {

      const trigger =
        select.querySelector(
          ".smart-select-trigger"
        );

      trigger.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const wasOpen =
            select.classList.contains(
              "open"
            );

          closeAllSmartSelects(
            wasOpen ? null : select
          );

          if (!wasOpen) {
            select.classList.add("open");
          }

        }
      );

      const options =
        select.querySelectorAll(
          ".smart-option"
        );

      options.forEach(option => {

        option.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const value =
              option.dataset.value;

            if (!value) {
              return;
            }

            options.forEach(
              item =>
                item.classList.remove(
                  "selected"
                )
            );

            option.classList.add(
              "selected"
            );

            select.classList.remove(
              "open"
            );

            updateSmartSelect(
              select.dataset.select,
              value,
              option
            );
          }
        );
      });

    });

  document.addEventListener(
    "click",
    () => {
      closeAllSmartSelects();
    }
  );
}

function updateSmartSelect(
  type,
  value,
  option
) {

  if (type === "model") {

    selectedModel = value;

    const title =
      option.querySelector(
        "strong"
      )?.textContent ||
      value;

    $("modelValue").textContent =
      title;

  }

  if (type === "personality") {

    selectedPersonality = value;

    const title =
      option.querySelector(
        "strong"
      )?.textContent ||
      value;

    $("personalityValue").textContent =
      title;

  }

  if (type === "mode") {

    selectedMode = value;

    const title =
      option.querySelector(
        "strong"
      )?.textContent ||
      value;

    $("modeValue").textContent =
      title;
  }

  saveSettings();
}

/* =========================================
   MODE QUICK ACTIONS
========================================= */

function selectMode(mode) {

  const select =
    document.querySelector(
      '.smart-select[data-select="mode"]'
    );

  if (!select) {
    return;
  }

  const option =
    select.querySelector(
      `.smart-option[data-value="${mode}"]`
    );

  if (!option) {
    return;
  }

  select
    .querySelectorAll(".smart-option")
    .forEach(item =>
      item.classList.remove(
        "selected"
      )
    );

  option.classList.add(
    "selected"
  );

  updateSmartSelect(
    "mode",
    mode,
    option
  );
}

/* =========================================
   LOAD MODELS
========================================= */

async function loadModels() {

  const menu =
    $("modelMenu");

  if (!menu) {
    return;
  }

  try {

    const response =
      await fetch(
        `${API_URL}/api/models`
      );

    const data =
      await response.json();

    let models = [];

    if (Array.isArray(data)) {
      models = data;
    }

    if (Array.isArray(data.models)) {
      models = data.models;
    }

    if (
      data.models &&
      typeof data.models === "object" &&
      !Array.isArray(data.models)
    ) {
      models =
        Object.entries(
          data.models
        ).map(
          ([id, info]) => ({
            id,
            ...(typeof info === "object"
              ? info
              : {
                  name: String(info)
                })
          })
        );
    }

    if (!models.length) {

      models = [
        {
          id: "google-gemini",
          name: "Gemini",
          description: "Google Gemini"
        }
      ];
    }

    menu.innerHTML = "";

    models.forEach(model => {

      const id =
        model.id ||
        model.key ||
        model.value ||
        model.name;

      const name =
        model.name ||
        model.label ||
        model.displayName ||
        id;

      const description =
        model.description ||
        model.provider ||
        "AI model";

      const option =
        document.createElement("button");

      option.className =
        "smart-option";

      option.dataset.value =
        id;

      option.innerHTML = `
        <span class="option-icon">✦</span>

        <span>
          <strong>
            ${escapeHtml(name)}
          </strong>

          <small>
            ${escapeHtml(description)}
          </small>
        </span>
      `;

      if (
        id === selectedModel ||
        (
          !selectedModel &&
          models.indexOf(model) === 0
        )
      ) {
        option.classList.add(
          "selected"
        );

        selectedModel = id;

        $("modelValue").textContent =
          name;
      }

      option.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          menu
            .querySelectorAll(
              ".smart-option"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "selected"
                )
            );

          option.classList.add(
            "selected"
          );

          selectedModel = id;

          $("modelValue").textContent =
            name;

          saveSettings();

          document
            .querySelector(
              '[data-select="model"]'
            )
            .classList.remove(
              "open"
            );
        }
      );

      menu.appendChild(option);
    });

    saveSettings();

  } catch (error) {

    console.warn(
      "Could not load model list:",
      error
    );

    menu.innerHTML = `
      <button
        class="smart-option selected"
        data-value="google-gemini"
      >
        <span class="option-icon">✦</span>
        <span>
          <strong>Gemini</strong>
          <small>Google Gemini</small>
        </span>
      </button>
    `;

    const fallback =
      menu.querySelector(
        ".smart-option"
      );

    fallback.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        selectedModel =
          "google-gemini";

        $("modelValue").textContent =
          "Gemini";

        saveSettings();

        document
          .querySelector(
            '[data-select="model"]'
          )
          .classList.remove(
            "open"
          );
      }
    );
  }
}

/* =========================================
   TEXTAREA
========================================= */

function autoResizeTextarea() {

  const textarea =
    $("messageInput");

  textarea.style.height =
    "auto";

  textarea.style.height =
    Math.min(
      textarea.scrollHeight,
      130
    ) + "px";
}

/* =========================================
   MOBILE
========================================= */

function setupMobileMenu() {

  $("mobileMenuBtn")
    .addEventListener(
      "click",
      () => {

        $("sidebar")
          .classList.toggle(
            "open"
          );
      }
    );

  document
    .querySelector(".main-area")
    .addEventListener(
      "click",
      () => {

        $("sidebar")
          .classList.remove(
            "open"
          );
      }
    );
}

/* =========================================
   CLEAR HISTORY
========================================= */

function clearRecentChats() {

  const confirmed =
    confirm(
      "Clear all locally saved SAPI conversations?"
    );

  if (!confirmed) {
    return;
  }

  conversations = [];

  currentConversationId =
    null;

  saveConversations();

  $("messages").innerHTML = "";

  $("welcomeScreen").style.display =
    "flex";

  renderRecentChats();

  showToast(
    "Conversation history cleared."
  );
}

/* =========================================
   TOAST
========================================= */

let toastTimer;

function showToast(message) {

  const toast =
    $("toast");

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      () => {
        toast.classList.remove(
          "show"
        );
      },
      2200
    );
}

/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================
   EVENT LISTENERS
========================================= */

function setupEvents() {

  $("newChatBtn")
    .addEventListener(
      "click",
      startNewChat
    );

  $("sendBtn")
    .addEventListener(
      "click",
      sendMessage
    );

  $("messageInput")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();
        }
      }
    );

  $("messageInput")
    .addEventListener(
      "input",
      autoResizeTextarea
    );

  $("clearRecentBtn")
    .addEventListener(
      "click",
      clearRecentChats
    );

  document
    .querySelectorAll(
      ".quick-action"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const mode =
            button.dataset.mode;

          selectMode(mode);

          $("messageInput").focus();
        }
      );
    });

  setupSmartSelects();

  setupMobileMenu();
}

/* =========================================
   START
========================================= */

async function init() {

  loadConversations();

  loadSettings();

  setupEvents();

  renderRecentChats();

  /*
    If the previous session had an active
    conversation, reopen it.
  */

  if (conversations.length > 0) {

    /*
      We intentionally don't automatically
      open the latest chat on page load.
      SAPI starts clean like a new workspace.
    */

    currentConversationId =
      null;

  }

  await loadModels();

  /*
    Restore personality.
  */

  const personalitySelect =
    document.querySelector(
      '[data-select="personality"]'
    );

  const personalityOption =
    personalitySelect?.querySelector(
      `.smart-option[data-value="${selectedPersonality}"]`
    );

  if (personalityOption) {

    personalitySelect
      .querySelectorAll(".smart-option")
      .forEach(
        item =>
          item.classList.remove(
            "selected"
          )
      );

    personalityOption.classList.add(
      "selected"
    );

    $("personalityValue").textContent =
      personalityOption.querySelector(
        "strong"
      )?.textContent ||
      "Standard";
  }

  /*
    Restore mode.
  */

  const modeSelect =
    document.querySelector(
      '[data-select="mode"]'
    );

  const modeOption =
    modeSelect?.querySelector(
      `.smart-option[data-value="${selectedMode}"]`
    );

  if (modeOption) {

    modeSelect
      .querySelectorAll(".smart-option")
      .forEach(
        item =>
          item.classList.remove(
            "selected"
          )
      );

    modeOption.classList.add(
      "selected"
    );

    $("modeValue").textContent =
      modeOption.querySelector(
        "strong"
      )?.textContent ||
      "Chat";
  }

  $("messageInput").focus();

  console.log(
    "SAPI AI interface loaded."
  );

  console.log(
    "Conversation system:",
    "one recent item per conversation"
  );
}

document.addEventListener(
  "DOMContentLoaded",
  init
);
