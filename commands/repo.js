// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: REPO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

module.exports = {
    name: "repo",
    aliases: ["repository", "source", "github"],
    async execute(sock, from) {
        const repoText = `🐙 ✦ *${config.BOT_NAME}* ✦ 🐙
_GitHub Repository & Community Links_

📦 *Repository*
https://github.com/Karl-tech665/SUPREMACY-SPX
⭐ _Star and Fork to support the project!_

━━━━━━━━━━━━━━━━━━━━
💬 *WhatsApp Group*
https://chat.whatsapp.com/Cis103JyuBEFGYWq7AGwpe

📢 *WhatsApp Channel*
https://whatsapp.com/channel/0029Vb84TR9IXnltkyhYEC3R

📲 *Telegram*
@SupremePrime_SPX
━━━━━━━━━━━━━━━━━━━━

✦ *POWERED BY ${config.BOT_NAME}* ✦`;

        try {
            await sock.sendMessage(from, { text: repoText });
        } catch (e) {
            console.log("❌ Repo command failed:", e.message);
        }
    }
};
