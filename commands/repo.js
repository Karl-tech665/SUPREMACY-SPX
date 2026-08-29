// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: REPO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: "repo",
    aliases: ["repository", "source", "github"],
    async execute(sock, from) {
        const repoText = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         🐙 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗                ┃
┃              GitHub Repository                ┃
┃  ───────────────────────────────────────────  ┃
┃  📦 https://github.com/Karl-tech665/SUPREMACY-SPX┃
┃  ⭐ Star and Fork to support!                 ┃
┃  💬 Group: https://chat.whatsapp.com/Cis103JyuBEFGYWq7AGwpe┃
┃  📢 Channel: https://whatsapp.com/channel/0029Vb84TR9IXnltkyhYEC3R┃
┃  📲 Telegram: @SupremePrime_SPX               ┃
┃  ✦ POWERED BY 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        await sock.sendMessage(from, { text: repoText });
    }
};
