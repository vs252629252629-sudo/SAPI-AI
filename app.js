"use strict";

/* =========================================================
   SAPI AI — FRONTEND V4
   ========================================================= */

const API_URL = "https://sapi-ai.onrender.com";

const STORAGE = {
    conversations: "sapi_conversations_v4",
    settings: "sapi_settings_v4",
    memory: "sapi_memory_v4"
};


/* =========================================================
   STATE
   ========================================================= */

let conversations =
    JSON.parse(
        localStorage.getItem(STORAGE.conversations) || "[]"
    );

let settings =
    JSON.parse(
        localStorage.getItem(STORAGE.settings) || "{}"
    );

let memory =
    JSON.parse(
        localStorage.getItem(STORAGE.memory) || "[]"
    );

let currentConversationId = null;

let selectedModel =
    settings.model || "google-gemini";

let selectedPersonality =
    settings.personality || "standard";

let selectedMode =
    settings.mode || "chat";

let abortController = null;

let pendingAttachment = null;


/* =========================================================
   DOM
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


const elements = {

    messages: $("#messages"),

    welcome: $("#welcomeScreen"),

    messageInput: $("#messageInput"),

    sendBtn: $("#sendBtn"),

    attachBtn: $("#attachBtn"),

    fileInput: $("#fileInput"),

    voiceBtn: $("#voiceBtn"),

    attachmentPreview:
        $("#attachmentPreview"),

    recentChats:
        $("#recentChats"),

    chatSearch:
        $("#chatSearch"),

    newChatBtn:
        $("#newChatBtn"),

    customInstructions:
        $("#customInstructions"),

    modelSelector:
        $("#modelSelector"),

    personalitySelector:
        $("#personalitySelector"),

    modeSelector:
        $("#modeSelector"),

    modelMenu:
        $("#modelMenu"),

    personalityMenu:
        $("#personalityMenu"),

    modeMenu:
        $("#modeMenu"),

    modelValue:
        $("#modelValue"),

    personalityValue:
        $("#personalityValue"),

    modeValue:
        $("#modeValue"),

    settingsBtn:
        $("#settingsBtn"),

    topSettingsBtn:
        $("#topSettingsBtn"),

    shortcutBtn:
        $("#shortcutBtn"),

    mobileMenuBtn:
        $("#mobileMenuBtn"),

    sidebar:
        $("#sidebar")

};


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    ensureInitialConversation();

    renderRecentChats();

    updateSelectors();

    setupDropdowns();

    setupComposer();

    setupQuickActions();

    setupSidebar();

    setupSettings();

    setupKeyboardShortcuts();

    setupMobileMenu();

    restoreConversation();

}


/* =========================================================
   CONVERSATIONS
   ========================================================= */

function ensureInitialConversation() {

    if (!conversations.length) {

        createConversation();

    }

    if (!currentConversationId) {

        currentConversationId =
            conversations[0].id;

    }

}


function createConversation() {

    const conversation = {

        id:
            crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),

        title:
            "New conversation",

        messages: [],

        interactionId:
            null,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };

    conversations.unshift(
        conversation
    );

    currentConversationId =
        conversation.id;

    saveConversations();

    renderRecentChats();

    clearChat();

    return conversation;
}


function getCurrentConversation() {

    return conversations.find(
        conversation =>
            conversation.id ===
            currentConversationId
    );

}


function saveConversations() {

    localStorage.setItem(
        STORAGE.conversations,
        JSON.stringify(conversations)
    );

}


/* =========================================================
   NEW CHAT
   ========================================================= */

elements.newChatBtn?.addEventListener(
    "click",
    () => {

        createConversation();

    }
);


/* =========================================================
   RECENT CHATS
   ========================================================= */

function renderRecentChats(
    filter = ""
) {

    if (!elements.recentChats) {
        return;
    }

    const query =
        filter.trim().toLowerCase();

    const filtered =
        conversations.filter(
            conversation =>
                conversation.title
                    .toLowerCase()
                    .includes(query)
        );

    elements.recentChats.innerHTML = "";

    filtered
        .slice(0, 40)
        .forEach(conversation => {

            const button =
                document.createElement("button");

            button.className =
                "recent-chat" +
                (
                    conversation.id ===
                    currentConversationId
                        ? " active"
                        : ""
                );

            button.innerHTML = `
                <div class="recent-chat-title">
                    ${escapeHTML(conversation.title)}
                </div>

                <div class="recent-chat-date">
                    ${formatDate(conversation.updatedAt)}
                </div>
            `;

            button.addEventListener(
                "click",
                () => {

                    currentConversationId =
                        conversation.id;

                    restoreConversation();

                    renderRecentChats(
                        elements.chatSearch?.value || ""
                    );

                }
            );

            elements.recentChats.appendChild(
                button
            );

        });

}


elements.chatSearch?.addEventListener(
    "input",
    event => {

        renderRecentChats(
            event.target.value
        );

    }
);


/* =========================================================
   RESTORE CHAT
   ========================================================= */

function restoreConversation() {

    const conversation =
        getCurrentConversation();

    if (!conversation) {
        return;
    }

    clearChat();

    conversation.messages.forEach(
        message => {

            renderMessage(
                message.role,
                message.content,
                message.sources || [],
                false
            );

        }
    );

    if (
        conversation.messages.length
    ) {

        elements.welcome.style.display =
            "none";

    }

}


/* =========================================================
   CLEAR CHAT
   ========================================================= */

function clearChat() {

    if (elements.messages) {

        elements.messages.innerHTML =
            "";

    }

    if (elements.welcome) {

        elements.welcome.style.display =
            "block";

    }

}


/* =========================================================
   DROPDOWNS
   ========================================================= */

function setupDropdowns() {

    const selectors = [

        [
            elements.modelSelector,
            elements.modelMenu
        ],

        [
            elements.personalitySelector,
            elements.personalityMenu
        ],

        [
            elements.modeSelector,
            elements.modeMenu
        ]

    ];


    selectors.forEach(
        ([button, menu]) => {

            button?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    closeAllMenus(menu);

                    menu?.classList.toggle(
                        "open"
                    );

                }
            );

        }
    );


    $$(".dropdown-option").forEach(
        option => {

            option.addEventListener(
                "click",
                () => {

                    const type =
                        option.dataset.type;

                    const value =
                        option.dataset.value;

                    if (
                        option.classList.contains(
                            "disabled"
                        )
                    ) {

                        return;

                    }

                    if (type === "model") {

                        selectedModel =
                            value;

                    }

                    if (
                        type === "personality"
                    ) {

                        selectedPersonality =
                            value;

                    }

                    if (type === "mode") {

                        selectedMode =
                            value;

                    }

                    settings = {

                        ...settings,

                        model:
                            selectedModel,

                        personality:
                            selectedPersonality,

                        mode:
                            selectedMode

                    };

                    localStorage.setItem(
                        STORAGE.settings,
                        JSON.stringify(settings)
                    );

                    updateSelectors();

                    closeAllMenus();

                }
            );

        }
    );


    document.addEventListener(
        "click",
        () => {

            closeAllMenus();

        }
    );

}


function closeAllMenus(except = null) {

    [
        elements.modelMenu,
        elements.personalityMenu,
        elements.modeMenu

    ].forEach(menu => {

        if (
            menu &&
            menu !== except
        ) {

            menu.classList.remove(
                "open"
            );

        }

    });

}


/* =========================================================
   SELECTOR DISPLAY
   ========================================================= */

function updateSelectors() {

    const modelNames = {

        "google-gemini":
            "Gemini · Connected",

        "sapi-plus":
            "SAPI+ · Coming soon",

        "sapi-5.5-plus":
            "SAPI 5.5+ · Coming soon",

        "openai":
            "OpenAI · Coming soon",

        "anthropic":
            "Claude · Coming soon"

    };


    const personalityNames = {

        standard: "Standard",
        teacher: "Teacher",
        programmer: "Programmer",
        creative: "Creative",
        study: "Study",
        researcher: "Researcher",
        gamer: "Gamer",
        analyst: "Analyst",
        expert: "Expert",
        friendly: "Friendly",
        fast: "Fast",
        calm: "Calm"

    };


    const modeNames = {

        chat: "Chat",
        research: "Research",
        code: "Code",
        study: "Study",
        write: "Write",
        math: "Math",
        creative: "Creative",
        analyze: "Analyze",
        translate: "Translate",
        summarize: "Summarize",
        brainstorm: "Brainstorm",
        plan: "Plan"

    };


    if (elements.modelValue) {

        elements.modelValue.textContent =
            modelNames[selectedModel] ||
            selectedModel;

    }

    if (elements.personalityValue) {

        elements.personalityValue.textContent =
            personalityNames[
                selectedPersonality
            ] ||
            selectedPersonality;

    }

    if (elements.modeValue) {

        elements.modeValue.textContent =
            modeNames[selectedMode] ||
            selectedMode;

    }


    $$(".dropdown-option").forEach(
        option => {

            const type =
                option.dataset.type;

            const value =
                option.dataset.value;

            const selected =
                (
                    type === "model" &&
                    value === selectedModel
                ) ||
                (
                    type === "personality" &&
                    value === selectedPersonality
                ) ||
                (
                    type === "mode" &&
                    value === selectedMode
                );

            option.classList.toggle(
                "selected",
                selected
            );

        }
    );

}


/* =========================================================
   COMPOSER
   ========================================================= */

function setupComposer() {

    elements.sendBtn?.addEventListener(
        "click",
        sendMessage
    );


    elements.messageInput?.addEventListener(
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


    elements.messageInput?.addEventListener(
        "input",
        autoResize
    );


    elements.attachBtn?.addEventListener(
        "click",
        () => {

            elements.fileInput?.click();

        }
    );


    elements.fileInput?.addEventListener(
        "change",
        handleFile
    );


    elements.voiceBtn?.addEventListener(
        "click",
        startVoiceInput
    );

}


function autoResize() {

    const input =
        elements.messageInput;

    if (!input) {
        return;
    }

    input.style.height = "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            150
        ) + "px";

}


/* =========================================================
   SEND
   ========================================================= */

async function sendMessage() {

    const text =
        elements.messageInput
            ?.value
            .trim() || "";


    if (
        !text &&
        !pendingAttachment
    ) {

        return;

    }


    const conversation =
        getCurrentConversation();

    if (!conversation) {
        return;
    }


    const userMessage = {

        role: "user",

        content:
            text ||
            `Attached file: ${
                pendingAttachment?.originalName ||
                "file"
            }`,

        timestamp:
            Date.now()

    };


    conversation.messages.push(
        userMessage
    );

    conversation.updatedAt =
        Date.now();


    if (
        conversation.messages.length === 1
    ) {

        conversation.title =
            makeLocalTitle(text);

        generateTitleLater(
            conversation,
            text
        );

    }


    renderMessage(
        "user",
        userMessage.content,
        [],
        true
    );


    elements.messageInput.value =
        "";

    autoResize();

    if (elements.welcome) {

        elements.welcome.style.display =
            "none";

    }


    renderLoading();

    setSendingState(true);

    abortController =
        new AbortController();


    const history =
        conversation.messages
            .slice(-20)
            .map(message => ({

                role:
                    message.role,

                content:
                    message.content

            }));


    try {

        const response =
            await fetch(
                `${API_URL}/api/chat`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    signal:
                        abortController.signal,

                    body:
                        JSON.stringify({

                            conversationId:
                                conversation.id,

                            message:
                                text,

                            model:
                                selectedModel,

                            personality:
                                selectedPersonality,

                            mode:
                                selectedMode,

                            customInstructions:
                                elements.customInstructions
                                    ?.value ||
                                "",

                            memory,

                            previousInteractionId:
                                conversation.interactionId,

                            history,

                            attachment:
                                pendingAttachment

                        })

                }
            );


        const data =
            await response.json();


        removeLoading();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "SAPI AI request failed."
            );

        }


        conversation.interactionId =
            data.interactionId ||
            conversation.interactionId;


        const assistantMessage = {

            role: "assistant",

            content:
                data.response ||
                "No response returned.",

            sources:
                data.sources || [],

            timestamp:
                Date.now()

        };


        conversation.messages.push(
            assistantMessage
        );

        conversation.updatedAt =
            Date.now();


        renderMessage(
            "assistant",
            assistantMessage.content,
            assistantMessage.sources,
            true
        );


        if (
            Array.isArray(
                data.memorySuggestions
            )
        ) {

            data.memorySuggestions
                .forEach(addMemory);

        }


        saveConversations();

        renderRecentChats(
            elements.chatSearch?.value || ""
        );


        clearAttachment();


    } catch (error) {

        removeLoading();

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }


        renderMessage(
            "assistant",
            `⚠️ ${error.message}`,
            [],
            true
        );

    } finally {

        setSendingState(false);

        abortController =
            null;

    }

}


/* =========================================================
   LOADING
   ========================================================= */

function renderLoading() {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message assistant";

    wrapper.id =
        "sapi-loading";

    wrapper.innerHTML = `
        <div class="message-bubble">
            <div class="loading">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    elements.messages.appendChild(
        wrapper
    );

    scrollToBottom();

}


function removeLoading() {

    document
        .getElementById(
            "sapi-loading"
        )
        ?.remove();

}


function setSendingState(
    sending
) {

    if (!elements.sendBtn) {
        return;
    }

    elements.sendBtn.disabled =
        sending;

}


/* =========================================================
   RENDER MESSAGE
   ========================================================= */

function renderMessage(
    role,
    content,
    sources = [],
    scroll = true
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role}`;


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";


    bubble.innerHTML =
        formatMessage(content);


    wrapper.appendChild(
        bubble
    );


    if (
        role === "assistant" &&
        sources.length
    ) {

        const sourcesEl =
            document.createElement("div");

        sourcesEl.className =
            "sources";


        sources
            .slice(0, 10)
            .forEach(source => {

                if (!source.url) {
                    return;
                }

                const link =
                    document.createElement("a");

                link.className =
                    "source-chip";

                link.href =
                    source.url;

                link.target =
                    "_blank";

                link.rel =
                    "noopener noreferrer";

                link.textContent =
                    source.title ||
                    "Source";

                sourcesEl.appendChild(
                    link
                );

            });


        wrapper.appendChild(
            sourcesEl
        );

    }


    const actions =
        document.createElement("div");

    actions.className =
        "message-actions";


    if (
        role === "assistant"
    ) {

        actions.innerHTML = `
            <button data-action="copy">
                Copy
            </button>

            <button data-action="regenerate">
                Regenerate
            </button>
        `;

    } else {

        actions.innerHTML = `
            <button data-action="copy">
                Copy
            </button>

            <button data-action="edit">
                Edit
            </button>
        `;

    }


    actions
        .querySelector(
            '[data-action="copy"]'
        )
        ?.addEventListener(
            "click",
            () => {

                navigator.clipboard.writeText(
                    content
                );

            }
        );


    actions
        .querySelector(
            '[data-action="edit"]'
        )
        ?.addEventListener(
            "click",
            () => {

                elements.messageInput.value =
                    content;

                autoResize();

                elements.messageInput.focus();

            }
        );


    actions
        .querySelector(
            '[data-action="regenerate"]'
        )
        ?.addEventListener(
            "click",
            () => {

                regenerateLast();

            }
        );


    bubble.appendChild(
        actions
    );


    elements.messages.appendChild(
        wrapper
    );


    if (scroll) {

        scrollToBottom();

    }

}


/* =========================================================
   REGENERATE
   ========================================================= */

function regenerateLast() {

    const conversation =
        getCurrentConversation();

    if (!conversation) {
        return;
    }

    const lastAssistant =
        conversation.messages.findLast?.(
            message =>
                message.role === "assistant"
        );

    if (!lastAssistant) {
        return;
    }

    conversation.messages =
        conversation.messages.filter(
            message =>
                message !== lastAssistant
        );

    saveConversations();

    restoreConversation();

    sendMessage();

}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function setupQuickActions() {

    $$(".quick-card").forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const action =
                        card.dataset.action;

                    selectedMode =
                        action;

                    updateSelectors();

                    settings.mode =
                        selectedMode;

                    localStorage.setItem(
                        STORAGE.settings,
                        JSON.stringify(settings)
                    );

                    elements.messageInput.focus();

                }
            );

        }
    );

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function setupSidebar() {

    $$(".sidebar-item[data-workspace]")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    $$(".sidebar-item")
                        .forEach(
                            button =>
                                button.classList.remove(
                                    "active"
                                )
                        );

                    item.classList.add(
                        "active"
                    );

                    const workspace =
                        item.dataset.workspace;

                    if (
                        [
                            "brainstorm",
                            "code",
                            "research",
                            "study"
                        ].includes(workspace)
                    ) {

                        selectedMode =
                            workspace;

                        updateSelectors();

                    }

                }
            );

        });

}


/* =========================================================
   FILES
   ========================================================= */

async function handleFile(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }


    showAttachmentPreview(
        file.name
    );


    try {

        const form =
            new FormData();

        form.append(
            "file",
            file
        );


        const response =
            await fetch(
                `${API_URL}/api/files/upload`,
                {
                    method: "POST",
                    body: form
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "File upload failed."
            );

        }


        pendingAttachment =
            data.file;


        showAttachmentPreview(
            data.file.originalName ||
            file.name
        );


    } catch (error) {

        clearAttachment();

        alert(
            error.message
        );

    }

}


function showAttachmentPreview(
    name
) {

    if (!elements.attachmentPreview) {
        return;
    }

    elements.attachmentPreview.hidden =
        false;

    elements.attachmentPreview.innerHTML = `
        <span>📎 ${escapeHTML(name)}</span>
        <button id="removeAttachment">
            ×
        </button>
    `;

    $("#removeAttachment")
        ?.addEventListener(
            "click",
            clearAttachment
        );

}


function clearAttachment() {

    pendingAttachment =
        null;

    if (elements.fileInput) {

        elements.fileInput.value =
            "";

    }

    if (elements.attachmentPreview) {

        elements.attachmentPreview.hidden =
            true;

        elements.attachmentPreview.innerHTML =
            "";

    }

}


/* =========================================================
   VOICE
   ========================================================= */

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported by this browser."
        );

        return;

    }


    const recognition =
        new SpeechRecognition();

    recognition.lang =
        navigator.language ||
        "en-US";

    recognition.interimResults =
        false;

    recognition.continuous =
        false;


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0].transcript;

            elements.messageInput.value =
                (
                    elements.messageInput.value +
                    " " +
                    transcript
                ).trim();

            autoResize();

        };


    recognition.start();

}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    elements.settingsBtn?.addEventListener(
        "click",
        openSettings
    );

    elements.topSettingsBtn?.addEventListener(
        "click",
        openSettings
    );

}


function openSettings() {

    if (
        document.getElementById(
            "settingsModal"
        )
    ) {

        return;

    }


    const modal =
        document.createElement("div");

    modal.id =
        "settingsModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:1000;
        display:grid;
        place-items:center;
        background:rgba(0,0,0,.68);
        backdrop-filter:blur(8px);
    `;


    modal.innerHTML = `
        <div style="
            width:min(520px,92vw);
            background:#10131a;
            border:1px solid rgba(255,255,255,.1);
            border-radius:18px;
            padding:22px;
            box-shadow:0 30px 100px rgba(0,0,0,.55);
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:20px;
            ">

                <strong style="font-size:18px">
                    SAPI AI Settings
                </strong>

                <button
                    id="closeSettings"
                    style="
                        border:0;
                        background:rgba(255,255,255,.06);
                        color:white;
                        width:32px;
                        height:32px;
                        border-radius:8px;
                    "
                >
                    ×
                </button>

            </div>

            <label style="
                display:block;
                color:#8c93a6;
                font-size:11px;
                margin-bottom:7px;
            ">
                Default instructions
            </label>

            <textarea
                id="settingsInstructions"
                style="
                    width:100%;
                    min-height:100px;
                    resize:vertical;
                    background:#080a0f;
                    color:white;
                    border:1px solid rgba(255,255,255,.09);
                    border-radius:10px;
                    padding:12px;
                    outline:none;
                "
                placeholder="How should SAPI respond?"
            ></textarea>

            <button
                id="saveSettings"
                style="
                    width:100%;
                    height:40px;
                    margin-top:14px;
                    border:0;
                    border-radius:10px;
                    background:#806cff;
                    color:white;
                    font-weight:700;
                "
            >
                Save Settings
            </button>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    $("#settingsInstructions").value =
        settings.customInstructions || "";


    $("#closeSettings")
        .addEventListener(
            "click",
            () => modal.remove()
        );


    $("#saveSettings")
        .addEventListener(
            "click",
            () => {

                settings.customInstructions =
                    $("#settingsInstructions").value;

                localStorage.setItem(
                    STORAGE.settings,
                    JSON.stringify(settings)
                );

                if (
                    elements.customInstructions
                ) {

                    elements.customInstructions.value =
                        settings.customInstructions;

                }

                modal.remove();

            }
        );

}


/* =========================================================
   SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

    elements.shortcutBtn?.addEventListener(
        "click",
        () => {

            elements.messageInput?.focus();

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                elements.messageInput?.focus();

            }

            if (
                event.key === "Escape"
            ) {

                closeAllMenus();

            }

        }
    );

}


/* =========================================================
   MOBILE
   ========================================================= */

function setupMobileMenu() {

    elements.mobileMenuBtn?.addEventListener(
        "click",
        () => {

            elements.sidebar?.classList.toggle(
                "mobile-open"
            );

        }
    );

}


/* =========================================================
   TITLE
   ========================================================= */

async function generateTitleLater(
    conversation,
    message
) {

    try {

        const response =
            await fetch(
                `${API_URL}/api/title`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message
                        })

                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (data.title) {

            conversation.title =
                data.title;

            conversation.updatedAt =
                Date.now();

            saveConversations();

            renderRecentChats(
                elements.chatSearch?.value || ""
            );

        }

    } catch {

        // Local title remains active.

    }

}


/* =========================================================
   MEMORY
   ========================================================= */

function addMemory(
    value
) {

    if (!value) {
        return;
    }

    if (
        memory.includes(value)
    ) {
        return;
    }

    memory.unshift(value);

    memory =
        memory.slice(0, 30);

    localStorage.setItem(
        STORAGE.memory,
        JSON.stringify(memory)
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function makeLocalTitle(
    text
) {

    const words =
        text
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .slice(0, 6);

    if (!words.length) {
        return "New conversation";
    }

    return words.join(" ") +
        (
            text.trim().split(/\s+/).length > 6
                ? "..."
                : ""
        );

}


function formatDate(
    timestamp
) {

    if (!timestamp) {
        return "";
    }

    return new Date(
        timestamp
    ).toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );

}


function scrollToBottom() {

    elements.messages?.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });

    const area =
        $("#chatArea");

    if (area) {

        area.scrollTo({
            top: area.scrollHeight,
            behavior: "smooth"
        });

    }

}


function escapeHTML(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatMessage(
    text
) {

    let html =
        escapeHTML(
            String(text || "")
        );


    html =
        html.replace(
            /```([\s\S]*?)```/g,
            "<pre><code>$1</code></pre>"
        );


    html =
        html.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    html =
        html.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    html =
        html.replace(
            /\n/g,
            "<br>"
        );


    return html;

}


/* =========================================================
   RESTORE CUSTOM INSTRUCTIONS
   ========================================================= */

if (
    elements.customInstructions
) {

    elements.customInstructions.value =
        settings.customInstructions || "";

}
