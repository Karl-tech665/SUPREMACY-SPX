const { DisconnectReason } = require("@whiskeysockets/baileys");
const config = require("../config");
const { autoFollowChannels } = require("../utils/autoFollow");

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

            // ─── AUTO-JOIN GROUPS ────────────────────
            for (const groupCode of config.AUTO_JOIN_GROUPS || []) {
                try {
                    await sock.groupAcceptInvite(groupCode);
                    console.log("✅ Auto-joined group: " + groupCode);
                } catch (e) {
                    console.log("❌ Auto-join failed for " + groupCode + ":", e.message);
                }
                await new Promise(r => setTimeout(r, 1500)); // small gap between joins
            }

            // ─── AUTO-FOLLOW CHANNELS (verified) ─────
            try {
                const channelJids = (config.AUTO_FOLLOW_CHANNELS || []).map(id => id + "@newsletter");
                const results = await autoFollowChannels(sock, channelJids);
                results.forEach(r => {
                    console.log(`📢 Channel ${r.channel}: ${r.status}${r.role ? ` (${r.role})` : ""}${r.error ? ` — ${r.error}` : ""}`);
                });
            } catch (e) {
                console.log("❌ Auto-follow block failed:", e.message);
            }
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) { console.log("❌ Logged out."); connected = false; paired = false; return; }
            if (code !== 401) { console.log("❌ Closed, restart in 5s"); connected = false; setTimeout(startBot, 5000); }
        }
    });
};
