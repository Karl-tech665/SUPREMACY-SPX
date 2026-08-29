// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GROUP EVENTS (Participants, Auto‑Welcome)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = function registerGroupHandler(sock) {
    sock.ev.on("group-participants.update", async function(update) {
        if (update.action === "add") {
            for (const p of update.participants) {
                await sock.sendMessage(update.id, {
                    text: "👋 Welcome @" + p.split("@")[0] + "!",
                    mentions: [p]
                });
            }
        }
    });
};
