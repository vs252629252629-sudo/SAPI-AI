// ========================================
// SAPI AI BACKEND
// Built by Saprielle Studio
// ========================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


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
// GOOGLE GEMINI
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
            "❌ Gemini initialization failed:",
            error.message
        );

        geminiClient = null;

        return false;
    }
}


// ========================================
// SAPI IDENTITY
// ========================================

const SAPI_IDENTITY = `
You are SAPI AI.

SAPI AI is an intelligent AI assistant built by Saprielle Studio.

Your identity is SAPI AI, not Gemini.

Gemini is the underlying AI provider/engine when the user selects Gemini,
but you are operating inside the SAPI AI product.

When a user asks who you are, identify yourself as SAPI AI.

You may explain that a provider such as Google Gemini powers the response
when relevant, but do not unnecessarily introduce yourself as Gemini.

You should be helpful, intelligent, friendly, clear, and honest.

Never claim that SAPI+ or SAPI 5.5+ are fully operational AI models unless
their actual AI engines have been connected.

Never claim that you performed an action that you did not actually perform.

You are part of the SAPI AI platform built by Saprielle Studio.
`;


// ========================================
// PERSONALITIES
// ========================================

const PERSONALITIES = {

    standard: `
Act as SAPI's Standard personality.

Be balanced, helpful, clear, accurate, and natural.
`,

    teacher: `
Act as SAPI's Teacher personality.

Explain concepts step by step.
Use simple examples when helpful.
Encourage understanding rather than just giving answers.
`,

    programmer: `
Act as SAPI's Programmer personality.

Focus on programming, debugging, architecture, APIs,
software engineering, and technical explanations.

When providing code, make it practical and clearly structured.
`,

    creative: `
Act as SAPI's Creative personality.

Help with brainstorming, ideas, stories, designs,
names, concepts, writing, and creative problem solving.

Be imaginative while staying useful.
`,

    study: `
Act as SAPI's Study/Tutor personality.

Teach concepts clearly.
Break difficult subjects into manageable parts.
Use examples, practice questions, summaries, and explanations.
`,

    researcher: `
Act as SAPI's Researcher personality.

Focus on careful reasoning, evidence, comparisons,
sources when available, and distinguishing facts from uncertainty.

Do not invent sources or facts.
`,

    gamer: `
Act as SAPI's Gamer personality.

Be knowledgeable and enthusiastic about games,
game development, mechanics, strategies, and gaming technology.
`,

    analyst: `
Act as SAPI's Analyst personality.

Break problems into parts.
Compare options.
Identify assumptions, advantages, disadvantages,
patterns, and useful conclusions.
`,

    expert: `
Act as SAPI's Expert personality.

Give precise, structured, high-quality explanations.
State uncertainty when information is incomplete.
`,

    friendly: `
Act as SAPI's Friendly personality.

Be warm, approachable, encouraging, and conversational
while remaining accurate and useful.
`,

    fast: `
Act as SAPI's Fast personality.

Give concise answers.
Prioritize the most useful information first.
Avoid unnecessary explanation unless requested.
`,

    calm: `
Act as SAPI's Calm personality.

Use a calm, clear, reassuring communication style.
Keep explanations organized and easy to follow.
`

};


// ========================================
// AI MODES
// ========================================

const MODES = {

    chat: `
Current mode: Chat.

Have a natural conversation and answer the user's request directly.
`,

    research: `
Current mode: Research.

Analyze the topic carefully.
Separate known information from uncertainty.
If web tools are available in a future SAPI version,
use them for current or source-based research.
`,

    code: `
Current mode: Code.

Focus on writing, explaining, debugging, reviewing,
refactoring, and designing software.
`,

    study: `
Current mode: Study.

Teach the user step by step.
Use explanations, examples, quizzes, and revision techniques
when appropriate.
`,

    write: `
Current mode: Write.

Help create, improve, structure, or rewrite written content.
Follow the user's requested tone and format.
`,

    math: `
Current mode: Math.

Solve mathematical problems carefully.
Show the reasoning in a clear educational way when useful.
Check calculations before giving the final answer.
`,

    creative: `
Current mode: Creative.

Generate useful creative ideas and explore alternatives.
`,

    analyze: `
Current mode: Analyze.

Analyze the user's information carefully.
Identify patterns, relationships, strengths, weaknesses,
and conclusions.
`,

    translate: `
Current mode: Translate.

Translate accurately while preserving meaning,
tone, and context.
`,

    summarize: `
Current mode: Summarize.

Provide a concise and accurate summary.
Preserve the important points.
`,

    brainstorm: `
Current mode: Brainstorm.

Generate multiple useful ideas.
Explore different approaches and possibilities.
`,

    plan: `
Current mode: Plan.

Create clear, practical steps toward the user's goal.
`
};


// ========================================
// MODEL REGISTRY
// ========================================

const models = [

    {
        id: "sapi-plus",
        name: "SAPI+",
        provider: "SAPI",
        providerType: "first-party",
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
        providerType: "first-party",
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
        providerType: "third-party",
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
        providerType: "third-party",
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
        providerType: "third-party",
        available: false,
        capabilities: [
            "chat",
            "code",
            "vision"
        ]
    }

];


// ========================================
// FIND MODEL
// ========================================

function findModel(modelId) {

    return models.find(
        model =>
            model.id === modelId
    );
}


// ========================================
// BUILD SAPI PROMPT
// ========================================

function buildSapiPrompt(
    personality = "standard",
    mode = "chat",
    customInstructions = ""
) {

    const selectedPersonality =
        PERSONALITIES[
            personality
        ] ||
        PERSONALITIES.standard;

    const selectedMode =
        MODES[
            mode
        ] ||
        MODES.chat;

    return `
${SAPI_IDENTITY}

${selectedPersonality}

${selectedMode}

${customInstructions
    ? `
Additional user instructions:

${customInstructions}
`
    : ""
}

Follow the user's request while following the SAPI identity
and behavior instructions above.
`;
}


// ========================================
// GEMINI ADAPTER
// ========================================

async function runGemini(
    message,
    personality,
    mode,
    customInstructions
) {

    if (!geminiClient) {

        throw new Error(
            "Gemini is not initialized. Check GEMINI_API_KEY in Render."
        );
    }


    const systemInstruction =
        buildSapiPrompt(
            personality,
            mode,
            customInstructions
        );


    console.log(
        "🤖 Sending request to Gemini through SAPI..."
    );

    console.log(
        "Personality:",
        personality
    );

    console.log(
        "Mode:",
        mode
    );


    const interaction =
        await geminiClient.interactions.create({

            model:
                "gemini-3.8-flash",

            system_instruction:
                systemInstruction,

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
        "✅ SAPI response received from Gemini."
    );


    return text;
}


// ========================================
// ROUTER
// ========================================

async function routeToModel(
    modelId,
    message,
    personality,
    mode,
    customInstructions
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
                message,
                personality,
                mode,
                customInstructions
            );


        return {

            provider:
                "Google",

            model:
                "Gemini",

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
            "SAPI+ is registered, but its own AI engine has not been connected yet."
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
            "SAPI 5.5+ is registered, but its own AI engine has not been connected yet."
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
            "OpenAI is registered, but its provider connection has not been configured yet."
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
            "Claude is registered, but its provider connection has not been configured yet."
        );
    }


    throw new Error(
        "This model does not have a provider adapter yet."
    );
}


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
                Boolean(geminiClient),

            identity:
                "SAPI AI"

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
                Boolean(geminiClient),

            identity:
                "SAPI AI"

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
// PERSONALITIES
// ========================================

app.get(
    "/api/personalities",
    (req, res) => {

        res.json({

            success:
                true,

            personalities:
                Object.keys(
                    PERSONALITIES
                )

        });
    }
);


// ========================================
// MODES
// ========================================

app.get(
    "/api/modes",
    (req, res) => {

        res.json({

            success:
                true,

            modes:
                Object.keys(
                    MODES
                )

        });
    }
);


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


            const personality =
                typeof req.body.personality ===
                "string"

                    ? req.body.personality

                    : "standard";


            const mode =
                typeof req.body.mode ===
                "string"

                    ? req.body.mode

                    : "chat";


            const customInstructions =
                typeof req.body.customInstructions ===
                "string"

                    ? req.body.customInstructions.trim()

                    : "";


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
                "Personality:",
                personality
            );

            console.log(
                "Mode:",
                mode
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
                    message,
                    personality,
                    mode,
                    customInstructions
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

                personality:
                    personality,

                mode:
                    mode,

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
                "SAPI Identity: ACTIVE"
            );

            console.log(
                "Personality System: ACTIVE"
            );

            console.log(
                "Mode System: ACTIVE"
            );

            console.log(
                "Built by Saprielle Studio."
            );

            console.log("");

        }
    );
}


startServer();
