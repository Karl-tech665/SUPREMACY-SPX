// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: MENU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");

module.exports = {
    name: "menu",
    aliases: ["help", "cmds"],
    async execute(sock, from, args, msg, extra = {}) {
        const commands = extra.commands || {};
        const cmdCount = Object.keys(commands).length;

        const uptime = formatUptime();
        const ram = getRAMUsage();
        const speed = getSpeed();
        const divider = "───────────────────────";

        const ownerDisplay = config.OWNER_NAME.length > 15
            ? config.OWNER_NAME.slice(0, 15) + "..."
            : config.OWNER_NAME;

        const finalMenu = `✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦
${divider}
📌 Prefix   : ${config.PREFIX}
👑 Owner    : ${ownerDisplay}
🔓 Mode     : Public
🌐 Platform : Render
⚡ Speed    : ${speed}
⏱️ Uptime   : ${uptime}
🧠 RAM      : ${ram.bar} (${ram.percent}%)
📦 Commands : ${cmdCount}
${divider}
🌐 *PROXY*: .proxy — Get Supreme Prime Proxy
🛡️ *PROTECTION*: antibug, antilink, antispam
👑 *OWNER*: mode, setprefix, restart
📥 *MEDIA*: tiktok, ig, fb, ytaudio, ytvideo
🎨 *STICKER*: sticker, attp, emojimix
🎮 *FUN*: joke, fact, quote, meme
🧠 *AI*: ai, gemini, gpt
🐙 *REPO*: repo
${divider}
✦ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗦𝗨𝗣𝗥𝗘𝗠𝗔𝗖𝗬_𝗦𝗣𝗫 ✦`;

        await sock.sendMessage(from, {
            image: { url: config.MENU_IMAGE },
            caption: finalMenu
        });
    }
};
