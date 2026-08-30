{
    name: "resetwarn",
    async execute(sock, from, args, msg) {
        if (!from.endsWith("@g.us")) return sock.sendMessage(from, { text: "❌ Group only." });
        const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) return sock.sendMessage(from, { text: "❌ Mention a user: .resetwarn @user" });
        const { resetWarns } = require("../utils/warnStore");
        resetWarns(from, target);
        await sock.sendMessage(from, { text: `✅ Warnings reset for @${target.split("@")[0]}`, mentions: [target] });
    }
},
