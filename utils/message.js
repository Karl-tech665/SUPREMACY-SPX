// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLISH WHATSAPP MESSAGE (FIXED & SIMPLE)
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

        // Simple, clean formatting that never breaks
        let message = `✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦
✅ CONNECTED & ACTIVE

📱 Connected : ${userJid}
🤖 Bot Name  : ${config.BOT_NAME}
📦 Commands  : ${cmdCount}
⏱️ Uptime    : ${uptime}
🧠 RAM       : ${ram.bar} ${ram.percent}%
⚡ Speed     : ${speed}
🛡️ Protection: Active
🌐 Platform  : Render

─ [ SESSION CREATED ] ─
Name: ${config.BOT_NAME}
By: ${config.OWNER_NAME}
Status: ⏳ Waiting Deployment`;

        await sock.sendMessage(userJid, { text: message });
        console.log("📨 Stylish WhatsApp success message sent.");

        // Send the RAW session ID right after, with no extra text
        if (sessionId && sessionId.length > 80) {
            await sock.sendMessage(userJid, {
                text: sessionId
            });
            console.log("📨 Raw SESSION_ID sent separately.");
        }

        return true;
    } catch (e) {
        console.log("❌ Failed to send stylish message:", e.message);
        return false;
    }
}

module.exports = { sendStylishSuccessMessage };
