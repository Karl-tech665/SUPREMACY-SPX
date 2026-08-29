// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MESSAGES EVENT (Handler)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

function extractBody(message) {
    if (!message) return "";
    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ""
    );
}

module.exports = function registerMessageHandler(sock, commands) {
    const startupTimestamp = Math.floor(Date.now() / 1000);

    sock.ev.on("messages.upsert", async function(data) {
        try {
            // Skip history-sync batches (old messages resent on connect/reconnect) —
            // only handle genuinely live, incoming messages.
            if (data.type !== "notify") return;

            const messages = data.messages;
            for (const msg of messages) {
                if (!msg.message || msg.key.fromMe) continue;

                // Extra safety: ignore anything timestamped before this process started.
                const msgTimestamp = Number(msg.messageTimestamp) || 0;
                if (msgTimestamp && msgTimestamp < startupTimestamp) continue;

                let messageContent = msg.message;
                if (messageContent.ephemeralMessage) {
                    messageContent = messageContent.ephemeralMessage.message;
                }

                const from = msg.key.remoteJid;
                const isGroup = from.endsWith("@g.us");
                const sender = isGroup ? msg.key.participant : from;

                const body = extractBody(messageContent);
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
