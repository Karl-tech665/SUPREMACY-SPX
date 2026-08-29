// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: PROXY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

module.exports = {
    name: "proxy",
    async execute(sock, from) {
        const proxyText = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🌐 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 PROXIES           ┃
┃  ─────────────────────────────────────  ┃
┃  🔗 Proxy Link: ${config.PROXY.LINK}   ┃
┃  📱 More: ${config.PROXY.WEBSITE}      ┃
┃  🛡️ Protected by 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        await sock.sendMessage(from, { text: proxyText });
    }
};
