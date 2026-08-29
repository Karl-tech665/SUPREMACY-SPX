// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: MENU (Animated Loading via Edit)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");

module.exports = {
    name: "menu",
    aliases: ["help", "cmds"],
    async execute(sock, from, args, msg, extra = {}) {
        const commands = extra.commands || {};
        const cmdCount = Object.keys(commands).length;

        const statuses = [
            { text: "⚡ Initializing System...", pct: 15 },
            { text: "📂 Loading Command Modules...", pct: 40 },
            { text: "🛡️ Loading Protection System...", pct: 65 },
            { text: "🎨 Generating Interface...", pct: 90 },
            { text: "✅ Menu Loaded!", pct: 100 },
        ];

        const buildLoadingText = (pct, status) => {
            const barLength = 20;
            const filled = Math.round((pct / 100) * barLength);
            const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
            return `🔄 *LOADING MENU...*\n\n✦ ${config.BOT_NAME} ✦\n\n${bar} ${pct}%\n${status}`;
        };

        // Send the first frame, then EDIT that same message for each subsequent frame.
        let sent;
        try {
            sent = await sock.sendMessage(from, { text: buildLoadingText(statuses[0].pct, statuses[0].text) });
        } catch (e) {
            console.log("❌ Menu: failed to send initial loading message:", e.message);
            return;
        }

        for (let i = 1; i < statuses.length; i++) {
            await new Promise(r => setTimeout(r, 500));
            const status = statuses[i];
            try {
                await sock.sendMessage(from, {
                    text: buildLoadingText(status.pct, status.text),
                    edit: sent.key
                });
            } catch (e) {
                // If editing isn't supported by this Baileys version/account, stop animating
                // and just fall through to sending the final menu normally.
                console.log("⚠️ Menu: edit failed, skipping remaining animation frames:", e.message);
                break;
            }
        }

        const uptime = formatUptime();
        const ram = getRAMUsage();
        const speed = getSpeed();
        const divider = "───────────────────────";

        const ownerDisplay = config.OWNER_NAME.length > 15
            ? config.OWNER_NAME.slice(0, 15) + "..."
            : config.OWNER_NAME;

        const finalMenu = `✦ ${config.BOT_NAME} ✦
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
✦ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 ${config.BOT_NAME} ✦`;

        try {
            await sock.sendMessage(from, {
                image: { url: config.MENU_IMAGE },
                caption: finalMenu
            });
        } catch (e) {
            console.log("❌ Menu: failed to send final menu:", e.message);
        }
    }
};
