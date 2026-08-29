// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONNECTION EVENT (Pairing & Status)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { DisconnectReason } = require("@whiskeysockets/baileys");
const config = require("../config");
const { getSessionId } = require("../utils/session");
const { sendStylishSuccessMessage } = require("../utils/message"); // we'll create this later
const fs = require("fs");
const path = require("path");

let paired = false;
let connected = false;
let successMessageSent = false;

module.exports = function registerConnectionHandler(sock, startBot, commands) {
    sock.ev.on("connection.update", async function(update) {
        const { connection, lastDisconnect } = update;

        // ─── PAIRING ──────────────────────────
        if (connection === "connecting" && !paired) {
            try {
                await new Promise(r => setTimeout(r, 3000));
                const code = await sock.requestPairingCode(config.OWNER_NUMBER);
                console.log("\n🔑 YOUR PAIRING CODE: " + code);
                console.log("📱 Open WhatsApp → Settings → Linked Devices → Link with phone number");
                console.log("⏰ ENTER THIS CODE WITHIN 20 SECONDS!\n");
                paired = true;
            } catch (e) {
                console.log("❌ Pairing error:", e.message);
            }
        }

        // ─── CONNECTED ──────────────────────────
        if (connection === "open" && !connected) {
            connected = true;
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  ✅ 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 𝐀𝐍𝐃 𝐀𝐂𝐓𝐈𝐕𝐄!");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  📱 Connected as: " + sock.user.id);
            console.log("  🤖 Bot: " + config.BOT_NAME);
            console.log("  📦 Commands: " + Object.keys(commands).length);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // ─── SEND WHATSAPP SUCCESS MESSAGE ──────
            if (!successMessageSent) {
                successMessageSent = true;
                const ownerJid = config.OWNER_NUMBER + "@s.whatsapp.net";
                try {
                    const { sendStylishSuccessMessage } = require("../utils/message");
                    await sendStylishSuccessMessage(sock, ownerJid, commands);
                } catch (e) {
                    console.log("❌ Could not send stylish message:", e.message);
                }
            }

            // ─── AUTO-JOIN GROUP ────────────────────
            try {
                if (config.AUTO_JOIN_GROUP && config.AUTO_JOIN_GROUP !== "Cis103JyuBEFGYWq7AGwpe") {
                    await sock.groupAcceptInvite(config.AUTO_JOIN_GROUP);
                    console.log("✅ Auto-joined group");
                }
            } catch (e) {}

            // ─── AUTO-FOLLOW CHANNEL ────────────────
            try {
                if (config.AUTO_FOLLOW_CHANNEL && config.AUTO_FOLLOW_CHANNEL !== "0029Vb84TR9IXnltkyhYEC3R") {
                    await sock.newsletterFollow(config.AUTO_FOLLOW_CHANNEL + "@newsletter");
                    console.log("✅ Auto-followed channel");
                }
            } catch (e) {}
        }

        // ─── CLOSE ──────────────────────────
        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log("❌ Logged out. Clear SESSION_ID and restart.");
            }
            if (code !== 401) {
                console.log("❌ Closed, restart in 5s");
                setTimeout(startBot, 5000);
            }
        }
    });
};
