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
   MODEL REGISTRY
========================= */

const models = [

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

];


/* =========================
   MODELS API
========================= */

app.get("/api/models", (req, res) => {

    res.json({
        success: true,
        models: models
    });

});


/* =========================
   MODEL ROUTER
========================= */

async function routeToModel(model, message) {

    switch (model) {

        case "sapi-plus":

            return {
                success: false,
                provider: "SAPI",
                model: "SAPI+",
                response:
                    "SAPI+ is not connected to its AI engine yet."
            };


        case "sapi-55":

            return {
                success: false,
                provider: "SAPI",
                model: "SAPI 5.5+",
                response:
                    "SAPI 5.5+ is not connected to its AI engine yet."
            };


        case "gemini":

            return {
                success: false,
                provider: "Google",
                model: "Gemini",
                response:
                    "Gemini is not connected yet."
            };


        case "chatgpt":

            return {
                success: false,
                provider: "OpenAI",
                model: "ChatGPT",
                response:
                    "OpenAI models are not connected yet."
            };


        case "claude":

            return {
                success: false,
                provider: "Anthropic",
                model: "Claude",
                response:
                    "Claude is not connected yet."
            };


        default:

            return {
                success: false,
                provider: "SAPI",
                model: "Unknown",
                response:
                    "That model is not registered with SAPI."
            };

    }

}


/* =========================
   CHAT API
========================= */

app.post("/api/chat", async (req, res) => {

    try {

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const model =
            typeof req.body.model === "string"
                ? req.body.model
                : "sapi-plus";


        if (!message) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }


        const result =
            await routeToModel(
                model,
                message
            );


        res.json({

            success: true,

            requestedModel: model,

            provider:
                result.provider,

            model:
                result.model,

            connected:
                result.success,

            response:
                result.response

        });

    }

    catch (error) {

        console.error(
            "SAPI Router Error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "SAPI AI server error."

        });

    }

});


/* =========================
   404
========================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "SAPI API endpoint not found."

    });

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
    console.log("Model router: ONLINE");
    console.log("Built by Saprielle Studio.");
    console.log("");

});
