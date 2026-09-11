const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({
        name: "SAPI AI",
        status: "online",
        message: "SAPI AI backend is running.",
        creator: "Saprielle Studio"
    });

});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {

    res.json({
        status: "healthy",
        service: "SAPI AI"
    });

});


/* =========================
   MODELS
========================= */

app.get("/api/models", (req, res) => {

    res.json({

        models: [

            {
                id: "sapi-plus",
                name: "SAPI+",
                provider: "SAPI",
                available: false
            },

            {
                id: "sapi-55",
                name: "SAPI 5.5+",
                provider: "SAPI",
                available: false
            },

            {
                id: "gemini",
                name: "Gemini",
                provider: "Google",
                available: false
            },

            {
                id: "chatgpt",
                name: "ChatGPT",
                provider: "OpenAI",
                available: false
            },

            {
                id: "claude",
                name: "Claude",
                provider: "Anthropic",
                available: false
            }

        ]

    });

});


/* =========================
   CHAT
========================= */

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            model
        } = req.body;


        if (!message) {

            return res.status(400).json({
                error: "Message is required."
            });

        }


        /*
            AI PROVIDER ROUTING WILL GO HERE.

            Example:

            SAPI+      → SAPI engine
            SAPI 5.5+  → SAPI engine
            Gemini     → Google
            ChatGPT    → OpenAI
            Claude     → Anthropic

            We will add the actual secure
            connections next.
        */


        res.json({

            success: true,

            model: model || "sapi-plus",

            response:
                "SAPI backend received your message. The AI engine is the next step."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error: "SAPI AI server error."

        });

    }

});


/* =========================
   SERVER
========================= */

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log("        SAPI AI BACKEND");
    console.log("================================");
    console.log("");
    console.log(`Server running on port ${PORT}`);
    console.log("Built by Saprielle Studio.");
    console.log("");

});
