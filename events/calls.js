// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALLS EVENT (Anti‑Call)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = function registerCallHandler(sock) {
    sock.ev.on("call", async function(calls) {
        for (const call of calls) {
            // Only act on actual incoming call offers
            if (call.status && call.status !== "offer") continue;

            try {
                await sock.rejectCall(call.id, call.from);
                console.log("📵 Rejected call from " + call.from);
            } catch (e) {
                console.log("❌ Failed to reject call from " + call.from + ":", e.message);
            }
        }
    });
};
