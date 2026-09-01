// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: RESETWARN (admin-only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { resetWarns } = require("../utils/warnStore");

async function isSenderAdmin(sock, groupId, senderId) {
    try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(x => x.id === senderId);
        return !!(p && (p.admin === "admin" || p.admin === "superadmin"));
    } catch (e) {
        return false;
    }
}

module.exports = {
    name: "resetwarn",
    async execute(sock, from, args, msg) {
        if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: "❌ Group only." });
        const sender = msg.key.participant || from;
        if (!(await isSenderAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Admins only." });

        const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(from, { text: "❌ Mention a user: .resetwarn @user" });

        resetWarns(from, target);
        await sock.sendMessage(from, { text: `✅ Warnings reset for @${target.split("@")[0]}`, mentions: [target] });
    }
};
