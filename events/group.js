// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GROUP EVENTS (Participants, Auto‑Welcome)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = function registerGroupHandler(sock) {
    sock.ev.on("group-participants.update", async function(update) {
        try {
            if (update.action === "add") {
                const mentions = update.participants;
                const text = update.participants
                    .map(p => "👋 Welcome @" + p.split("@")[0] + "!")
                    .join("\n");

                await sock.sendMessage(update.id, {
                    text,
                    mentions
                });
            }

            // Optional: handle other actions if you want them later
            // if (update.action === "remove") { ... }
            // if (update.action === "promote") { ... }
            // if (update.action === "demote") { ... }

        } catch (e) {
            console.log("❌ Group event error:", e.message);
        }
    });
};
