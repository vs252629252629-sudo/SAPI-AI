// ========================================
// SAPI AI BACKEND
// Built by Saprielle Studio
// ========================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT =
    process.env.PORT || 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);


// ========================================
// GOOGLE GENAI
// ========================================

let geminiClient = null;

async function initializeGemini() {

    try {

        if (!process.env.GEMINI_API_KEY) {

            console.warn(
                "⚠️ GEMINI_API_KEY is not configured."
            );

            return false;
        }


        const googleGenAI =
            await import("@google/genai");


        const GoogleGenAI =
            googleGenAI.GoogleGenAI;


        geminiClient =
            new GoogleGenAI({
                apiKey:
                    process.env.GEMINI_API_KEY
            });


        console.log(
            "✅ Gemini SDK initialized."
        );


        return true;

    } catch (error) {

        console.error(
            "❌ Gemini SDK initialization failed:",
            error.message
        );

        geminiClient =
            null;

        return false;
    }
}


// ========================================
// MODEL REGISTRY
// ========================================

const models = [

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


    {
        id: "google-gemini",

        name: "Gemini",

        provider: "Google",

        providerType:
            "third-party",

        available: true,

        capabilities: [
            "chat",
            "vision"
        ]
    },


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


// ========================================
// ROOT
// ========================================

app.get(
    "/",
    (req, res) => {

        res.json({

            name:
                "SAPI AI",

            status:
                "online",

            message:
                "SAPI AI backend is running.",

            creator:
                "Saprielle Studio",

            gemini:
                Boolean(geminiClient)

        });

    }
);


// ========================================
// HEALTH
// ========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status:
                "healthy",

            service:
                "SAPI AI",

            router:
                "online",

            gemini:
                Boolean(geminiClient)

        });

    }
);


// ========================================
// MODELS
// ========================================

app.get(
    "/api/models",
    (req, res) => {

        res.json({

            success:
                true,

            count:
                models.length,

            models:
                models.map(
                    model => {

                        if (
                            model.id ===
                            "google-gemini"
                        ) {

                            return {

                                ...model,

                                available:
                                    Boolean(
                                        geminiClient
                                    )

                            };

                        }

                        return model;

                    }
                )

        });

    }
);


// ========================================
// FIND MODEL
// ========================================

function findModel(
    modelId
) {

    return models.find(
        model =>
            model.id ===
            modelId
    );

}


// ========================================
// GEMINI ADAPTER
// ========================================

async function runGemini(
    message
) {

    if (!geminiClient) {

        throw new Error(
            "Gemini is not initialized. Check GEMINI_API_KEY in Render."
        );

    }


    console.log(
        "🤖 Sending request to Gemini..."
    );


    const interaction =
        await geminiClient.interactions.create({

            model:
                "gemini-3.8-flash",

            input:
                message

        });


    const text =
        interaction.output_text ||
        "";


    if (!text.trim()) {

        throw new Error(
            "Gemini returned an empty response."
        );

    }


    console.log(
        "✅ Gemini response received."
    );


    return text;

}


// ========================================
// MODEL ROUTER
// ========================================

async function routeToModel(
    modelId,
    message
) {

    const selectedModel =
        findModel(modelId);


    if (!selectedModel) {

        throw new Error(
            "That model is not registered with SAPI."
        );

    }


    // ========================================
    // GEMINI
    // ========================================

    if (
        selectedModel.id ===
        "google-gemini"
    ) {

        const response =
            await runGemini(
                message
            );


        return {

            provider:
                "Google",

            model:
                "Gemini",

            response:
                response

        };

    }


    // ========================================
    // SAPI+
    // ========================================

    if (
        selectedModel.id ===
        "sapi-plus"
    ) {

        throw new Error(
            "SAPI+ is registered but its own AI engine is not connected yet."
        );

    }


    // ========================================
    // SAPI 5.5+
    // ========================================

    if (
        selectedModel.id ===
        "sapi-55"
    ) {

        throw new Error(
            "SAPI 5.5+ is registered but its own AI engine is not connected yet."
        );

    }


    // ========================================
    // OPENAI
    // ========================================

    if (
        selectedModel.id ===
        "openai"
    ) {

        throw new Error(
            "OpenAI is registered but its provider connection is not configured yet."
        );

    }


    // ========================================
    // CLAUDE
    // ========================================

    if (
        selectedModel.id ===
        "anthropic-claude"
    ) {

        throw new Error(
            "Claude is registered but its provider connection is not configured yet."
        );

    }


    throw new Error(
        "This model does not have a provider adapter yet."
    );

}


// ========================================
// CHAT
// ========================================

app.post(
    "/api/chat",
    async (req, res) => {

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

                    : "google-gemini";


            if (!message) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Message is required."

                });

            }


            console.log("");

            console.log(
                "================================"
            );

            console.log(
                "SAPI CHAT REQUEST"
            );

            console.log(
                "Model:",
                model
            );

            console.log(
                "Message:",
                message.substring(
                    0,
                    100
                )
            );

            console.log(
                "================================"
            );


            const result =
                await routeToModel(
                    model,
                    message
                );


            return res.json({

                success:
                    true,

                requestedModel:
                    model,

                provider:
                    result.provider,

                model:
                    result.model,

                connected:
                    true,

                response:
                    result.response

            });

        } catch (error) {

            console.error(
                "❌ SAPI Router Error:",
                error.message
            );


            return res.status(500).json({

                success:
                    false,

                error:
                    error.message ||
                    "SAPI AI server error."

            });

        }

    }
);


// ========================================
// 404
// ========================================

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            error:
                "SAPI API endpoint not found."

        });

    }
);


// ========================================
// START SERVER
// ========================================

async function startServer() {

    await initializeGemini();


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
                "Gemini:",
                geminiClient
                    ? "CONNECTED"
                    : "NOT CONNECTED"
            );

            console.log(
                "Gemini SDK:",
                "@google/genai 2.x+"
            );

            console.log(
                "Built by Saprielle Studio."
            );

            console.log("");

        }
    );

}


startServer();
