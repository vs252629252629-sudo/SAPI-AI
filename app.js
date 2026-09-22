/* =========================================================
   SAPI AI — Frontend V3
   Built by Saprielle Studio.
   ========================================================= */

const API_URL = "https://sapi-ai.onrender.com";

const STORAGE = {
    conversations: "sapi_conversations_v3",
    settings: "sapi_settings_v3",
    memory: "sapi_memory_v3"
};

/* =========================================================
   STATE
   ========================================================= */

let conversations = loadJSON(STORAGE.conversations, []);
let settings = loadJSON(STORAGE.settings, {
    model: "google-gemini",
    personality: "standard",
    mode: "chat",
    customInstructions: "",
    theme: "dark"
});

let memory = loadJSON(STORAGE.memory, []);

let currentConversationId = null;
let selectedModel = settings.model || "google-gemini";
let selectedPersonality = settings.personality || "standard";
let selectedMode = settings.mode || "chat";

let pendingAttachment = null;
let abortController = null;
let isGenerating = false;

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function getMessagesContainer() {
    return $("#messagesContainer") || $("#messages");
}

function getInput() {
    return $("#messageInput");
}

function getSendButton() {
    return $("#sendBtn");
}

/* =========================================================
   STORAGE
   ========================================================= */

function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn("Storage error:", error);
    }
}

function saveConversations() {
    saveJSON(STORAGE.conversations, conversations);
}

function saveSettings() {
    settings.model = selectedModel;
    settings.personality = selectedPersonality;
    settings.mode = selectedMode;

    const instructions = $("#customInstructions");

    if (instructions) {
        settings.customInstructions = instructions.value || "";
    }

    saveJSON(STORAGE.settings, settings);
}

/* =========================================================
   UTILITIES
   ========================================================= */

function createId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;
}

function escapeHTML(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
    try {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "";
    }
}

function formatDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleDateString([], {
            month: "short",
            day: "numeric"
        });
    } catch {
        return "";
    }
}

function debounce(fn, delay = 250) {
    let timer;

    return (...args) => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

/* =========================================================
   MARKDOWN RENDERING
   ========================================================= */

function renderMarkdown(text = "") {
    let html = escapeHTML(text);

    html = html.replace(
        /```([\w+-]*)\n?([\s\S]*?)```/g,
        (_, language, code) => {
            return `
                <pre class="code-block">
                    <div class="code-header">
                        <span>${escapeHTML(language || "code")}</span>
                        <button class="copy-code-btn" type="button">Copy</button>
                    </div>
                    <code>${code}</code>
                </pre>
            `;
        }
    );

    html = html.replace(
        /`([^`]+)`/g,
        "<code class=\"inline-code\">$1</code>"
    );

    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );

    html = html.replace(
        /^### (.*)$/gm,
        "<h4>$1</h4>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h2>$1</h2>"
    );

    html = html.replace(
        /^\s*[-*] (.*)$/gm,
        "<li>$1</li>"
    );

    html = html.replace(
        /(<li>.*<\/li>)/gs,
        "<ul>$1</ul>"
    );

    html = html.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html.replace(
        /\n{2,}/g,
        "</p><p>"
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );

    return `<p>${html}</p>`;
}

/* =========================================================
   CONVERSATIONS
   ========================================================= */

function createConversation() {
    const conversation = {
        id: createId("conversation"),
        title: "New conversation",
        messages: [],
        pinned: false,
        archived: false,
        interactionId: null,
        attachments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    conversations.unshift(conversation);

    saveConversations();

    return conversation;
}

function getCurrentConversation() {
    return conversations.find(
        conversation => conversation.id === currentConversationId
    ) || null;
}

function ensureConversation() {
    let conversation = getCurrentConversation();

    if (!conversation) {
        conversation = createConversation();
        currentConversationId = conversation.id;
    }

    return conversation;
}

function saveMessage(role, content, extra = {}) {
    const conversation = ensureConversation();

    const message = {
        id: extra.id || createId("message"),
        role,
        content,
        timestamp: Date.now(),
        ...extra
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    if (
        role === "user" &&
        conversation.title === "New conversation"
    ) {
        conversation.title = makeLocalTitle(content);
    }

    saveConversations();

    return message;
}

function makeLocalTitle(text = "") {
    const cleaned = text
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) {
        return "New conversation";
    }

    if (cleaned.length <= 42) {
        return cleaned;
    }

    return `${cleaned.slice(0, 39)}...`;
}

function updateConversationTitle(title) {
    const conversation = getCurrentConversation();

    if (!conversation || !title) {
        return;
    }

    conversation.title = title.trim().slice(0, 80);
    conversation.updatedAt = Date.now();

    saveConversations();
    renderRecentChats();
}

async function generateConversationTitle(text) {
    try {
        const response = await fetch(`${API_URL}/api/title`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (data.title) {
            updateConversationTitle(data.title);
        }
    } catch {
        // Local title remains available.
    }
}

/* =========================================================
   CONVERSATION HISTORY
   ========================================================= */

function buildHistory(conversation) {
    if (!conversation) {
        return [];
    }

    return conversation.messages
        .filter(message =>
            message.role === "user" ||
            message.role === "assistant"
        )
        .map(message => ({
            role: message.role,
            content: message.content
        }));
}

/* =========================================================
   RENDER CONVERSATION
   ========================================================= */

function clearMessages() {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    container.innerHTML = "";
}

function renderConversation() {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    clearMessages();

    const conversation = getCurrentConversation();

    if (!conversation || conversation.messages.length === 0) {
        showWelcome();
        return;
    }

    hideWelcome();

    for (const message of conversation.messages) {
        renderMessage(message);
    }

    scrollToBottom();
}

function showWelcome() {
    const welcome = $("#welcomeScreen");

    if (welcome) {
        welcome.style.display = "";
    }
}

function hideWelcome() {
    const welcome = $("#welcomeScreen");

    if (welcome) {
        welcome.style.display = "none";
    }
}

function renderMessage(message) {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    const wrapper = document.createElement("div");

    wrapper.className = `message-row ${message.role}-row`;

    wrapper.dataset.messageId = message.id;

    const content = document.createElement("div");

    content.className = `message-bubble ${message.role}-message`;

    if (message.role === "assistant") {
        content.innerHTML = renderMarkdown(message.content);
    } else {
        content.innerHTML = `
            <div class="message-text">
                ${escapeHTML(message.content).replace(/\n/g, "<br>")}
            </div>
        `;
    }

    const meta = document.createElement("div");

    meta.className = "message-meta";

    meta.innerHTML = `
        <span>${formatTime(message.timestamp)}</span>
        <div class="message-actions">
            ${
                message.role === "assistant"
                    ? `
                        <button
                            type="button"
                            class="message-action"
                            data-action="copy"
                            data-message-id="${message.id}"
                        >
                            Copy
                        </button>
                        <button
                            type="button"
                            class="message-action"
                            data-action="regenerate"
                            data-message-id="${message.id}"
                        >
                            Regenerate
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="message-action"
                            data-action="edit"
                            data-message-id="${message.id}"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            class="message-action"
                            data-action="copy"
                            data-message-id="${message.id}"
                        >
                            Copy
                        </button>
                    `
            }
        </div>
    `;

    wrapper.appendChild(content);
    wrapper.appendChild(meta);

    container.appendChild(wrapper);

    attachCodeCopyHandlers(wrapper);
}

function addTemporaryMessage(role, content, id = "temporary") {
    const container = getMessagesContainer();

    if (!container) {
        return null;
    }

    hideWelcome();

    const message = {
        id,
        role,
        content,
        timestamp: Date.now()
    };

    renderMessage(message);

    scrollToBottom();

    return container.querySelector(
        `[data-message-id="${id}"]`
    );
}

/* =========================================================
   CODE COPY
   ========================================================= */

function attachCodeCopyHandlers(parent = document) {
    parent
        .querySelectorAll(".copy-code-btn")
        .forEach(button => {
            if (button.dataset.bound === "true") {
                return;
            }

            button.dataset.bound = "true";

            button.addEventListener("click", async () => {
                const code = button
                    .closest(".code-block")
                    ?.querySelector("code")
                    ?.innerText || "";

                await copyText(code);

                const oldText = button.textContent;

                button.textContent = "Copied";

                setTimeout(() => {
                    button.textContent = oldText;
                }, 1200);
            });
        });
}

/* =========================================================
   COPY
   ========================================================= */

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        try {
            document.execCommand("copy");
        } catch {}

        textarea.remove();

        return true;
    }
}

/* =========================================================
   MESSAGE ACTIONS
   ========================================================= */

async function handleMessageAction(action, messageId) {
    const conversation = getCurrentConversation();

    if (!conversation) {
        return;
    }

    const index = conversation.messages.findIndex(
        message => message.id === messageId
    );

    if (index === -1) {
        return;
    }

    const message = conversation.messages[index];

    if (action === "copy") {
        await copyText(message.content);
        return;
    }

    if (action === "edit") {
        editMessage(message);
        return;
    }

    if (action === "regenerate") {
        regenerateMessage(index);
    }
}

function editMessage(message) {
    const input = getInput();

    if (!input) {
        return;
    }

    input.value = message.content;

    autoResizeInput();

    input.focus();

    input.dataset.editingMessageId = message.id;
}

async function regenerateMessage(index) {
    const conversation = getCurrentConversation();

    if (!conversation) {
        return;
    }

    const assistantMessage = conversation.messages[index];

    if (
        !assistantMessage ||
        assistantMessage.role !== "assistant"
    ) {
        return;
    }

    const userMessage = conversation.messages[index - 1];

    if (!userMessage || userMessage.role !== "user") {
        return;
    }

    conversation.messages.splice(index);

    saveConversations();

    renderConversation();

    await sendMessage(userMessage.content, {
        regenerate: true,
        skipUserSave: true
    });
}

/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

/* =========================================================
   LOADING
   ========================================================= */

function addLoadingMessage() {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    hideWelcome();

    const wrapper = document.createElement("div");

    wrapper.className =
        "message-row assistant-row loading-row";

    wrapper.dataset.loading = "true";

    wrapper.innerHTML = `
        <div class="message-bubble assistant-message loading-message">
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    container.appendChild(wrapper);

    scrollToBottom();

    return wrapper;
}

function removeLoadingMessage() {
    document
        .querySelectorAll("[data-loading='true']")
        .forEach(element => element.remove());
}

/* =========================================================
   STREAM-LIKE ASSISTANT DISPLAY
   ========================================================= */

async function displayAssistantMessage(text) {
    const container = getMessagesContainer();

    if (!container) {
        return;
    }

    removeLoadingMessage();

    const temporaryId = createId("assistant");

    const wrapper = document.createElement("div");

    wrapper.className =
        "message-row assistant-row";

    wrapper.dataset.messageId = temporaryId;

    const bubble = document.createElement("div");

    bubble.className =
        "message-bubble assistant-message";

    wrapper.appendChild(bubble);

    container.appendChild(wrapper);

    const meta = document.createElement("div");

    meta.className = "message-meta";

    meta.innerHTML = `
        <span>${formatTime(Date.now())}</span>
        <div class="message-actions">
            <button
                type="button"
                class="message-action"
                data-action="copy"
                data-message-id="${temporaryId}"
            >
                Copy
            </button>
        </div>
    `;

    wrapper.appendChild(meta);

    const words = text.split(" ");

    let current = "";

    for (let i = 0; i < words.length; i++) {
        if (!isGenerating) {
            current = text;
            bubble.innerHTML = renderMarkdown(current);
            break;
        }

        current += (i === 0 ? "" : " ") + words[i];

        bubble.innerHTML = renderMarkdown(current);

        scrollToBottom();

        await new Promise(resolve => setTimeout(resolve, 8));
    }

    bubble.innerHTML = renderMarkdown(text);

    attachCodeCopyHandlers(wrapper);

    return wrapper;
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage(text = null, options = {}) {
    const input = getInput();

    if (isGenerating && !options.regenerate) {
        return;
    }

    let messageText =
        text !== null
            ? text
            : input?.value?.trim() || "";

    if (!messageText && !pendingAttachment) {
        return;
    }

    const editingId = input?.dataset.editingMessageId;

    if (editingId && !options.regenerate) {
        const conversation = getCurrentConversation();

        const message = conversation?.messages.find(
            item => item.id === editingId
        );

        if (message) {
            message.content = messageText;
            message.timestamp = Date.now();

            const messageIndex =
                conversation.messages.findIndex(
                    item => item.id === editingId
                );

            conversation.messages =
                conversation.messages.slice(
                    0,
                    messageIndex + 1
                );

            conversation.interactionId = null;
            conversation.updatedAt = Date.now();

            saveConversations();

            delete input.dataset.editingMessageId;

            if (input) {
                input.value = "";
            }

            renderConversation();

            const nextMessage =
                conversation.messages[messageIndex + 1];

            if (nextMessage) {
                conversation.messages.splice(
                    messageIndex + 1
                );
            }

            await sendMessage(messageText, {
                regenerate: true,
                skipUserSave: true
            });

            return;
        }
    }

    const conversation = ensureConversation();

    if (!options.skipUserSave) {
        saveMessage("user", messageText, {
            attachment: pendingAttachment
                ? {
                      name: pendingAttachment.name,
                      type: pendingAttachment.type
                  }
                : null
        });

        if (input) {
            input.value = "";
            autoResizeInput();
        }

        renderConversation();

        if (conversation.messages.length === 1) {
            generateConversationTitle(messageText);
        }
    }

    const history = buildHistory(conversation);

    setGenerating(true);

    addLoadingMessage();

    abortController = new AbortController();

    const customInstructions =
        $("#customInstructions")?.value ||
        settings.customInstructions ||
        "";

    const payload = {
        conversationId: conversation.id,
        message: messageText,
        model: selectedModel,
        personality: selectedPersonality,
        mode: selectedMode,
        customInstructions,
        memory,
        previousInteractionId:
            conversation.interactionId || null,
        history,
        attachment: pendingAttachment
    };

    try {
        const response = await fetch(
            `${API_URL}/api/chat`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: abortController.signal
            }
        );

        if (!response.ok) {
            let errorMessage =
                `SAPI server error (${response.status})`;

            try {
                const errorData =
                    await response.json();

                errorMessage =
                    errorData.error ||
                    errorData.message ||
                    errorMessage;
            } catch {}

            throw new Error(errorMessage);
        }

        const data = await response.json();

        const assistantText =
            data.response ||
            data.text ||
            data.message ||
            "I didn't receive a response.";

        if (data.interactionId) {
            conversation.interactionId =
                data.interactionId;
        }

        if (Array.isArray(data.memorySuggestions)) {
            for (const item of data.memorySuggestions) {
                if (
                    item &&
                    typeof item === "string" &&
                    !memory.includes(item)
                ) {
                    memory.push(item);
                }
            }

            saveJSON(STORAGE.memory, memory);
        }

        if (data.sources) {
            conversation.lastSources = data.sources;
        }

        removeLoadingMessage();

        await displayAssistantMessage(
            assistantText
        );

        saveMessage(
            "assistant",
            assistantText,
            {
                sources: data.sources || [],
                provider: data.provider || null,
                model: data.model || selectedModel
            }
        );

        saveConversations();

        renderConversation();

    } catch (error) {
        removeLoadingMessage();

        if (error.name === "AbortError") {
            addTemporaryMessage(
                "assistant",
                "Generation stopped."
            );
        } else {
            addTemporaryMessage(
                "assistant",
                `I couldn't complete that request.\n\n${error.message}`
            );
        }
    } finally {
        abortController = null;
        setGenerating(false);

        pendingAttachment = null;
        removeAttachmentChip();
    }
}

/* =========================================================
   GENERATION CONTROL
   ========================================================= */

function setGenerating(value) {
    isGenerating = value;

    const sendButton = getSendButton();

    if (sendButton) {
        sendButton.disabled = false;

        if (value) {
            sendButton.dataset.generating = "true";
            sendButton.setAttribute(
                "aria-label",
                "Stop generation"
            );
        } else {
            delete sendButton.dataset.generating;

            sendButton.setAttribute(
                "aria-label",
                "Send message"
            );
        }
    }

    if (value) {
        document.body.classList.add("sapi-generating");
    } else {
        document.body.classList.remove("sapi-generating");
    }
}

function stopGeneration() {
    if (!isGenerating) {
        return;
    }

    if (abortController) {
        abortController.abort();
    }
}

/* =========================================================
   NEW CHAT
   ========================================================= */

function startNewChat() {
    const conversation = createConversation();

    currentConversationId = conversation.id;

    renderConversation();
    renderRecentChats();

    const input = getInput();

    if (input) {
        input.value = "";
        input.focus();
    }

    pendingAttachment = null;

    removeAttachmentChip();
}

/* =========================================================
   RECENT CHATS
   ========================================================= */

function renderRecentChats() {
    const container = $("#recentChats");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const visible = conversations
        .filter(conversation => !conversation.archived)
        .sort((a, b) => {
            if (a.pinned && !b.pinned) {
                return -1;
            }

            if (!a.pinned && b.pinned) {
                return 1;
            }

            return b.updatedAt - a.updatedAt;
        });

    if (visible.length === 0) {
        const empty = document.createElement("div");

        empty.className = "recent-empty";

        empty.textContent = "No conversations yet.";

        container.appendChild(empty);

        return;
    }

    for (const conversation of visible.slice(0, 30)) {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "recent-chat-item";

        if (conversation.id === currentConversationId) {
            item.classList.add("active");
        }

        item.dataset.conversationId =
            conversation.id;

        item.innerHTML = `
            <span class="recent-chat-title">
                ${escapeHTML(conversation.title)}
            </span>
            <span class="recent-chat-date">
                ${formatDate(conversation.updatedAt)}
            </span>
        `;

        container.appendChild(item);
    }
}

function openConversation(id) {
    const conversation =
        conversations.find(item => item.id === id);

    if (!conversation) {
        return;
    }

    currentConversationId = id;

    renderConversation();
    renderRecentChats();
}

/* =========================================================
   CHAT MANAGEMENT
   ========================================================= */

function renameConversation(id) {
    const conversation =
        conversations.find(item => item.id === id);

    if (!conversation) {
        return;
    }

    const title = prompt(
        "Rename conversation:",
        conversation.title
    );

    if (!title?.trim()) {
        return;
    }

    conversation.title =
        title.trim().slice(0, 80);

    conversation.updatedAt = Date.now();

    saveConversations();
    renderRecentChats();
}

function togglePinConversation(id) {
    const conversation =
        conversations.find(item => item.id === id);

    if (!conversation) {
        return;
    }

    conversation.pinned =
        !conversation.pinned;

    saveConversations();
    renderRecentChats();
}

function archiveConversation(id) {
    const conversation =
        conversations.find(item => item.id === id);

    if (!conversation) {
        return;
    }

    conversation.archived = true;

    saveConversations();

    if (currentConversationId === id) {
        startNewChat();
    }

    renderRecentChats();
}

function deleteConversation(id) {
    const confirmed = confirm(
        "Delete this conversation?"
    );

    if (!confirmed) {
        return;
    }

    conversations =
        conversations.filter(
            conversation =>
                conversation.id !== id
        );

    saveConversations();

    if (currentConversationId === id) {
        currentConversationId = null;
        startNewChat();
    }

    renderRecentChats();
}

/* =========================================================
   CHAT SEARCH
   ========================================================= */

function searchConversations(query) {
    const normalized =
        query.trim().toLowerCase();

    const container = $("#recentChats");

    if (!container) {
        return;
    }

    if (!normalized) {
        renderRecentChats();
        return;
    }

    container.innerHTML = "";

    const matches = conversations.filter(
        conversation => {
            const inTitle =
                conversation.title
                    .toLowerCase()
                    .includes(normalized);

            const inMessages =
                conversation.messages.some(
                    message =>
                        message.content
                            ?.toLowerCase()
                            .includes(normalized)
                );

            return inTitle || inMessages;
        }
    );

    if (matches.length === 0) {
        container.innerHTML = `
            <div class="recent-empty">
                No matching conversations.
            </div>
        `;

        return;
    }

    for (const conversation of matches) {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "recent-chat-item";

        item.dataset.conversationId =
            conversation.id;

        item.innerHTML = `
            <span class="recent-chat-title">
                ${escapeHTML(conversation.title)}
            </span>
            <span class="recent-chat-date">
                ${formatDate(conversation.updatedAt)}
            </span>
        `;

        container.appendChild(item);
    }
}

/* =========================================================
   EXPORT
   ========================================================= */

function exportConversation() {
    const conversation =
        getCurrentConversation();

    if (!conversation) {
        return;
    }

    let output =
        `# ${conversation.title}\n\n`;

    output +=
        `Created: ${new Date(
            conversation.createdAt
        ).toLocaleString()}\n\n`;

    for (const message of conversation.messages) {
        const role =
            message.role === "user"
                ? "You"
                : "SAPI AI";

        output += `## ${role}\n\n`;
        output += `${message.content}\n\n`;
    }

    const blob = new Blob(
        [output],
        {
            type: "text/markdown;charset=utf-8"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `${conversation.title
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60) || "sapi-conversation"
        }.md`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

/* =========================================================
   SELECTORS
   ========================================================= */

function setupSelectors() {
    const modelSelect = $("#modelSelect");
    const personalitySelect =
        $("#personalitySelect");
    const modeSelect = $("#modeSelect");

    if (modelSelect) {
        modelSelect.value = selectedModel;

        modelSelect.addEventListener(
            "change",
            () => {
                selectedModel =
                    modelSelect.value;

                saveSettings();
            }
        );
    }

    if (personalitySelect) {
        personalitySelect.value =
            selectedPersonality;

        personalitySelect.addEventListener(
            "change",
            () => {
                selectedPersonality =
                    personalitySelect.value;

                saveSettings();
            }
        );
    }

    if (modeSelect) {
        modeSelect.value =
            selectedMode;

        modeSelect.addEventListener(
            "change",
            () => {
                selectedMode =
                    modeSelect.value;

                saveSettings();
            }
        );
    }
}

/* =========================================================
   CUSTOM INSTRUCTIONS
   ========================================================= */

function setupCustomInstructions() {
    const input =
        $("#customInstructions");

    if (!input) {
        return;
    }

    input.value =
        settings.customInstructions || "";

    input.addEventListener(
        "input",
        debounce(() => {
            settings.customInstructions =
                input.value;

            saveJSON(
                STORAGE.settings,
                settings
            );
        }, 400)
    );
}

/* =========================================================
   TEXTAREA
   ========================================================= */

function autoResizeInput() {
    const input = getInput();

    if (!input) {
        return;
    }

    input.style.height = "auto";

    input.style.height =
        `${Math.min(
            input.scrollHeight,
            220
        )}px`;
}

function setupInput() {
    const input = getInput();

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        autoResizeInput
    );

    input.addEventListener(
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
}

/* =========================================================
   SEND BUTTON
   ========================================================= */

function setupSendButton() {
    const button = getSendButton();

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            if (isGenerating) {
                stopGeneration();
            } else {
                sendMessage();
            }
        }
    );
}

/* =========================================================
   ATTACHMENTS
   ========================================================= */

function setupAttachments() {
    const attachButton =
        $("#attachBtn");

    if (!attachButton) {
        return;
    }

    const fileInput =
        document.createElement("input");

    fileInput.type = "file";

    fileInput.accept =
        ".pdf,.txt,.doc,.docx,.csv,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.mp4,.webm";

    fileInput.style.display = "none";

    document.body.appendChild(fileInput);

    attachButton.addEventListener(
        "click",
        () => {
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        "change",
        async () => {
            const file =
                fileInput.files?.[0];

            if (!file) {
                return;
            }

            await uploadAttachment(file);

            fileInput.value = "";
        }
    );
}

async function uploadAttachment(file) {
    if (file.size > 20 * 1024 * 1024) {
        alert(
            "Please choose a file smaller than 20 MB."
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    showAttachmentChip(
        file.name,
        true
    );

    try {
        const response =
            await fetch(
                `${API_URL}/api/files/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

        if (!response.ok) {
            throw new Error(
                `Upload failed (${response.status})`
            );
        }

        const data =
            await response.json();

        pendingAttachment = {
            name:
                data.name ||
                file.name,

            type:
                data.mimeType ||
                file.type,

            uri:
                data.uri ||
                data.fileUri ||
                null,

            fileId:
                data.fileId ||
                data.id ||
                null
        };

        showAttachmentChip(
            pendingAttachment.name,
            false
        );

    } catch (error) {
        pendingAttachment = null;

        removeAttachmentChip();

        alert(
            `Could not upload file: ${error.message}`
        );
    }
}

function showAttachmentChip(
    name,
    uploading = false
) {
    removeAttachmentChip();

    const input =
        getInput();

    if (!input) {
        return;
    }

    const chip =
        document.createElement("div");

    chip.id =
        "sapiAttachmentChip";

    chip.className =
        "attachment-chip";

    chip.innerHTML = `
        <span class="attachment-name">
            ${escapeHTML(name)}
        </span>
        <span class="attachment-status">
            ${uploading ? "Uploading..." : "Attached"}
        </span>
        <button
            type="button"
            class="attachment-remove"
            aria-label="Remove attachment"
        >
            Remove
        </button>
    `;

    const composer =
        input.closest(".composer") ||
        input.parentElement;

    if (composer) {
        composer.insertBefore(
            chip,
            composer.firstChild
        );
    }

    chip
        .querySelector(
            ".attachment-remove"
        )
        ?.addEventListener(
            "click",
            () => {
                pendingAttachment = null;
                removeAttachmentChip();
            }
        );
}

function removeAttachmentChip() {
    document
        .getElementById(
            "sapiAttachmentChip"
        )
        ?.remove();
}

/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function setupQuickActions() {
    $$(".quick-action, .quick-card")
        .forEach(card => {
            if (
                card.dataset.sapiBound ===
                "true"
            ) {
                return;
            }

            card.dataset.sapiBound =
                "true";

            card.addEventListener(
                "click",
                () => {
                    const mode =
                        card.dataset.mode ||
                        card.dataset.action;

                    handleQuickAction(mode);
                }
            );
        });
}

function handleQuickAction(action) {
    const input = getInput();

    if (!input) {
        return;
    }

    const prompts = {
        ask:
            "Help me understand this topic:",

        code:
            "Write and explain the code for:",

        research:
            "Research this topic and provide sources:",

        study:
            "Teach me this topic step by step:",

        brainstorm:
            "Help me brainstorm ideas for:",

        write:
            "Help me write:"
    };

    const prompt =
        prompts[action] ||
        "";

    if (prompt) {
        input.value =
            prompt + " ";

        autoResizeInput();

        input.focus();
    }

    const modeMap = {
        ask: "chat",
        code: "code",
        research: "research",
        study: "study",
        brainstorm: "brainstorm",
        write: "write"
    };

    if (
        modeMap[action] &&
        $("#modeSelect")
    ) {
        selectedMode =
            modeMap[action];

        $("#modeSelect").value =
            selectedMode;

        saveSettings();
    }
}

/* =========================================================
   RECENT CHAT EVENTS
   ========================================================= */

function setupRecentChats() {
    const container =
        $("#recentChats");

    if (!container) {
        return;
    }

    container.addEventListener(
        "click",
        event => {
            const item =
                event.target.closest(
                    ".recent-chat-item"
                );

            if (!item) {
                return;
            }

            const id =
                item.dataset.conversationId;

            openConversation(id);
        }
    );
}

/* =========================================================
   SEARCH FIELD
   ========================================================= */

function createSearchInput() {
    const recent =
        $("#recentChats");

    if (!recent) {
        return;
    }

    const section =
        recent.closest(
            ".recent-section"
        );

    if (!section) {
        return;
    }

    if (
        section.querySelector(
            ".sapi-chat-search"
        )
    ) {
        return;
    }

    const input =
        document.createElement("input");

    input.type = "search";

    input.className =
        "sapi-chat-search";

    input.placeholder =
        "Search chats...";

    section.insertBefore(
        input,
        recent
    );

    input.addEventListener(
        "input",
        debounce(
            event => {
                searchConversations(
                    event.target.value
                );
            },
            180
        )
    );
}

/* =========================================================
   SETTINGS MODAL
   ========================================================= */

function setupSettings() {
    const settingsButtons =
        [
            $("#settingsBtn"),
            $("#topSettingsBtn")
        ].filter(Boolean);

    settingsButtons.forEach(button => {
        button.addEventListener(
            "click",
            openSettingsModal
        );
    });
}

function openSettingsModal() {
    if (
        document.getElementById(
            "sapiSettingsModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "sapiSettingsModal";

    modal.className =
        "sapi-modal-backdrop";

    modal.innerHTML = `
        <div class="sapi-modal">
            <div class="sapi-modal-header">
                <div>
                    <h2>SAPI Settings</h2>
                    <p>Customize your SAPI AI experience.</p>
                </div>

                <button
                    type="button"
                    class="sapi-modal-close"
                    data-close-settings
                >
                    Close
                </button>
            </div>

            <div class="sapi-settings-grid">

                <label class="sapi-setting">
                    <span>Custom instructions</span>

                    <textarea
                        id="modalCustomInstructions"
                        rows="5"
                        placeholder="Tell SAPI how you want it to respond..."
                    ></textarea>
                </label>

                <label class="sapi-setting">
                    <span>Theme</span>

                    <select id="sapiThemeSelect">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </label>

            </div>

            <div class="sapi-modal-footer">
                <button
                    type="button"
                    class="sapi-secondary-btn"
                    data-export-chat
                >
                    Export conversation
                </button>

                <button
                    type="button"
                    class="sapi-primary-btn"
                    data-save-settings
                >
                    Save settings
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalInstructions =
        modal.querySelector(
            "#modalCustomInstructions"
        );

    modalInstructions.value =
        settings.customInstructions || "";

    const themeSelect =
        modal.querySelector(
            "#sapiThemeSelect"
        );

    themeSelect.value =
        settings.theme || "dark";

    modal.addEventListener(
        "click",
        event => {
            if (
                event.target === modal ||
                event.target.closest(
                    "[data-close-settings]"
                )
            ) {
                modal.remove();
            }

            if (
                event.target.closest(
                    "[data-export-chat]"
                )
            ) {
                exportConversation();
            }

            if (
                event.target.closest(
                    "[data-save-settings]"
                )
            ) {
                settings.customInstructions =
                    modalInstructions.value;

                settings.theme =
                    themeSelect.value;

                saveJSON(
                    STORAGE.settings,
                    settings
                );

                applyTheme();

                const mainInstructions =
                    $("#customInstructions");

                if (mainInstructions) {
                    mainInstructions.value =
                        modalInstructions.value;
                }

                modal.remove();
            }
        }
    );
}

/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
    document.documentElement.dataset.theme =
        settings.theme || "dark";
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function setupMobileSidebar() {
    const overlay =
        $("#mobileOverlay");

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!overlay || !sidebar) {
        return;
    }

    overlay.addEventListener(
        "click",
        () => {
            sidebar.classList.remove(
                "mobile-open"
            );

            overlay.classList.remove(
                "active"
            );
        }
    );
}

/* =========================================================
   PROFILE
   ========================================================= */

function setupProfile() {
    const profile =
        $(".profile-button");

    if (!profile) {
        return;
    }

    profile.addEventListener(
        "click",
        openSettingsModal
    );
}

/* =========================================================
   VOICE INPUT
   ========================================================= */

function setupVoice() {
    const button =
        $("#voiceBtn");

    if (!button) {
        return;
    }

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        button.addEventListener(
            "click",
            () => {
                alert(
                    "Voice input is not supported by this browser."
                );
            }
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang =
        navigator.language || "en-US";

    recognition.interimResults =
        false;

    recognition.continuous =
        false;

    recognition.onstart = () => {
        button.classList.add(
            "recording"
        );
    };

    recognition.onend = () => {
        button.classList.remove(
            "recording"
        );
    };

    recognition.onerror = () => {
        button.classList.remove(
            "recording"
        );
    };

    recognition.onresult =
        event => {
            const transcript =
                event.results?.[0]?.[0]?.transcript ||
                "";

            const input =
                getInput();

            if (!input) {
                return;
            }

            input.value =
                `${input.value} ${transcript}`.trim();

            autoResizeInput();

            input.focus();
        };

    button.addEventListener(
        "click",
        () => {
            try {
                recognition.start();
            } catch {}
        }
    );
}

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {
    document.addEventListener(
        "keydown",
        event => {
            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() ===
                    "k"
            ) {
                event.preventDefault();

                getInput()?.focus();
            }

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() ===
                    "n"
            ) {
                event.preventDefault();

                startNewChat();
            }

            if (
                event.key === "Escape" &&
                isGenerating
            ) {
                stopGeneration();
            }
        }
    );
}

/* =========================================================
   MESSAGE ACTION DELEGATION
   ========================================================= */

function setupMessageActions() {
    const container =
        getMessagesContainer();

    if (!container) {
        return;
    }

    container.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    ".message-action"
                );

            if (!button) {
                return;
            }

            const action =
                button.dataset.action;

            const messageId =
                button.dataset.messageId;

            if (
                action &&
                messageId
            ) {
                handleMessageAction(
                    action,
                    messageId
                );
            }
        }
    );
}

/* =========================================================
   NEW CHAT BUTTON
   ========================================================= */

function setupNewChatButton() {
    const button =
        $("#newChatBtn") ||
        $(".new-chat-btn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        startNewChat
    );
}

/* =========================================================
   INITIAL CONVERSATION
   ========================================================= */

function initializeConversation() {
    const existing =
        conversations
            .filter(
                conversation =>
                    !conversation.archived
            )
            .sort(
                (a, b) =>
                    b.updatedAt -
                    a.updatedAt
            );

    if (existing.length > 0) {
        currentConversationId =
            existing[0].id;

        renderConversation();
    } else {
        const conversation =
            createConversation();

        currentConversationId =
            conversation.id;

        renderConversation();
    }

    renderRecentChats();
}

/* =========================================================
   SERVER STATUS
   ========================================================= */

async function checkServer() {
    try {
        const response =
            await fetch(
                `${API_URL}/api/health`,
                {
                    method: "GET"
                }
            );

        if (!response.ok) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initializeSAPI() {
    console.log(
        "SAPI AI frontend initializing..."
    );

    applyTheme();

    setupSelectors();
    setupCustomInstructions();
    setupInput();
    setupSendButton();
    setupAttachments();
    setupQuickActions();
    setupRecentChats();
    setupSettings();
    setupMobileSidebar();
    setupProfile();
    setupVoice();
    setupKeyboardShortcuts();
    setupMessageActions();
    setupNewChatButton();

    createSearchInput();

    initializeConversation();

    await checkServer();

    console.log(
        "SAPI AI frontend ready."
    );
}

/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSAPI
    );
} else {
    initializeSAPI();
}
