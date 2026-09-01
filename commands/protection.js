// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTION TOGGLE COMMANDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getGroupSettings, toggleFeature } = require("../utils/groupSettings");

const FEATURES = [
    { name: "antilink", label: "Anti-Link", desc: "Deletes messages containing links from non-admins and issues warnings." },
    { name: "antispam", label: "Anti-Spam", desc: "Deletes messages when a user sends too many too fast." },
    { name: "antibug", label: "Anti-Bug", desc: "Blocks known crash/bug payloads (oversized text, malformed vCards, mention floods, malicious unicode)." },
    { name: "antigroupmention", label: "Anti-Group-Mention", desc: "Warns and eventually removes non-admins who mass-mention the group." },
    { name: "antitag", label: "Anti-Tag", desc: "Blocks non-admins from mass-tagging the group." },
    { name: "antiimage", label: "Anti-Image", desc: "Deletes image messages from non-admins." },
    { name: "antivideo", label: "Anti-Video", desc: "Deletes video messages from non-admins." },
    { name: "antisticker", label: "Anti-Sticker", desc: "Deletes sticker messages from non-admins." },
    { name: "antibadword", label: "Anti-Badword", desc: "Deletes messages containing blacklisted words." }
];

async function isSenderAdmin(sock, groupId, senderId) {
    try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(x => x.id === senderId);
        return !!(p && (p.admin === "admin" || p.admin === "superadmin"));
    } catch (e) {
        return false;
    }
}

module.exports = FEATURES.map(f => ({
    name: f.name,
    async execute(sock, from, args, msg, extra = {}) {
        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, { text: "❌ This command only works inside groups." });
        }
        const sender = extra.sender || msg.key.participant || from;
        if (!(await isSenderAdmin(sock, from, sender))) {
            return sock.sendMessage(from, { text: "❌ Only group admins can toggle " + f.name + "." });
        }

        const arg = (args[0] || "").toLowerCase();
        if (arg !== "on" && arg !== "off") {
            const current = getGroupSettings(from)[f.name];
            return sock.sendMessage(from, {
                text: `🛡️ *${f.label}*\n${f.desc}\n\nCurrent status: ${current ? "✅ ON" : "❌ OFF"}\nUse: .${f.name} on  /  .${f.name} off`
            });
        }

        const value = arg === "on";
        toggleFeature(from, f.name, value);
        await sock.sendMessage(from, { text: `🛡️ *${f.label}* is now ${value ? "✅ ENABLED" : "❌ DISABLED"}` });
    }
}));
