// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: PROXY (Animated)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { animateMessage } = require("../utils/helpers");

module.exports = {
    name: "proxy",
    async execute(sock, from) {
        const frames = [
            "🌐 *Connecting to Proxy Network...*\n░░░░░░░░░░ 0%",
            "🌐 *Resolving Proxy Host...*\n███░░░░░░░ 30%",
            "🌐 *Establishing Secure Tunnel...*\n██████░░░░ 60%",
            "🌐 *Finalizing Connection...*\n█████████░ 90%",
            "✅ *Proxy Ready!*\n██████████ 100%",
        ];

        await animateMessage(sock, from, frames, 450);

        const proxyText = `🌐 ✦ *${config.BOT_NAME} PROXY* ✦ 🌐

Use the proxy below to connect through our dedicated server for a faster, more stable experience.

🔗 *Proxy Link*
\`\`\`${config.PROXY.LINK}\`\`\`
_(tap to copy)_

📱 *Learn More / Get Support*
${config.PROXY.WEBSITE}

━━━━━━━━━━━━━━━━━━━━
🛡️ _Protected & maintained by_ *${config.FOOTER_BRAND}*
━━━━━━━━━━━━━━━━━━━━`;

        try {
            await sock.sendMessage(from, { text: proxyText });
        } catch (e) {
            console.log("❌ Proxy: failed to send final card:", e.message);
        }
    }
};
