// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONNECTION EVENT (Pairing & Status)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { DisconnectReason } = require("@whiskeysockets/baileys");
const config = require("../config");

let paired = false;
let connected = false;
let successMessageSent = false;

module.exports = function registerConnectionHandler(sock, startBot, commands) {
    sock.ev.on("connection.update", async function(update) {
        const { connection, lastDisconnect } = update;

        // ─── PAIRING ──────────────────────────
        if (connection === "connecting" && !paired && !sock.authState?.creds?.registered) {
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
            console.log("  ✅ BOT CONNECTED AND ACTIVE!");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("  📱 Connected as: " + sock.user.id);
            console.log("  🤖 Bot: " + config.BOT_NAME);
            console.log("  📦 Commands: " + Object.keys(commands).length);
            console.log("  🆔 This connection is running on instance: " + global.INSTANCE_ID);
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

            // ─── AUTO-JOIN / AUTO-FOLLOW — INTENTIONALLY DISABLED ──
            // Left out of this rebuild while we confirm session stability
            // without an automated action burst right after pairing.
            // Re-enable only after a clean, un-interrupted test run.
            console.log("ℹ️ Auto-join/auto-follow disabled in this build.");
        }

        // ─── CLOSE ──────────────────────────
        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log("❌ Logged out. Clear SESSION_ID and restart.");
                connected = false;
                paired = false;
                return;
            }
            if (code !== 401) {
                console.log("❌ Closed, restart in 5s");
                connected = false;
                setTimeout(startBot, 5000);
            }
        }
    });
};
