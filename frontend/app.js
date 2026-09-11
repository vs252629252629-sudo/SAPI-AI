// ========================================
// SAPI AI — FRONTEND
// Built by Saprielle Studio
// ========================================

// Your live Render backend
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

        particle.style.left = Math.random() * 100 + "%";
        particle.style.top = Math.random() * 100 + "%";

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

    avatar.className = "message-avatar";

    avatar.textContent =
        sender === "user"
            ? "U"
            : "S";


    const content = document.createElement("div");

    content.className = "message-content";


    const messageText = document.createElement("div");

    messageText.className = "message-text";

    messageText.textContent = text;


    content.appendChild(messageText);

    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);


    messages.scrollTop =
        messages.scrollHeight;
}


// ========================================
// SEND MESSAGE TO BACKEND
// ========================================

async function sendMessage() {

    const text =
        promptInput.value.trim();


    if (!text) {
        return;
    }


    const model =
        modelSelect.value;


    // Show user's message
    addMessage(text, "user");


    // Clear input
    promptInput.value = "";

    promptInput.style.height = "auto";


    // Disable button while loading
    sendButton.disabled = true;


    // Temporary loading message
    const loadingMessage =
        document.createElement("div");

    loadingMessage.className =
        "message ai-message";


    loadingMessage.innerHTML = `
        <div class="message-avatar">S</div>

        <div class="message-content">

            <div class="message-text">
                SAPI is thinking...
            </div>

        </div>
    `;


    messages.appendChild(loadingMessage);

    messages.scrollTop =
        messages.scrollHeight;


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


        // Remove loading message
        loadingMessage.remove();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "SAPI backend error."
            );

        }


        // Show backend response
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


        loadingMessage.remove();


        addMessage(
            "Sorry bro 😅 SAPI couldn't reach the backend right now. Please try again.",
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
// AUTO RESIZE TEXTAREA
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

        selectedModel.textContent =
            modelSelect.options[
                modelSelect.selectedIndex
            ].text;

        console.log(
            "SAPI model:",
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
// NEW CHAT
// ========================================

newChat.addEventListener(
    "click",
    () => {

        messages.innerHTML = "";

        welcome.style.display =
            "flex";

        promptInput.value = "";

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
                "Could not load models."
            );
        }


        const data =
            await response.json();


        if (
            !data.models ||
            !Array.isArray(data.models)
        ) {
            return;
        }


        modelSelect.innerHTML = "";


        data.models.forEach(
            model => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    model.id;

                option.textContent =
                    model.name;

                option.disabled =
                    model.available === false;

                modelSelect.appendChild(
                    option
                );

            }
        );


        if (modelSelect.options.length) {

            modelSelect.selectedIndex =
                0;

            selectedModel.textContent =
                modelSelect.options[0].text;

        }


    }

    catch (error) {

        console.warn(
            "Model loading failed:",
            error
        );

    }

}


// ========================================
// START SAPI
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
    "Built by Saprielle Studio."
);
