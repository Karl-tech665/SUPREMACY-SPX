// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: MENU (Animated Loading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");

module.exports = {
    name: "menu",
    aliases: ["help", "cmds"],
    async execute(sock, from, args, msg) {
        const statuses = [
            { msg: "⚡ Initializing System...", pct: 10 },
            { msg: "🗄️ Loading Database...", pct: 20 },
            { msg: "📂 Loading Command Modules...", pct: 35 },
            { msg: "🛡️ Loading Protection System...", pct: 50 },
            { msg: "🎨 Generating Interface...", pct: 65 },
            { msg: "📊 Compiling Statistics...", pct: 80 },
            { msg: "✨ Finalizing Menu...", pct: 95 },
            { msg: "✅ Menu Loaded!", pct: 100 },
        ];

        const baseMsg = (pct, status) => {
            const barLength = 20;
            const filled = Math.round((pct / 100) * barLength);
            const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
            return `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                      ┃
┃          🔄 LOADING MENU...          ┃
┃                                      ┃
┃  ═══════════════════════════════════  ┃
┃                                      ┃
┃  ✦ SUPREMACY_SPX ✦                   ┃
┃                                      ┃
┃  ${bar} ${pct}%                      ┃
┃                                      ┃
┃  ${status}                           ┃
┃                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        };

        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            await sock.sendMessage(from, { text: baseMsg(status.pct, status.msg) });
            await new Promise(r => setTimeout(r, 700));
        }

        const uptime = formatUptime();
        const ram = getRAMUsage();
        const cmdCount = Object.keys(require("../index").commands).length; // we'll expose commands globally
        const speed = getSpeed();
        const finalMenu = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦               ┃
┃              ✅ MENU LOADED                   ┃
┃  ───────────────────────────────────────────  ┃
┃  [Prefix: .]                                 ┃
┃  [Owner: ${config.OWNER_NAME.slice(0, 15)}...]        ┃
┃  [Mode: Public]                              ┃
┃  [Platform: Render]                          ┃
┃  [Speed: ${speed}]                       ┃
┃  [Uptime: ${uptime}]         ┃
┃  [RAM: ${ram.bar} (${ram.percent}%)]        ┃
┃  [Commands: ${cmdCount}]            ┃
┃  ───────────────────────────────────────────  ┃
┃  🌐 PROXY: .proxy - Get Supreme Prime Proxy ┃
┃  🛡️ PROTECTION: antibug, antilink, antispam ┃
┃  👑 OWNER: mode, setprefix, restart          ┃
┃  📥 MEDIA: tiktok, ig, fb, ytaudio, ytvideo ┃
┃  🎨 STICKER: sticker, attp, emojimix         ┃
┃  🎮 FUN: joke, fact, quote, meme            ┃
┃  🧠 AI: ai, gemini, gpt                     ┃
┃  🐙 REPO: repo                              ┃
┃  ───────────────────────────────────────────  ┃
┃  ✦ POWERED BY 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await sock.sendMessage(from, {
            image: { url: config.MENU_IMAGE },
            caption: finalMenu
        });
    }
};
