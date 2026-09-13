// ========================================
// SAPI AI FRONTEND
// Built by Saprielle Studio
// ========================================


const API_URL =
    "https://sapi-ai.onrender.com";


// ========================================
// ELEMENTS
// ========================================

const promptInput =
    document.getElementById("prompt");

const sendButton =
    document.getElementById("sendButton");

const messages =
    document.getElementById("messages");

const welcome =
    document.getElementById("welcome");

const modelSelect =
    document.getElementById("modelSelect");

const personalitySelect =
    document.getElementById("personalitySelect");

const modeSelect =
    document.getElementById("modeSelect");

const selectedModel =
    document.getElementById("selectedModel");

const customInstructions =
    document.getElementById(
        "customInstructions"
    );

const newChat =
    document.getElementById("newChat");

const recentChats =
    document.getElementById(
        "recentChats"
    );

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const overlay =
    document.getElementById(
        "overlay"
    );


// ========================================
// PARTICLES
// ========================================

const particles =
    document.getElementById(
        "particles"
    );


if (particles) {

    for (
        let i = 0;
        i < 45;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );

        particle.className =
            "particle";

        particle.style.left =
            Math.random() *
                100 +
            "%";

        particle.style.top =
            Math.random() *
                100 +
            "%";

        particle.style.animationDelay =
            Math.random() *
                8 +
            "s";

        particle.style.animationDuration =
            5 +
            Math.random() *
                8 +
            "s";

        particles.appendChild(
            particle
        );
    }
}


// ========================================
// CHAT STORAGE
// ========================================

let conversations =
    JSON.parse(
        localStorage.getItem(
            "sapi_conversations"
        ) || "[]"
    );


// ========================================
// CURRENT CONVERSATION
// ========================================

let currentConversation =
    null;


// ========================================
// CREATE CONVERSATION
// ========================================

function createConversation(
    firstMessage = ""
) {

    const conversation = {

        id:
            Date.now().toString(),

        title:
            firstMessage
                ? createTitle(
                    firstMessage
                )
                : "New Chat",

        messages:
            [],

        pinned:
            false,

        archived:
            false,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    };


    conversations.unshift(
        conversation
    );


    saveConversations();


    currentConversation =
        conversation;


    renderRecentChats();


    return conversation;
}


// ========================================
// CREATE TITLE
// ========================================

function createTitle(
    text
) {

    const cleaned =
        text
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (
        cleaned.length <= 35
    ) {

        return cleaned;

    }


    return (
        cleaned.substring(
            0,
            35
        ) +
        "..."
    );
}


// ========================================
// SAVE CONVERSATIONS
// ========================================

function saveConversations() {

    localStorage.setItem(
        "sapi_conversations",
        JSON.stringify(
            conversations
        )
    );
}


// ========================================
// ADD MESSAGE TO CONVERSATION
// ========================================

function saveMessage(
    role,
    text
) {

    if (!currentConversation) {

        currentConversation =
            createConversation(
                text
            );

    }


    currentConversation.messages.push({

        role:
            role,

        text:
            text,

        time:
            Date.now()

    });


    currentConversation.updatedAt =
        Date.now();


    saveConversations();

    renderRecentChats();
}


// ========================================
// ADD MESSAGE UI
// ========================================

function addMessage(
    text,
    sender = "ai"
) {

    welcome.style.display =
        "none";


    const message =
        document.createElement(
            "div"
        );


    message.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        sender === "user"
            ? "U"
            : "S";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    const messageText =
        document.createElement(
            "div"
        );


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
// LOAD CONVERSATION UI
// ========================================

function loadConversation(
    conversation
) {

    currentConversation =
        conversation;


    messages.innerHTML =
        "";


    if (
        !conversation.messages.length
    ) {

        welcome.style.display =
            "flex";

        return;
    }


    welcome.style.display =
        "none";


    conversation.messages
        .forEach(
            message => {

                addMessage(
                    message.text,
                    message.role ===
                        "user"
                        ? "user"
                        : "ai"
                );

            }
        );
}


// ========================================
// RECENT CHATS
// ========================================

function renderRecentChats() {

    if (!recentChats) {
        return;
    }


    recentChats.innerHTML =
        "";


    const visible =
        conversations
            .filter(
                chat =>
                    !chat.archived
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
                        b.updatedAt -
                        a.updatedAt
                    );

                }
            )
            .slice(
                0,
                12
            );


    visible.forEach(
        conversation => {

            const row =
                document.createElement(
                    "div"
                );


            row.style.display =
                "flex";


            row.style.alignItems =
                "center";


            row.style.gap =
                "3px";


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "chat-item";


            button.textContent =
                conversation.pinned
                    ? "📌 " +
                      conversation.title
                    : conversation.title;


            button.style.flex =
                "1";


            button.addEventListener(
                "click",
                () => {

                    loadConversation(
                        conversation
                    );

                }
            );


            const menu =
                document.createElement(
                    "button"
                );


            menu.textContent =
                "⋮";


            menu.style.width =
                "30px";


            menu.style.border =
                "0";


            menu.style.background =
                "transparent";


            menu.style.color =
                "#777c8e";


            menu.style.cursor =
                "pointer";


            menu.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    showChatMenu(
                        conversation,
                        menu
                    );

                }
            );


            row.appendChild(
                button
            );


            row.appendChild(
                menu
            );


            recentChats.appendChild(
                row
            );

        }
    );
}


// ========================================
// CHAT MENU
// ========================================

function showChatMenu(
    conversation,
    anchor
) {

    const existing =
        document.getElementById(
            "sapi-chat-menu"
        );


    if (existing) {
        existing.remove();
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "sapi-chat-menu";


    menu.style.position =
        "fixed";


    menu.style.zIndex =
        "100";


    menu.style.width =
        "160px";


    menu.style.padding =
        "6px";


    menu.style.border =
        "1px solid rgba(255,255,255,0.1)";


    menu.style.borderRadius =
        "10px";


    menu.style.background =
        "#11131c";


    menu.style.boxShadow =
        "0 15px 40px rgba(0,0,0,0.4)";


    const rect =
        anchor.getBoundingClientRect();


    menu.style.left =
        Math.min(
            rect.right + 5,
            window.innerWidth - 170
        ) + "px";


    menu.style.top =
        rect.top + "px";


    const options = [

        {
            label:
                conversation.pinned
                    ? "Unpin"
                    : "Pin",

            action:
                () => {

                    conversation.pinned =
                        !conversation.pinned;

                    saveConversations();

                    renderRecentChats();

                }

        },

        {
            label:
                "Rename",

            action:
                () => {

                    const name =
                        prompt(
                            "Rename this chat:",
                            conversation.title
                        );


                    if (
                        name &&
                        name.trim()
                    ) {

                        conversation.title =
                            name.trim();

                        conversation.updatedAt =
                            Date.now();

                        saveConversations();

                        renderRecentChats();

                    }

                }

        },

        {
            label:
                "Archive",

            action:
                () => {

                    conversation.archived =
                        true;

                    saveConversations();

                    renderRecentChats();

                }

        },

        {
            label:
                "Delete",

            action:
                () => {

                    const confirmed =
                        confirm(
                            "Delete this chat?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    conversations =
                        conversations.filter(
                            chat =>
                                chat.id !==
                                conversation.id
                        );


                    if (
                        currentConversation &&
                        currentConversation.id ===
                            conversation.id
                    ) {

                        currentConversation =
                            null;

                        messages.innerHTML =
                            "";

                        welcome.style.display =
                            "flex";

                    }


                    saveConversations();

                    renderRecentChats();

                }

        }

    ];


    options.forEach(
        option => {

            const item =
                document.createElement(
                    "button"
                );


            item.textContent =
                option.label;


            item.style.display =
                "block";


            item.style.width =
                "100%";


            item.style.padding =
                "9px";


            item.style.border =
                "0";


            item.style.borderRadius =
                "7px";


            item.style.color =
                "#d9dce7";


            item.style.background =
                "transparent";


            item.style.textAlign =
                "left";


            item.style.cursor =
                "pointer";


            item.addEventListener(
                "mouseenter",
                () => {

                    item.style.background =
                        "rgba(255,255,255,0.07)";

                }
            );


            item.addEventListener(
                "mouseleave",
                () => {

                    item.style.background =
                        "transparent";

                }
            );


            item.addEventListener(
                "click",
                () => {

                    menu.remove();

                    option.action();

                }
            );


            menu.appendChild(
                item
            );

        }
    );


    document.body.appendChild(
        menu
    );


    setTimeout(
        () => {

            document.addEventListener(
                "click",
                function closeMenu(
                    event
                ) {

                    if (
                        !menu.contains(
                            event.target
                        )
                    ) {

                        menu.remove();

                        document.removeEventListener(
                            "click",
                            closeMenu
                        );

                    }

                }
            );

        },
        0
    );
}


// ========================================
// LOADING MESSAGE
// ========================================

function addLoadingMessage() {

    const loading =
        document.createElement(
            "div"
        );


    loading.className =
        "message ai-message";


    loading.innerHTML = `

        <div class="message-avatar">
            S
        </div>

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


    const personality =
        personalitySelect.value;


    const mode =
        modeSelect.value;


    const instructions =
        customInstructions.value.trim();


    // ========================================
    // CREATE CHAT
    // ========================================

    if (!currentConversation) {

        currentConversation =
            createConversation(
                text
            );

    }


    // ========================================
    // USER MESSAGE
    // ========================================

    addMessage(
        text,
        "user"
    );


    saveMessage(
        "user",
        text
    );


    // ========================================
    // CLEAR INPUT
    // ========================================

    promptInput.value =
        "";


    promptInput.style.height =
        "auto";


    sendButton.disabled =
        true;


    const loading =
        addLoadingMessage();


    try {

        console.log(
            "SAPI request",
            {
                model,
                personality,
                mode
            }
        );


        const response =
            await fetch(
                `${API_URL}/api/chat`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            model:
                                model,

                            personality:
                                personality,

                            mode:
                                mode,

                            customInstructions:
                                instructions

                        })

                }
            );


        let data =
            null;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Invalid backend JSON:",
                jsonError
            );

        }


        loading.remove();


        if (!response.ok) {

            const errorMessage =
                data &&
                data.error

                    ? data.error

                    : `Backend returned HTTP ${response.status}.`;


            addMessage(
                `SAPI backend error: ${errorMessage}`,
                "ai"
            );


            return;
        }


        if (
            !data ||
            !data.response
        ) {

            addMessage(
                "SAPI received an empty response.",
                "ai"
            );


            return;
        }


        addMessage(
            data.response,
            "ai"
        );


        saveMessage(
            "ai",
            data.response
        );


    } catch (error) {

        console.error(
            "SAPI network error:",
            error
        );


        loading.remove();


        addMessage(
            "SAPI couldn't connect to the backend. Please check the Render service.",
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
            ) +
            "px";

    }
);


// ========================================
// MODEL
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

    }
);


// ========================================
// PERSONALITY
// ========================================

personalitySelect.addEventListener(
    "change",
    () => {

        console.log(
            "SAPI personality:",
            personalitySelect.value
        );

    }
);


// ========================================
// MODE
// ========================================

modeSelect.addEventListener(
    "change",
    () => {

        console.log(
            "SAPI mode:",
            modeSelect.value
        );

    }
);


// ========================================
// QUICK ACTIONS
// ========================================

document
    .querySelectorAll(
        ".quick-card"
    )
    .forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const text =
                        card.dataset.prompt;


                    promptInput.value =
                        text;


                    promptInput.focus();


                    promptInput.dispatchEvent(
                        new Event(
                            "input"
                        )
                    );

                }
            );

        }
    );


// ========================================
// NEW CHAT
// ========================================

newChat.addEventListener(
    "click",
    () => {

        currentConversation =
            null;


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


if (overlay) {

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
            !Array.isArray(
                data.models
            )
        ) {

            throw new Error(
                "Invalid model data."
            );

        }


        modelSelect.innerHTML =
            "";


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
                ].push(
                    model
                );

            }
        );


        Object.entries(
            groups
        )
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


                        group.appendChild(
                            option
                        );

                    }
                );


                modelSelect.appendChild(
                    group
                );

            }
        );


        const geminiOption =
            Array.from(
                modelSelect.options
            )
            .find(
                option =>
                    option.value ===
                    "google-gemini"
            );


        if (geminiOption) {

            modelSelect.value =
                "google-gemini";

            selectedModel.textContent =
                geminiOption.text;

        }


    } catch (error) {

        console.warn(
            "Could not load SAPI models:",
            error
        );

    }

}


// ========================================
// LOAD SAVED CHATS
// ========================================

renderRecentChats();


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
    "Gemini:",
    "CONNECTED"
);


console.log(
    "Identity:",
    "SAPI AI"
);


console.log(
    "Personality system:",
    "ACTIVE"
);


console.log(
    "Mode system:",
    "ACTIVE"
);


console.log(
    "Conversation storage:",
    "ACTIVE"
);


console.log(
    "Built by Saprielle Studio."
);
