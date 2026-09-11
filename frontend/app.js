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
// ADD MESSAGE
// ========================================

function addMessage(text, sender = "ai") {

    welcome.style.display = "none";

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";


    const avatar = document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        sender === "user"
            ? "U"
            : "S";


    const content = document.createElement("div");

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


    // Show user message
    addMessage(
        text,
        "user"
    );


    // Clear input
    promptInput.value = "";

    promptInput.style.height =
        "auto";


    // Disable send
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

                    body: JSON.stringify({

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


        // Show response
        addMessage(
            data.response ||
            "SAPI returned an empty response.",
            "ai"
        );


        // Add chat to recent list
        addRecentChat(text);


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
    (event) => {

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


        console.log(
            "Selected SAPI model:",
            modelSelect.value
        );

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
// ADD RECENT CHAT
// ========================================

function addRecentChat(text) {

    if (!recentChats) {
        return;
    }


    const item =
        document.createElement("button");

    item.className =
        "chat-item";


    item.textContent =
        text.length > 35
            ? text.substring(0, 35) + "..."
            : text;


    item.addEventListener(
        "click",
        () => {

            promptInput.value =
                text;

            promptInput.focus();

        }
    );


    recentChats.prepend(
        item
    );


    // Keep only the latest 8 chats
    while (
        recentChats.children.length > 8
    ) {

        recentChats.lastElementChild.remove();

    }

}


// ========================================
// NEW CHAT
// ========================================

newChat.addEventListener(
    "click",
    () => {

        messages.innerHTML =
            "";

        welcome.style.display =
            "flex";

        promptInput.value =
            "";

        promptInput.style.height =
            "auto";

        promptInput.focus();

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

overlay.addEventListener(
    "click",
    () => {

        sidebar.classList.remove(
            "open"
        );

        overlay.classList.remove(
            "show"
        );

    }
);


// ========================================
// CREATE MODEL OPTION
// ========================================

function createModelOption(model) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        model.id;


    option.textContent =
        model.name +
        (
            model.available
                ? " • Connected"
                : " • Coming soon"
        );


    // Keep unavailable models selectable
    // so we can test the router.
    option.disabled = false;


    return option;

}


// ========================================
// LOAD MODELS FROM BACKEND
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


        // Clear current options
        modelSelect.innerHTML =
            "";


        // Group models by provider
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


        // Create provider groups
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


        // Select first model
        if (
            modelSelect.options.length
        ) {

            modelSelect.selectedIndex =
                0;


            selectedModel.textContent =
                modelSelect
                    .options[0]
                    .text;

        }


        console.log(
            "SAPI models loaded:",
            data.models
        );

    }


    catch (error) {

        console.warn(
            "Could not load SAPI models:",
            error
        );

    }

}


// ========================================
// START
// ========================================

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
    "Model router: CONNECTED"
);

console.log(
    "Built by Saprielle Studio."
);
