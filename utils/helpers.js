// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const os = require("os");

function formatUptime() {
    const u = process.uptime();
    const d = Math.floor(u / 86400);
    const h = Math.floor((u % 86400) / 3600);
    const m = Math.floor((u % 3600) / 60);
    const s = Math.floor(u % 60);
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024;
    const percent = Math.round((used / total) * 100);
    const bars = "█".repeat(Math.round(percent / 10)) + "░".repeat(10 - Math.round(percent / 10));
    return { used: used.toFixed(1), total: total.toFixed(1), percent, bar: bars };
}

function getSpeed() {
    return (Date.now() % 1000) + " ms";
}

/**
 * Animates a message by sending one initial message, then editing it
 * repeatedly to show progress frames — avoids spamming multiple messages.
 *
 * @param {object} sock - Baileys socket instance
 * @param {string} from - JID to send to
 * @param {string[]} frames - Array of text frames to show in sequence
 * @param {number} delayMs - Delay between frames in milliseconds
 * @returns {object|null} The sent message key info (from the first send), or null if it failed
 */
async function animateMessage(sock, from, frames, delayMs = 500) {
    if (!Array.isArray(frames) || frames.length === 0) return null;

    let sent;
    try {
        sent = await sock.sendMessage(from, { text: frames[0] });
    } catch (e) {
        console.log("❌ animateMessage: failed to send initial frame:", e.message);
        return null;
    }

    for (let i = 1; i < frames.length; i++) {
        await new Promise(r => setTimeout(r, delayMs));
        try {
            await sock.sendMessage(from, {
                text: frames[i],
                edit: sent.key
            });
        } catch (e) {
            console.log("⚠️ animateMessage: edit failed, stopping animation early:", e.message);
            break;
        }
    }

    return sent;
}

module.exports = { formatUptime, getRAMUsage, getSpeed, animateMessage };
