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

let conversations = JSON.parse(
    localStorage.getItem("sapi_conversations") || "[]"
);

let currentConversationId = null;


// ========================================
// PARTICLES
// ========================================

const particles = document.getElementById("particles");

if (particles) {

    for (let i = 0; i < 45; i++) {

        const particle =
            document.createElement("span");

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
// SAVE CONVERSATIONS
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

        id:
            Date.now().toString(),

        title:
            firstMessage.length > 40
                ? firstMessage.substring(0, 40) + "..."
                : firstMessage,

        model:
            modelSelect.value,

        messages: [],

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
// ADD MESSAGE TO UI
// ========================================

function addMessage(
    text,
    sender = "ai",
    save = true
) {

    welcome.style.display =
        "none";

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

    content.appendChild(
        messageText
    );

    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );

    messages.appendChild(
        message
    );

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

    }

    catch (error) {

        console.error(
            "SAPI Error:",
            error
        );

        loading.remove();

        addMessage(
            "SAPI couldn't reach the backend right now. Please try again.",
            "ai"
        );
    }

    finally {

        sendButton.disabled =
            false;

        promptInput.focus();
    }
}


// ========================================
// SEND BUTTON
// ========================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ========================================
// ENTER TO SEND
// ========================================

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
// AUTO RESIZE INPUT
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


// ========================================
// MODEL SELECTOR
// ========================================

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

            saveConversations();
        }
    }
);


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

    conversations
        .slice(0, 8)
        .forEach(conversation => {

            const item =
                document.createElement("button");

            item.className =
                "chat-item";

            item.textContent =
                conversation.title;

            if (
                conversation.id ===
                currentConversationId
            ) {

                item.classList.add(
                    "active"
                );
            }

            item.addEventListener(
                "click",
                () => {

                    loadConversation(
                        conversation.id
                    );
                }
            );

            recentChats.appendChild(
                item
            );
        });
}


// ========================================
// LOAD CONVERSATION
// ========================================

function loadConversation(
    conversationId
) {

    const conversation =
        conversations.find(
            item =>
                item.id ===
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


// ========================================
// MOBILE MENU
// ========================================

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

overlay.addEventListener(
    "click",
    closeMobileMenu
);


// ========================================
// CREATE MODEL OPTION
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

        const savedConversation =
            getCurrentConversation();

        if (savedConversation) {

            modelSelect.value =
                savedConversation.model;
        }

        if (
            modelSelect.options.length
        ) {

            if (
                !modelSelect.value
            ) {

                modelSelect.selectedIndex =
                    0;
            }

            selectedModel.textContent =
                modelSelect
                    .options[
                        modelSelect.selectedIndex
                    ]
                    .text;
        }

    }

    catch (error) {

        console.warn(
            "Could not load SAPI models:",
            error
        );
    }
}


// ========================================
// RESTORE LAST CHAT
// ========================================

function restoreLastConversation() {

    if (
        conversations.length === 0
    ) {
        return;
    }

    const latest =
        conversations[0];

    loadConversation(
        latest.id
    );
}


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
    "Storage: Browser localStorage"
);

console.log(
    "Built by Saprielle Studio."
);
