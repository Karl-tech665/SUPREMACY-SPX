const { DisconnectReason } = require("@whiskeysockets/baileys");
const config = require("../config");

let paired = false;
let connected = false;
let successMessageSent = false;

module.exports = function registerConnectionHandler(sock, startBot, commands) {
    sock.ev.on("connection.update", async function(update) {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting" && !paired && !sock.authState?.creds?.registered) {
            try {
                await new Promise(r => setTimeout(r, 3000));
                const code = await sock.requestPairingCode(config.OWNER_NUMBER);
                console.log("\n🔑 YOUR PAIRING CODE: " + code);
                paired = true;
            } catch (e) { console.log("❌ Pairing error:", e.message); }
        }

        if (connection === "open" && !connected) {
            connected = true;
            console.log("✅ BOT CONNECTED AND ACTIVE! " + sock.user.id);

            if (!successMessageSent) {
                successMessageSent = true;
                try {
                    const { sendStylishSuccessMessage } = require("../utils/message");
                    await sendStylishSuccessMessage(sock, config.OWNER_NUMBER + "@s.whatsapp.net", commands);
                } catch (e) { console.log("❌ Could not send stylish message:", e.message); }
            }

            try {
                if (config.AUTO_JOIN_GROUP) { await sock.groupAcceptInvite(config.AUTO_JOIN_GROUP); console.log("✅ Auto-joined group"); }
            } catch (e) { console.log("❌ Auto-join failed:", e.message); }
            try {
                if (config.AUTO_FOLLOW_CHANNEL) { await sock.newsletterFollow(config.AUTO_FOLLOW_CHANNEL + "@newsletter"); console.log("✅ Auto-followed channel"); }
            } catch (e) { console.log("❌ Auto-follow failed:", e.message); }
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) { console.log("❌ Logged out."); connected = false; paired = false; return; }
            if (code !== 401) { console.log("❌ Closed, restart in 5s"); connected = false; setTimeout(startBot, 5000); }
        }
    });
};
