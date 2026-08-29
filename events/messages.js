// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MESSAGES EVENT (Handler)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

module.exports = function registerMessageHandler(sock, commands) {
    sock.ev.on("messages.upsert", async function(data) {
        try {
            const messages = data.messages;
            for (const msg of messages) {
                if (!msg.message || msg.key.fromMe) continue;
                const from = msg.key.remoteJid;
                const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                if (!body) continue;

                if (body.startsWith(config.PREFIX)) {
                    const args = body.slice(1).trim().split(/ +/);
                    const cmdName = args.shift().toLowerCase();
                    const cmd = commands[cmdName];
                    if (cmd) {
                        await cmd.execute(sock, from, args, msg);
                    }
                }
            }
        } catch (e) {
            console.error("Message error:", e.message);
        }
    });
};
