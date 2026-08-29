// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALLS EVENT (Anti‑Call)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = function registerCallHandler(sock) {
    sock.ev.on("call", async function(calls) {
        for (const call of calls) {
            await sock.rejectCall(call.id, call.from).catch(() => {});
            console.log("📵 Rejected call from " + call.from);
        }
    });
};
