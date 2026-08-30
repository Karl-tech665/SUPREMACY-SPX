const config = require("../config");
const { enforceProtection } = require("./protection");

function extractBody(message) {
    if (!message) return "";
    return message.conversation || message.extendedTextMessage?.text ||
        message.imageMessage?.caption || message.videoMessage?.caption || "";
}

module.exports = function registerMessageHandler(sock, commands) {
    const startupTimestamp = Math.floor(Date.now() / 1000);

    sock.ev.on("messages.upsert", async function(data) {
        try {
            if (data.type !== "notify") return;
            for (const msg of data.messages) {
                if (!msg.message || msg.key.fromMe) continue;

                let content = msg.message;
                if (content.ephemeralMessage) content = content.ephemeralMessage.message;

                const from = msg.key.remoteJid;
                const isGroup = from.endsWith("@g.us");
                const sender = isGroup ? (msg.key.participant || from) : from;
                const body = extractBody(content);

                const msgTimestamp = Number(msg.messageTimestamp) || 0;
                if (msgTimestamp && msgTimestamp < startupTimestamp) continue;

                if (isGroup) {
                    try {
                        const actioned = await enforceProtection(sock, from, sender, msg, body, content);
                        if (actioned) continue;
                    } catch (e) { console.log("⚠️ Protection check failed:", e.message); }
                }

                if (!body) continue;
                if (body.startsWith(config.PREFIX)) {
                    const args = body.slice(config.PREFIX.length).trim().split(/ +/);
                    const cmdName = args.shift().toLowerCase();
                    const cmd = commands[cmdName];
                    if (cmd) {
                        try {
                            await cmd.execute(sock, from, args, msg, { sender, isGroup, commands });
                        } catch (cmdError) {
                            console.error(`❌ Command "${cmdName}" failed:`, cmdError.message);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Message error:", e.message);
        }
    });
};
