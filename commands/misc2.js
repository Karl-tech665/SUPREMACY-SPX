const axios = require("axios");

function extractTarget(args, msg) {
    return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
}
function hashPair(a, b) {
    let h = 0;
    const s = [a, b].sort().join("|");
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return Math.abs(h) % 101;
}

module.exports = [
    { name: "goodmorning", aliases: ["gm"], async execute(sock, from) {
        const lines = ["Rise and shine! ☀️", "Good morning! Make today great.", "Wakey wakey! 🌄 New day, new opportunities."];
        await sock.sendMessage(from, { text: lines[Math.floor(Math.random() * lines.length)] });
    }},
    { name: "goodnight", aliases: ["gn"], async execute(sock, from) {
        const lines = ["Good night! Sleep well. 🌙", "Sweet dreams! ✨", "Rest up, see you tomorrow. 😴"];
        await sock.sendMessage(from, { text: lines[Math.floor(Math.random() * lines.length)] });
    }},
    { name: "couple", async execute(sock, from, args, msg) {
        const t = extractTarget(args, msg); const sender = msg.key.participant || from;
        if (!t) return sock.sendMessage(from, { text: "❌ .couple @user" });
        const p = hashPair(sender, t);
        await sock.sendMessage(from, { text: `💑 Couple match: ${p}%`, mentions: [t] });
    }},
    { name: "getid", aliases: ["getjid"], async execute(sock, from, args, msg) {
        const sender = msg.key.participant || from;
        await sock.sendMessage(from, { text: `🆔 Your JID: ${sender}\n💬 Chat JID: ${from}` });
    }},
    { name: "shorturl", async execute(sock, from, args) {
        if (!args.length) return sock.sendMessage(from, { text: "❌ .shorturl https://example.com" });
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`);
            await sock.sendMessage(from, { text: "🔗 " + res.data });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Failed to shorten URL." }); }
    }},
    { name: "iplookup", aliases: ["getip"], async execute(sock, from, args) {
        if (!args.length) return sock.sendMessage(from, { text: "❌ .iplookup 8.8.8.8" });
        try {
            const res = await axios.get(`http://ip-api.com/json/${args[0]}`);
            const d = res.data;
            if (d.status === "fail") return sock.sendMessage(from, { text: "❌ " + d.message });
            await sock.sendMessage(from, { text: `🌐 *IP Info*\nIP: ${d.query}\nCountry: ${d.country}\nRegion: ${d.regionName}\nCity: ${d.city}\nISP: ${d.isp}` });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Lookup failed." }); }
    }}
];
