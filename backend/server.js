const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


/* ========================================
   MIDDLEWARE
======================================== */

app.use(cors());

app.use(express.json());


/* ========================================
   HOME
======================================== */

app.get("/", (req, res) => {

    res.json({

        name: "SAPI AI",

        status: "online",

        message:
            "SAPI AI backend is running.",

        creator:
            "Saprielle Studio"

    });

});


/* ========================================
   HEALTH CHECK
======================================== */

app.get("/api/health", (req, res) => {

    res.json({

        status: "healthy",

        service:
            "SAPI AI",

        router:
            "online"

    });

});


/* ========================================
   MODEL REGISTRY
======================================== */

const models = [

    // =====================================
    // SAPI
    // =====================================

    {
        id: "sapi-plus",

        name: "SAPI+",

        provider: "SAPI",

        providerType:
            "first-party",

        available: false,

        capabilities: [
            "chat",
            "code",
            "reasoning"
        ]

    },


    {
        id: "sapi-55",

        name: "SAPI 5.5+",

        provider: "SAPI",

        providerType:
            "first-party",

        available: false,

        capabilities: [
            "chat",
            "code",
            "reasoning"
        ]

    },


    // =====================================
    // GOOGLE
    // =====================================

    {
        id: "google-gemini",

        name: "Gemini",

        provider: "Google",

        providerType:
            "third-party",

        available: false,

        capabilities: [
            "chat",
            "vision"
        ]

    },


    // =====================================
    // OPENAI
    // =====================================

    {
        id: "openai",

        name: "OpenAI",

        provider: "OpenAI",

        providerType:
            "third-party",

        available: false,

        capabilities: [
            "chat",
            "code",
            "vision"
        ]

    },


    // =====================================
    // ANTHROPIC
    // =====================================

    {
        id: "anthropic-claude",

        name: "Claude",

        provider: "Anthropic",

        providerType:
            "third-party",

        available: false,

        capabilities: [
            "chat",
            "code",
            "vision"
        ]

    }

];


/* ========================================
   MODELS API
======================================== */

app.get("/api/models", (req, res) => {

    res.json({

        success: true,

        count:
            models.length,

        models:
            models

    });

});


/* ========================================
   MODEL LOOKUP
======================================== */

function findModel(modelId) {

    return models.find(
        model =>
            model.id === modelId
    );

}


/* ========================================
   MODEL ROUTER
======================================== */

async function routeToModel(
    model,
    message
) {

    const selectedModel =
        findModel(model);


    // -------------------------------------
    // MODEL DOES NOT EXIST
    // -------------------------------------

    if (!selectedModel) {

        return {

            success: false,

            provider:
                "SAPI",

            model:
                "Unknown",

            response:
                "That model is not registered with SAPI."

        };

    }


    // -------------------------------------
    // SAPI+
    // -------------------------------------

    if (
        selectedModel.id ===
        "sapi-plus"
    ) {

        return {

            success: false,

            provider:
                "SAPI",

            model:
                "SAPI+",

            response:
                "SAPI+ is registered, but its AI engine is not connected yet."

        };

    }


    // -------------------------------------
    // SAPI 5.5+
    // -------------------------------------

    if (
        selectedModel.id ===
        "sapi-55"
    ) {

        return {

            success: false,

            provider:
                "SAPI",

            model:
                "SAPI 5.5+",

            response:
                "SAPI 5.5+ is registered, but its AI engine is not connected yet."

        };

    }


    // -------------------------------------
    // GOOGLE GEMINI
    // -------------------------------------

    if (
        selectedModel.id ===
        "google-gemini"
    ) {

        return {

            success: false,

            provider:
                "Google",

            model:
                "Gemini",

            response:
                "Gemini is registered, but its provider connection is not configured yet."

        };

    }


    // -------------------------------------
    // OPENAI
    // -------------------------------------

    if (
        selectedModel.id ===
        "openai"
    ) {

        return {

            success: false,

            provider:
                "OpenAI",

            model:
                "OpenAI",

            response:
                "OpenAI is registered, but its provider connection is not configured yet."

        };

    }


    // -------------------------------------
    // ANTHROPIC
    // -------------------------------------

    if (
        selectedModel.id ===
        "anthropic-claude"
    ) {

        return {

            success: false,

            provider:
                "Anthropic",

            model:
                "Claude",

            response:
                "Claude is registered, but its provider connection is not configured yet."

        };

    }


    // -------------------------------------
    // FALLBACK
    // -------------------------------------

    return {

        success: false,

        provider:
            selectedModel.provider,

        model:
            selectedModel.name,

        response:
            "This model is registered but does not have a provider adapter yet."

    };

}


/* ========================================
   CHAT API
======================================== */

app.post("/api/chat", async (req, res) => {

    try {

        const message =
            typeof req.body.message ===
            "string"

                ? req.body.message.trim()

                : "";


        const model =
            typeof req.body.model ===
            "string"

                ? req.body.model

                : "sapi-plus";


        // ---------------------------------
        // VALIDATE MESSAGE
        // ---------------------------------

        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is required."

            });

        }


        // ---------------------------------
        // ROUTE REQUEST
        // ---------------------------------

        const result =
            await routeToModel(
                model,
                message
            );


        // ---------------------------------
        // RESPONSE
        // ---------------------------------

        res.json({

            success: true,

            requestedModel:
                model,

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


/* ========================================
   404 HANDLER
======================================== */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "SAPI API endpoint not found."

    });

});


/* ========================================
   START SERVER
======================================== */

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            "        SAPI AI BACKEND"
        );

        console.log(
            "================================"
        );

        console.log("");

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            "Model router: ONLINE"
        );

        console.log(
            `Registered models: ${models.length}`
        );

        console.log(
            "Built by Saprielle Studio."
        );

        console.log("");

    }
);
