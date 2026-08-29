// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLISH WHATSAPP MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { formatUptime, getRAMUsage, getSpeed } = require("./helpers");
const { getSessionId } = require("./session");
const config = require("../config");

async function sendStylishSuccessMessage(sock, userJid, commands) {
    try {
        const cmdCount = Object.keys(commands).length;
        const uptime = formatUptime();
        const ram = getRAMUsage();
        const speed = getSpeed();
        const sessionId = getSessionId();

        let message = "╔══════════════════════════════════════════════════════════╗\n";
        message += "║                                                          ║\n";
        message += "║              ╭──────────────────────────╮                ║\n";
        message += "║              │  ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦  │                ║\n";
        message += "║              │     CONNECTED & ACTIVE    │                ║\n";
        message += "║              ╰──────────────────────────╯                ║\n";
        message += "║                                                          ║\n";
        message += "║  ═════════════════════════════════════════════════════   ║\n";
        message += "║                                                          ║\n";
        message += "║  📱 Connected : " + userJid + "\n";
        message += "║  🤖 Bot Name  : " + config.BOT_NAME + "\n";
        message += "║  📦 Commands  : " + cmdCount + "\n";
        message += "║  ⏱️ Uptime    : " + uptime + "\n";
        message += "║  🧠 RAM       : " + ram.bar + " " + ram.percent + "%\n";
        message += "║  ⚡ Speed     : " + speed + "\n";
        message += "║  🛡️ Protection: Active\n";
        message += "║  🌐 Platform  : Render\n";
        message += "║                                                          ║\n";
        message += "║  ═════════════════════════════════════════════════════   ║\n";
        message += "║                                                          ║\n";
        message += "║  💾 SESSION_ID (Save for future deploys):               ║\n";

        if (sessionId) {
            const truncatedId = sessionId.length > 80 ? sessionId.slice(0, 77) + "..." : sessionId;
            message += "║  ─────────────────────────────────────────────────────   ║\n";
            message += "║  " + truncatedId + "\n";
            message += "║  ─────────────────────────────────────────────────────   ║\n";
        } else {
            message += "║  ─────────────────────────────────────────────────────   ║\n";
            message += "║  (Session will be backed up automatically)            ║\n";
            message += "║  ─────────────────────────────────────────────────────   ║\n";
        }

        message += "║                                                          ║\n";
        message += "║  ⚠️  Keep it private — anyone with it can access your   ║\n";
        message += "║     chats and impersonate you.                          ║\n";
        message += "║                                                          ║\n";
        message += "║  ═════════════════════════════════════════════════════   ║\n";
        message += "║                                                          ║\n";
        message += "║              ✦ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗨𝗣𝗥𝗘𝗠𝗘 𝗣𝗥𝗜𝗠𝗘 ✦          ║\n";
        message += "║                                                          ║\n";
        message += "╚══════════════════════════════════════════════════════════╝";

        await sock.sendMessage(userJid, { text: message });
        console.log("📨 Stylish WhatsApp success message sent.");

        if (sessionId && sessionId.length > 80) {
            await sock.sendMessage(userJid, {
                text: "📋 *Full SESSION_ID (copy this):*\n\n`" + sessionId + "`\n\n⚠️ Keep it private!"
            });
            console.log("📨 Full SESSION_ID sent separately.");
        }

        return true;
    } catch (e) {
        console.log("❌ Failed to send stylish message:", e.message);
        return false;
    }
}

module.exports = { sendStylishSuccessMessage };
