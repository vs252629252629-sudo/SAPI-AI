/* =========================================================
   SAPI AI FRONTEND
========================================================= */

const API_URL = "https://sapi-ai.onrender.com";


// =========================================================
// STATE
// =========================================================

let conversations =
    JSON.parse(
        localStorage.getItem("sapi_conversations") || "[]"
    );

let currentConversation = null;

let selectedModel = "google-gemini";
let selectedPersonality = "standard";
let selectedMode = "chat";


// =========================================================
// DOM
// =========================================================

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const messages =
    document.getElementById("messages");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const recentChats =
    document.getElementById("recentChats");

const customInstructions =
    document.getElementById("customInstructions");


// =========================================================
// CONVERSATIONS
// =========================================================

function saveConversations() {

    localStorage.setItem(
        "sapi_conversations",
        JSON.stringify(conversations)
    );
}


function createConversation() {

    const conversation = {
        id: Date.now().toString(),

        title: "New Chat",

        messages: [],

        pinned: false,

        archived: false,

        createdAt: Date.now(),

        updatedAt: Date.now()
    };

    conversations.unshift(conversation);

    currentConversation = conversation;

    saveConversations();

    renderRecentChats();

    return conversation;
}


function createTitle(text) {

    const cleaned =
        text
            .replace(/\s+/g, " ")
            .trim();

    if (!cleaned) {
        return "New Chat";
    }

    return cleaned.length > 32
        ? cleaned.substring(0, 32) + "..."
        : cleaned;
}


function ensureConversation() {

    if (!currentConversation) {
        return createConversation();
    }

    return currentConversation;
}


function saveMessage(role, content) {

    const conversation =
        ensureConversation();

    conversation.messages.push({
        role,
        content,
        timestamp: Date.now()
    });

    conversation.updatedAt = Date.now();

    if (
        conversation.title === "New Chat" &&
        role === "user"
    ) {
        conversation.title =
            createTitle(content);
    }

    saveConversations();

    renderRecentChats();
}


// =========================================================
// MESSAGE UI
// =========================================================

function addMessage(role, content) {

    welcomeScreen.style.display = "none";

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role}`;

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent = content;

    wrapper.appendChild(bubble);

    messages.appendChild(wrapper);

    scrollToBottom();
}


function addLoadingMessage() {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message assistant";

    wrapper.id =
        "loadingMessage";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.innerHTML =
        `
        <span class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
        `;

    wrapper.appendChild(bubble);

    messages.appendChild(wrapper);

    scrollToBottom();
}


function removeLoadingMessage() {

    const loading =
        document.getElementById(
            "loadingMessage"
        );

    if (loading) {
        loading.remove();
    }
}


function scrollToBottom() {

    const chatArea =
        document.getElementById("chatArea");

    setTimeout(() => {

        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: "smooth"
        });

    }, 30);
}


// =========================================================
// LOAD CONVERSATION
// =========================================================

function loadConversation(conversation) {

    currentConversation =
        conversation;

    messages.innerHTML = "";

    if (
        !conversation.messages ||
        conversation.messages.length === 0
    ) {

        welcomeScreen.style.display =
            "flex";

        return;
    }

    welcomeScreen.style.display =
        "none";

    conversation.messages.forEach(
        message => {

            addMessage(
                message.role,
                message.content
            );

        }
    );

    renderRecentChats();
}


// =========================================================
// RECENT CHATS
// =========================================================

function renderRecentChats() {

    recentChats.innerHTML = "";

    const visible =
        conversations
            .filter(chat => !chat.archived)
            .sort(
                (a, b) =>
                    b.updatedAt - a.updatedAt
            );

    visible.forEach(chat => {

        const item =
            document.createElement("div");

        item.className =
            "recent-chat";

        if (
            currentConversation &&
            currentConversation.id === chat.id
        ) {
            item.classList.add("active");
        }

        const title =
            document.createElement("span");

        title.className =
            "recent-chat-title";

        title.textContent =
            chat.title || "New Chat";


        const menu =
            document.createElement("span");

        menu.className =
            "recent-chat-menu";

        menu.textContent = "⋮";


        item.appendChild(title);
        item.appendChild(menu);


        item.addEventListener(
            "click",
            event => {

                if (
                    event.target === menu
                ) {
                    showChatMenu(chat);
                    return;
                }

                loadConversation(chat);

            }
        );

        recentChats.appendChild(item);

    });
}


// =========================================================
// CHAT MENU
// =========================================================

function showChatMenu(chat) {

    const action =
        prompt(
            "Type: rename, pin, archive, or delete"
        );

    if (!action) {
        return;
    }

    const normalized =
        action.trim().toLowerCase();


    if (normalized === "rename") {

        const name =
            prompt(
                "New chat name:",
                chat.title
            );

        if (name && name.trim()) {

            chat.title =
                name.trim();

            saveConversations();
            renderRecentChats();

        }

    }


    else if (normalized === "pin") {

        chat.pinned =
            !chat.pinned;

        saveConversations();
        renderRecentChats();

    }


    else if (normalized === "archive") {

        chat.archived = true;

        if (
            currentConversation &&
            currentConversation.id === chat.id
        ) {
            currentConversation = null;

            messages.innerHTML = "";

            welcomeScreen.style.display =
                "flex";
        }

        saveConversations();
        renderRecentChats();

    }


    else if (normalized === "delete") {

        const confirmed =
            confirm(
                "Delete this conversation?"
            );

        if (!confirmed) {
            return;
        }

        conversations =
            conversations.filter(
                item =>
                    item.id !== chat.id
            );

        if (
            currentConversation &&
            currentConversation.id === chat.id
        ) {

            currentConversation = null;

            messages.innerHTML = "";

            welcomeScreen.style.display =
                "flex";
        }

        saveConversations();
        renderRecentChats();

    }

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const text =
        messageInput.value.trim();

    if (!text) {
        return;
    }


    const conversation =
        ensureConversation();


    addMessage(
        "user",
        text
    );

    saveMessage(
        "user",
        text
    );


    messageInput.value = "";

    autoResize();


    addLoadingMessage();


    const instructions =
        customInstructions
            ? customInstructions.value.trim()
            : "";


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

                    body: JSON.stringify({
                        message: text,

                        model:
                            selectedModel,

                        personality:
                            selectedPersonality,

                        mode:
                            selectedMode,

                        customInstructions:
                            instructions
                    })
                }
            );


        const data =
            await response.json();


        removeLoadingMessage();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Something went wrong."
            );
        }


        const answer =
            data.response ||
            "SAPI did not return a response.";


        addMessage(
            "assistant",
            answer
        );

        saveMessage(
            "assistant",
            answer
        );


    } catch (error) {

        removeLoadingMessage();

        const errorText =
            `Error: ${error.message}`;

        addMessage(
            "assistant",
            errorText
        );

    }

}


// =========================================================
// NEW CHAT
// =========================================================

function newChat() {

    currentConversation = null;

    messages.innerHTML = "";

    welcomeScreen.style.display =
        "flex";

    messageInput.value = "";

    autoResize();

    renderRecentChats();

    messageInput.focus();
}


// =========================================================
// TEXTAREA AUTO RESIZE
// =========================================================

function autoResize() {

    messageInput.style.height =
        "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";
}


// =========================================================
// CUSTOM DROPDOWNS
// =========================================================

const selectors = {

    model: {
        button:
            document.getElementById(
                "modelSelector"
            ),

        menu:
            document.getElementById(
                "modelMenu"
            ),

        value:
            document.getElementById(
                "modelValue"
            )
    },

    personality: {
        button:
            document.getElementById(
                "personalitySelector"
            ),

        menu:
            document.getElementById(
                "personalityMenu"
            ),

        value:
            document.getElementById(
                "personalityValue"
            )
    },

    mode: {
        button:
            document.getElementById(
                "modeSelector"
            ),

        menu:
            document.getElementById(
                "modeMenu"
            ),

        value:
            document.getElementById(
                "modeValue"
            )
    }

};


// Open / close

Object.values(selectors).forEach(
    selector => {

        selector.button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                Object.values(selectors)
                    .forEach(other => {

                        if (
                            other !== selector
                        ) {
                            other.button
                                .parentElement
                                .classList
                                .remove("open");
                        }

                    });

                selector.button
                    .parentElement
                    .classList
                    .toggle("open");

            }
        );

    }
);


// Select option

document
    .querySelectorAll(".dropdown-option")
    .forEach(option => {

        option.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (
                    option.classList.contains(
                        "disabled"
                    )
                ) {
                    return;
                }


                const type =
                    option.dataset.type;

                const value =
                    option.dataset.value;


                if (type === "model") {

                    selectedModel =
                        value;

                    selectors.model.value.textContent =
                        option.querySelector("span")
                            ?.textContent ||
                        option.textContent.trim();

                }


                if (type === "personality") {

                    selectedPersonality =
                        value;

                    selectors.personality.value.textContent =
                        option.textContent.trim();

                }


                if (type === "mode") {

                    selectedMode =
                        value;

                    selectors.mode.value.textContent =
                        option.textContent.trim();

                }


                const menu =
                    option.closest(
                        ".dropdown-menu"
                    );


                menu
                    .querySelectorAll(
                        ".dropdown-option"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "selected"
                        );

                    });


                option.classList.add(
                    "selected"
                );


                option
                    .closest(".selector")
                    .classList
                    .remove("open");

            }
        );

    });


// Close dropdown when clicking outside

document.addEventListener(
    "click",
    () => {

        Object.values(selectors)
            .forEach(selector => {

                selector.button
                    .parentElement
                    .classList
                    .remove("open");

            });

    }
);


// =========================================================
// QUICK ACTIONS
// =========================================================

document
    .querySelectorAll(".quick-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const action =
                    card.dataset.action;

                selectedMode =
                    action;

                const modeOption =
                    document.querySelector(
                        `.dropdown-option[data-type="mode"][data-value="${action}"]`
                    );

                if (modeOption) {

                    document
                        .querySelectorAll(
                            '#modeMenu .dropdown-option'
                        )
                        .forEach(
                            option =>
                                option.classList.remove(
                                    "selected"
                                )
                        );

                    modeOption.classList.add(
                        "selected"
                    );

                    selectors.mode.value.textContent =
                        modeOption.textContent.trim();
                }


                messageInput.focus();

            }
        );

    });


// =========================================================
// EVENTS
// =========================================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "input",
    autoResize
);


messageInput.addEventListener(
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


document
    .getElementById("newChatBtn")
    .addEventListener(
        "click",
        newChat
    );


// =========================================================
// MOBILE SIDEBAR
// =========================================================

const mobileMenuBtn =
    document.getElementById(
        "mobileMenuBtn"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );


mobileMenuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);


// =========================================================
// STARTUP
// =========================================================

renderRecentChats();

console.log(
    "SAPI AI frontend loaded."
);

console.log(
    "Model:",
    selectedModel
);

console.log(
    "Personality:",
    selectedPersonality
);

console.log(
    "Mode:",
    selectedMode
);
