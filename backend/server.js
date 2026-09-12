const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ========================================
// SAPI AI — MODEL REGISTRY
// ========================================

const models = [
    {
        id: "sapi-plus",
        name: "SAPI+",
        provider: "SAPI",
        providerType: "first-party",
        available: false,
        capabilities: ["chat", "code", "reasoning"]
    },
    {
        id: "sapi-55",
        name: "SAPI 5.5+",
        provider: "SAPI",
        providerType: "first-party",
        available: false,
        capabilities: ["chat", "code", "reasoning"]
    },
    {
        id: "google-gemini",
        name: "Gemini",
        provider: "Google",
        providerType: "third-party",
        available: true,
        capabilities: ["chat", "vision"]
    },
    {
        id: "openai",
        name: "OpenAI",
        provider: "OpenAI",
        providerType: "third-party",
        available: false,
        capabilities: ["chat", "code", "vision"]
    },
    {
        id: "anthropic-claude",
        name: "Claude",
        provider: "Anthropic",
        providerType: "third-party",
        available: false,
        capabilities: ["chat", "code", "vision"]
    }
];

// ========================================
// ROUTES
// ========================================

app.get("/", (req, res) => {
    res.json({
        name: "SAPI AI",
        status: "online",
        creator: "Saprielle Studio"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "SAPI AI",
        router: "online"
    });
});

app.get("/api/models", (req, res) => {
    res.json({
        success: true,
        count: models.length,
        models
    });
});

// ========================================
// MODEL FINDER
// ========================================

function findModel(modelId) {
    return models.find(model => model.id === modelId);
}

// ========================================
// PROVIDER ADAPTERS
// ========================================

async function runGemini(message) {
    /*
     * Gemini provider connection goes here.
     *
     * Keep any provider credential server-side.
     * Do NOT place credentials in:
     * - index.html
     * - style.css
     * - app.js
     * - GitHub README
     */

    return {
        success: false,
        provider: "Google",
        model: "Gemini",
        response:
            "Gemini is registered with SAPI, but its provider adapter is awaiting connection."
    };
}

async function runSapiPlus(message) {
    return {
        success: false,
        provider: "SAPI",
        model: "SAPI+",
        response:
            "SAPI+ is registered, but its AI engine has not been connected yet."
    };
}

async function runSapi55(message) {
    return {
        success: false,
        provider: "SAPI",
        model: "SAPI 5.5+",
        response:
            "SAPI 5.5+ is registered, but its AI engine has not been connected yet."
    };
}

async function runOpenAI(message) {
    return {
        success: false,
        provider: "OpenAI",
        model: "OpenAI",
        response:
            "OpenAI is registered, but its provider adapter has not been connected yet."
    };
}

async function runClaude(message) {
    return {
        success: false,
        provider: "Anthropic",
        model: "Claude",
        response:
            "Claude is registered, but its provider adapter has not been connected yet."
    };
}

// ========================================
// MODEL ROUTER
// ========================================

async function routeToModel(modelId, message) {
    const model = findModel(modelId);

    if (!model) {
        return {
            success: false,
            provider: "SAPI",
            model: "Unknown",
            response: "That model is not registered with SAPI."
        };
    }

    switch (model.id) {
        case "google-gemini":
            return await runGemini(message);

        case "sapi-plus":
            return await runSapiPlus(message);

        case "sapi-55":
            return await runSapi55(message);

        case "openai":
            return await runOpenAI(message);

        case "anthropic-claude":
            return await runClaude(message);

        default:
            return {
                success: false,
                provider: model.provider,
                model: model.name,
                response: "This model does not have an adapter yet."
            };
    }
}

// ========================================
// CHAT API
// ========================================

app.post("/api/chat", async (req, res) => {
    try {
        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const model =
            typeof req.body.model === "string"
                ? req.body.model
                : "google-gemini";

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        const result = await routeToModel(
            model,
            message
        );

        res.json({
            success: true,
            requestedModel: model,
            provider: result.provider,
            model: result.model,
            connected: result.success,
            response: result.response
        });

    } catch (error) {
        console.error(
            "SAPI Router Error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "SAPI AI server error."
        });
    }
});

// ========================================
// 404
// ========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "SAPI API endpoint not found."
    });
});

// ========================================
// START
// ========================================

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("        SAPI AI BACKEND");
    console.log("================================");
    console.log("");
    console.log(`Server running on port ${PORT}`);
    console.log("Model router: ONLINE");
    console.log(`Registered models: ${models.length}`);
    console.log("Built by Saprielle Studio.");
    console.log("");
});
