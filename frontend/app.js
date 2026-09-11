const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const newChat = document.getElementById("newChat");
const modelSelect = document.getElementById("modelSelect");
const selectedModel = document.getElementById("selectedModel");

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const quickCards = document.querySelectorAll(".quick-card");


/* =========================
   PARTICLES
========================= */

const particles = document.getElementById("particles");

for (let i = 0; i < 45; i++) {

    const particle = document.createElement("div");

    particle.className = "particle";

    particle.style.left =
        Math.random() * 100 + "%";

    particle.style.animationDuration =
        (8 + Math.random() * 15) + "s";

    particle.style.animationDelay =
        Math.random() * 10 + "s";

    particles.appendChild(particle);
}


/* =========================
   SEND MESSAGE
========================= */

function sendMessage() {

    const text = promptInput.value.trim();

    if (!text) return;

    welcome.style.display = "none";

    addMessage(text, "user");

    promptInput.value = "";

    resizeTextarea();

    /*
        TEMPORARY SAPI RESPONSE

        Later this will call our secure backend.
    */

    setTimeout(() => {

        addMessage(
            "Hey! 👋 I'm SAPI.\n\nMy AI engine isn't connected yet, but the SAPI interface is ready. Next we'll connect the backend and real AI models.",
            "ai"
        );

    }, 600);
}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(text, type) {

    const message = document.createElement("div");

    message.className = "message";

    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.textContent =
        type === "user" ? "U" : "S";

    const content = document.createElement("div");

    content.className = "message-content";

    content.textContent = text;

    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);

    scrollToBottom();
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

    const chatArea =
        document.querySelector(".chat-area");

    chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: "smooth"
    });
}


/* =========================
   ENTER TO SEND
========================= */

promptInput.addEventListener("keydown", (event) => {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }

});


sendButton.addEventListener(
    "click",
    sendMessage
);


/* =========================
   AUTO RESIZE
========================= */

function resizeTextarea() {

    promptInput.style.height = "auto";

    promptInput.style.height =
        Math.min(
            promptInput.scrollHeight,
            160
        ) + "px";
}


promptInput.addEventListener(
    "input",
    resizeTextarea
);


/* =========================
   MODEL SELECTOR
========================= */

modelSelect.addEventListener(
    "change",
    () => {

        const modelName =
            modelSelect.options[
                modelSelect.selectedIndex
            ].text;

        selectedModel.textContent =
            modelName;

    }
);


/* =========================
   QUICK ACTIONS
========================= */

quickCards.forEach(card => {

    card.addEventListener("click", () => {

        promptInput.value =
            card.dataset.prompt;

        resizeTextarea();

        promptInput.focus();

    });

});


/* =========================
   NEW CHAT
========================= */

newChat.addEventListener(
    "click",
    () => {

        messages.innerHTML = "";

        welcome.style.display = "block";

        promptInput.value = "";

        resizeTextarea();

        closeMobileMenu();

    }
);


/* =========================
   MOBILE MENU
========================= */

mobileMenu.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle("open");

        overlay.classList.toggle("show");

    }
);


overlay.addEventListener(
    "click",
    closeMobileMenu
);


function closeMobileMenu() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");

}


/* =========================
   CONSOLE
========================= */

console.log(
    "%cSAPI AI",
    "font-size:24px;font-weight:bold;color:#a78bfa;"
);

console.log(
    "Built by Saprielle Studio."
);
