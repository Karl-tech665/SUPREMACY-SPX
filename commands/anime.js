const axios = require("axios");

const REACTIONS = {
    hug: "🤗", pat: "🖐️", cuddle: "🥰", wink: "😉",
    highfive: "🙌", cry: "😢", dance: "💃", nom: "😋",
    glomp: "🫂", awoo: "🐺", poke: "👉", handhold: "🤝",
    wave: "👋", bonk: "🔨"
};

async function fetchWaifuGif(type) {
    const res = await axios.get(`https://api.waifu.pics/sfw/${type}`, { timeout: 5000 });
    return res.data.url;
}

function buildEntry(type, emoji) {
    return {
        name: type,
        async execute(sock, from, args, msg) {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const sender = msg.key.participant || from;
            try {
                const url = await fetchWaifuGif(type);
                const targetText = mentioned.length ? ` @${mentioned[0].split("@")[0]}` : "";
                await sock.sendMessage(from, {
                    image: { url },
                    caption: `${emoji} sent a ${type}${targetText}!`,
                    mentions: mentioned
                });
            } catch (e) {
                await sock.sendMessage(from, { text: `${emoji} ${type}! (image unavailable right now)` });
            }
        }
    };
}

module.exports = Object.entries(REACTIONS).map(([type, emoji]) => buildEntry(type, emoji));
