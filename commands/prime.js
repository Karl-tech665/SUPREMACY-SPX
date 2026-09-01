// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: PRIME 🐞 — bot-aware AI assistant
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

function buildBotContext(extra) {
    const cmdCount = Object.keys(extra.commands || {}).length;
    const groups = (config.AUTO_JOIN_GROUPS || []).map(id => `https://chat.whatsapp.com/${id}`).join(", ") || "none listed";
    const channels = (config.AUTO_FOLLOW_CHANNELS || []).map(id => `https://whatsapp.com/channel/${id}`).join(", ") || "none listed";

    return `You are Prime 🐞, the AI assistant built into the WhatsApp bot "${config.BOT_NAME}".
Known facts about this bot, use them when relevant to the user's question:
- Prefix: ${config.PREFIX}
- Owner: ${config.OWNER_NAME}
- Loaded commands: ${cmdCount}
- Proxy: ${config.PROXY.LINK} (more at ${config.PROXY.WEBSITE})
- Groups: ${groups}
- Channels: ${channels}
- Repo command: type ${config.PREFIX}repo for live GitHub stats and links.
- Menu command: type ${config.PREFIX}menu for the full command list.
Answer naturally and helpfully. Keep answers concise unless asked for detail. If asked something with no connection to this bot, just answer as a normal knowledgeable assistant.

User's message: `;
}

module.exports = {
    name: "prime",
    aliases: ["void"],
    async execute(sock, from, args, msg, extra = {}) {
        if (!args.length) {
            return sock.sendMessage(from, { text: "🐞 *Prime*\nAsk me anything — about this bot, or anything else.\nExample: .prime what commands do you have?" });
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return sock.sendMessage(from, { text: "🐞 Prime needs GEMINI_API_KEY set in your host's Environment settings to work." });
        }

        const prompt = buildBotContext(extra) + args.join(" ");

        try {
            const res = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                }
            );
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            await sock.sendMessage(from, { text: reply ? "🐞 " + reply : "🐞 No response from Prime right now." });
        } catch (e) {
            await sock.sendMessage(from, { text: "🐞 Prime error: " + e.message });
        }
    }
};
