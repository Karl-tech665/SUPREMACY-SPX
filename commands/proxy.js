// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: PROXY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

module.exports = {
    name: "proxy",
    async execute(sock, from) {
        const divider = "───────────────────────";
        const proxyText = `🌐 *${config.BOT_NAME} PROXIES*
${divider}
🔗 Proxy Link: ${config.PROXY.LINK}
📱 More Info : ${config.PROXY.WEBSITE}
🛡️ Protected by ${config.BOT_NAME}`;

        try {
            await sock.sendMessage(from, { text: proxyText });
        } catch (e) {
            console.log("❌ Proxy command failed:", e.message);
        }
    }
};
