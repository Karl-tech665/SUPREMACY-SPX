const { getGroupSettings, toggleFeature } = require("../utils/groupSettings");

const FEATURES = [
    { name: "antilink", label: "Anti-Link", desc: "Deletes messages containing links from non-admins." },
    { name: "antispam", label: "Anti-Spam", desc: "Deletes messages when a user sends too many too fast." },
    { name: "antibug", label: "Anti-Bug", desc: "Blocks known crash/bug payloads." },
    { name: "antigroupmention", label: "Anti-Group-Mention", desc: "Warns/removes non-admins who mass-mention the group." },
    { name: "antitag", label: "Anti-Tag", desc: "Blocks non-admin mass-tagging." },
    { name: "antiimage", label: "Anti-Image", desc: "Deletes images from non-admins." },
    { name: "antivideo", label: "Anti-Video", desc: "Deletes videos from non-admins." },
    { name: "antisticker", label: "Anti-Sticker", desc: "Deletes stickers from non-admins." },
    { name: "antidelete", label: "Anti-Delete", desc: "Reposts deleted messages." }
];

async function isSenderAdmin(sock, groupId, senderId) {
    try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(x => x.id === senderId);
        return !!(p && (p.admin === "admin" || p.admin === "superadmin"));
    } catch (e) { return false; }
}

module.exports = FEATURES.map(f => ({
    name: f.name,
    async execute(sock, from, args, msg, extra = {}) {
        if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: "❌ Group only." });
        const sender = extra.sender || msg.key.participant || from;
        if (!(await isSenderAdmin(sock, from, sender))) return sock.sendMessage(from, { text: "❌ Admins only." });

        const arg = (args[0] || "").toLowerCase();
        if (arg !== "on" && arg !== "off") {
            const current = getGroupSettings(from)[f.name];
            return sock.sendMessage(from, { text: `🛡️ *${f.label}*\n${f.desc}\n\nStatus: ${current ? "✅ ON" : "❌ OFF"}\nUse: .${f.name} on / off` });
        }
        toggleFeature(from, f.name, arg === "on");
        await sock.sendMessage(from, { text: `🛡️ *${f.label}* is now ${arg === "on" ? "✅ ENABLED" : "❌ DISABLED"}` });
    }
}));
