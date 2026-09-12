// ========================================
// SAPI AI — FRONTEND
// Built by Saprielle Studio
// ========================================

const API_URL = "https://sapi-ai.onrender.com";

// ========================================
// ELEMENTS
// ========================================

const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const modelSelect = document.getElementById("modelSelect");
const selectedModel = document.getElementById("selectedModel");

const newChat = document.getElementById("newChat");
const recentChats = document.getElementById("recentChats");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// ========================================
// STATE
// ========================================

let conversations = [];

try {
    conversations = JSON.parse(
        localStorage.getItem("sapi_conversations") || "[]"
    );

    if (!Array.isArray(conversations)) {
        conversations = [];
    }
} catch {
    conversations = [];
}

let currentConversationId = null;


// ========================================
// PARTICLES
// ========================================

const particles = document.getElementById("particles");

if (particles) {
    for (let i = 0; i < 45; i++) {
        const particle = document.createElement("span");

        particle.className = "particle";

        particle.style.left =
            Math.random() * 100 + "%";

        particle.style.top =
            Math.random() * 100 + "%";

        particle.style.animationDelay =
            Math.random() * 8 + "s";

        particle.style.animationDuration =
            5 + Math.random() * 8 + "s";

        particles.appendChild(particle);
    }
}


// ========================================
// STORAGE
// ========================================

function saveConversations() {
    localStorage.setItem(
        "sapi_conversations",
        JSON.stringify(conversations)
    );
}


// ========================================
// CREATE CONVERSATION
// ========================================

function createConversation(firstMessage = "New Chat") {

    const conversation = {
        id: Date.now().toString(),

        title:
            firstMessage.length > 40
                ? firstMessage.substring(0, 40) + "..."
                : firstMessage,

        model:
            modelSelect.value || "google-gemini",

        messages: [],

        pinned: false,

        archived: false,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };

    conversations.unshift(conversation);

    currentConversationId =
        conversation.id;

    saveConversations();

    renderRecentChats();

    return conversation;
}


// ========================================
// GET CURRENT CONVERSATION
// ========================================

function getCurrentConversation() {

    return conversations.find(
        conversation =>
            conversation.id ===
            currentConversationId
    );
}


// ========================================
// SAVE MESSAGE
// ========================================

function saveMessageToConversation(
    text,
    sender
) {

    let conversation =
        getCurrentConversation();

    if (!conversation) {
        conversation =
            createConversation(text);
    }

    conversation.messages.push({

        id:
            Date.now().toString(),

        sender,

        text,

        timestamp:
            new Date().toISOString()
    });

    conversation.updatedAt =
        new Date().toISOString();

    saveConversations();

    renderRecentChats();
}


// ========================================
// ADD MESSAGE
// ========================================

function addMessage(
    text,
    sender = "ai",
    save = true
) {

    if (welcome) {
        welcome.style.display = "none";
    }

    const message =
        document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        sender === "user"
            ? "U"
            : "S";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    const messageText =
        document.createElement("div");

    messageText.className =
        "message-text";

    messageText.textContent =
        text;

    content.appendChild(messageText);

    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);

    messages.scrollTop =
        messages.scrollHeight;

    if (save) {

        saveMessageToConversation(
            text,
            sender
        );
    }
}


// ========================================
// LOADING MESSAGE
// ========================================

function addLoadingMessage() {

    const loading =
        document.createElement("div");

    loading.className =
        "message ai-message";

    loading.innerHTML = `
        <div class="message-avatar">S</div>

        <div class="message-content">

            <div class="message-text sapi-loading">
                SAPI is thinking...
            </div>

        </div>
    `;

    messages.appendChild(
        loading
    );

    messages.scrollTop =
        messages.scrollHeight;

    return loading;
}


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text =
        promptInput.value.trim();

    if (!text) {
        return;
    }

    const model =
        modelSelect.value;

    addMessage(
        text,
        "user"
    );

    promptInput.value = "";

    promptInput.style.height =
        "auto";

    sendButton.disabled =
        true;

    const loading =
        addLoadingMessage();

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

                    body:
                        JSON.stringify({
                            message: text,
                            model: model
                        })
                }
            );

        const data =
            await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "SAPI backend error."
            );
        }

        addMessage(
            data.response ||
            "SAPI returned an empty response.",
            "ai"
        );

    } catch (error) {

        console.error(
            "SAPI Error:",
            error
        );

        loading.remove();

        addMessage(
            "SAPI couldn't reach the backend right now. Please try again.",
            "ai"
        );

    } finally {

        sendButton.disabled =
            false;

        promptInput.focus();
    }
}


// ========================================
// SEND BUTTON
// ========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


// ========================================
// ENTER TO SEND
// ========================================

if (promptInput) {

    promptInput.addEventListener(
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


    // ========================================
    // AUTO RESIZE
    // ========================================

    promptInput.addEventListener(
        "input",
        () => {

            promptInput.style.height =
                "auto";

            promptInput.style.height =
                Math.min(
                    promptInput.scrollHeight,
                    180
                ) + "px";
        }
    );
}


// ========================================
// MODEL SELECTOR
// ========================================

if (modelSelect) {

    modelSelect.addEventListener(
        "change",
        () => {

            const option =
                modelSelect.options[
                    modelSelect.selectedIndex
                ];

            if (!option) {
                return;
            }

            selectedModel.textContent =
                option.text;

            const conversation =
                getCurrentConversation();

            if (conversation) {

                conversation.model =
                    modelSelect.value;

                conversation.updatedAt =
                    new Date().toISOString();

                saveConversations();
            }
        }
    );
}


// ========================================
// QUICK ACTIONS
// ========================================

document
    .querySelectorAll(".quick-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const prompt =
                    card.dataset.prompt;

                promptInput.value =
                    prompt;

                promptInput.focus();

                promptInput.dispatchEvent(
                    new Event("input")
                );
            }
        );
    });


// ========================================
// RENDER RECENT CHATS
// ========================================

function renderRecentChats() {

    if (!recentChats) {
        return;
    }

    recentChats.innerHTML = "";

    const visibleChats =
        conversations
            .filter(
                conversation =>
                    !conversation.archived
            )
            .sort(
                (a, b) => {

                    if (
                        a.pinned &&
                        !b.pinned
                    ) {
                        return -1;
                    }

                    if (
                        !a.pinned &&
                        b.pinned
                    ) {
                        return 1;
                    }

                    return (
                        new Date(
                            b.updatedAt
                        ) -
                        new Date(
                            a.updatedAt
                        )
                    );
                }
            )
            .slice(0, 12);

    if (visibleChats.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-chats";

        empty.textContent =
            "No recent chats yet";

        recentChats.appendChild(
            empty
        );

        return;
    }

    visibleChats.forEach(
        conversation => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "chat-item-wrapper";

            // ========================================
            // CHAT BUTTON
            // ========================================

            const item =
                document.createElement("button");

            item.type = "button";

            item.className =
                "chat-item";

            if (
                conversation.id ===
                currentConversationId
            ) {

                item.classList.add(
                    "active"
                );
            }

            const title =
                document.createElement("span");

            title.className =
                "chat-item-title";

            title.textContent =
                conversation.title;

            item.appendChild(title);

            if (conversation.pinned) {

                const pin =
                    document.createElement("span");

                pin.className =
                    "chat-pin";

                pin.textContent =
                    "📌";

                item.appendChild(pin);
            }

            item.addEventListener(
                "click",
                () => {

                    loadConversation(
                        conversation.id
                    );
                }
            );

            // ========================================
            // MENU BUTTON
            // ========================================

            const menuButton =
                document.createElement("button");

            menuButton.type =
                "button";

            menuButton.className =
                "chat-menu-button";

            menuButton.textContent =
                "⋮";

            menuButton.setAttribute(
                "aria-label",
                "Chat options"
            );

            menuButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleChatMenu(
                        wrapper,
                        conversation
                    );
                }
            );

            wrapper.appendChild(item);

            wrapper.appendChild(
                menuButton
            );

            recentChats.appendChild(
                wrapper
            );
        }
    );
}


// ========================================
// CHAT MENU
// ========================================

function toggleChatMenu(
    wrapper,
    conversation
) {

    document
        .querySelectorAll(".chat-menu")
        .forEach(menu => {

            menu.remove();
        });

    const menu =
        document.createElement("div");

    menu.className =
        "chat-menu";

    // ========================================
    // RENAME
    // ========================================

    const rename =
        document.createElement("button");

    rename.type = "button";

    rename.textContent =
        "✏️ Rename";

    rename.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            renameConversation(
                conversation.id
            );

            menu.remove();
        }
    );

    // ========================================
    // PIN
    // ========================================

    const pin =
        document.createElement("button");

    pin.type = "button";

    pin.textContent =
        conversation.pinned
            ? "📌 Unpin"
            : "📌 Pin";

    pin.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            togglePinConversation(
                conversation.id
            );

            menu.remove();
        }
    );

    // ========================================
    // ARCHIVE
    // ========================================

    const archive =
        document.createElement("button");

    archive.type = "button";

    archive.textContent =
        "📦 Archive";

    archive.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            archiveConversation(
                conversation.id
            );

            menu.remove();
        }
    );

    // ========================================
    // DELETE
    // ========================================

    const remove =
        document.createElement("button");

    remove.type = "button";

    remove.className =
        "danger";

    remove.textContent =
        "🗑️ Delete";

    remove.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            deleteConversation(
                conversation.id
            );

            menu.remove();
        }
    );

    menu.appendChild(rename);
    menu.appendChild(pin);
    menu.appendChild(archive);
    menu.appendChild(remove);

    wrapper.appendChild(menu);
}


// ========================================
// RENAME CONVERSATION
// ========================================

function renameConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            chat =>
                chat.id ===
                conversationId
        );

    if (!conversation) {
        return;
    }

    const newTitle =
        window.prompt(
            "Rename chat:",
            conversation.title
        );

    if (newTitle === null) {
        return;
    }

    const cleanTitle =
        newTitle.trim();

    if (!cleanTitle) {
        return;
    }

    conversation.title =
        cleanTitle.substring(
            0,
            60
        );

    conversation.updatedAt =
        new Date().toISOString();

    saveConversations();

    renderRecentChats();
}


// ========================================
// PIN / UNPIN
// ========================================

function togglePinConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            chat =>
                chat.id ===
                conversationId
        );

    if (!conversation) {
        return;
    }

    conversation.pinned =
        !conversation.pinned;

    conversation.updatedAt =
        new Date().toISOString();

    saveConversations();

    renderRecentChats();
}


// ========================================
// ARCHIVE
// ========================================

function archiveConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            chat =>
                chat.id ===
                conversationId
        );

    if (!conversation) {
        return;
    }

    conversation.archived =
        true;

    conversation.updatedAt =
        new Date().toISOString();

    saveConversations();

    if (
        currentConversationId ===
        conversationId
    ) {

        currentConversationId =
            null;

        messages.innerHTML = "";

        welcome.style.display =
            "flex";
    }

    renderRecentChats();
}


// ========================================
// DELETE
// ========================================

function deleteConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            chat =>
                chat.id ===
                conversationId
        );

    if (!conversation) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete "${conversation.title}"?`
        );

    if (!confirmed) {
        return;
    }

    conversations =
        conversations.filter(
            chat =>
                chat.id !==
                conversationId
        );

    saveConversations();

    if (
        currentConversationId ===
        conversationId
    ) {

        currentConversationId =
            null;

        messages.innerHTML = "";

        welcome.style.display =
            "flex";
    }

    renderRecentChats();
}


// ========================================
// LOAD CONVERSATION
// ========================================

function loadConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            chat =>
                chat.id ===
                conversationId
        );

    if (!conversation) {
        return;
    }

    currentConversationId =
        conversation.id;

    messages.innerHTML = "";

    welcome.style.display =
        "none";

    conversation.messages.forEach(
        message => {

            addMessage(
                message.text,
                message.sender,
                false
            );
        }
    );

    const modelOption =
        Array.from(
            modelSelect.options
        ).find(
            option =>
                option.value ===
                conversation.model
        );

    if (modelOption) {

        modelSelect.value =
            conversation.model;

        selectedModel.textContent =
            modelOption.text;
    }

    renderRecentChats();

    messages.scrollTop =
        messages.scrollHeight;

    closeMobileMenu();
}


// ========================================
// NEW CHAT
// ========================================

if (newChat) {

    newChat.addEventListener(
        "click",
        () => {

            currentConversationId =
                null;

            messages.innerHTML = "";

            welcome.style.display =
                "flex";

            promptInput.value = "";

            promptInput.style.height =
                "auto";

            renderRecentChats();

            promptInput.focus();

            closeMobileMenu();
        }
    );
}


// ========================================
// MOBILE MENU
// ========================================

if (mobileMenu) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.add(
                "open"
            );

            overlay.classList.add(
                "show"
            );
        }
    );
}


// ========================================
// CLOSE MOBILE MENU
// ========================================

function closeMobileMenu() {

    sidebar.classList.remove(
        "open"
    );

    overlay.classList.remove(
        "show"
    );
}

if (overlay) {

    overlay.addEventListener(
        "click",
        closeMobileMenu
    );
}


// ========================================
// MODEL OPTION
// ========================================

function createModelOption(model) {

    const option =
        document.createElement("option");

    option.value =
        model.id;

    option.textContent =
        model.name +
        (
            model.available
                ? " • Connected"
                : " • Coming soon"
        );

    return option;
}


// ========================================
// LOAD MODELS
// ========================================

async function loadModels() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/models`
            );

        if (!response.ok) {

            throw new Error(
                "Model API failed."
            );
        }

        const data =
            await response.json();

        if (
            !data.models ||
            !Array.isArray(data.models)
        ) {

            throw new Error(
                "Invalid model data."
            );
        }

        modelSelect.innerHTML = "";

        const groups = {};

        data.models.forEach(
            model => {

                if (
                    !groups[
                        model.provider
                    ]
                ) {

                    groups[
                        model.provider
                    ] = [];
                }

                groups[
                    model.provider
                ].push(model);
            }
        );

        Object.entries(groups)
            .forEach(
                ([provider, providerModels]) => {

                    const group =
                        document.createElement(
                            "optgroup"
                        );

                    group.label =
                        provider;

                    providerModels.forEach(
                        model => {

                            group.appendChild(
                                createModelOption(
                                    model
                                )
                            );
                        }
                    );

                    modelSelect.appendChild(
                        group
                    );
                }
            );

        if (
            currentConversationId
        ) {

            const conversation =
                getCurrentConversation();

            if (conversation) {

                modelSelect.value =
                    conversation.model;
            }
        }

        if (
            !modelSelect.value &&
            modelSelect.options.length
        ) {

            modelSelect.selectedIndex =
                0;
        }

        if (
            modelSelect.options.length
        ) {

            selectedModel.textContent =
                modelSelect
                    .options[
                        modelSelect.selectedIndex
                    ]
                    .text;
        }

    } catch (error) {

        console.warn(
            "Could not load SAPI models:",
            error
        );
    }
}


// ========================================
// CLOSE OPEN CHAT MENUS
// ========================================

document.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(".chat-menu")
            .forEach(menu => {

                menu.remove();
            });
    }
);


// ========================================
// START SAPI
// ========================================

renderRecentChats();

loadModels();

console.log(
    "================================"
);

console.log(
    "        SAPI AI FRONTEND"
);

console.log(
    "================================"
);

console.log(
    "Backend:",
    API_URL
);

console.log(
    "Conversation history: ENABLED"
);

console.log(
    "Chat management: ENABLED"
);

console.log(
    "Storage: Browser localStorage"
);

console.log(
    "Built by Saprielle Studio."
);
