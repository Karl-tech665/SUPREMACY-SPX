// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUNTIME BOT SETTINGS (owner-changeable at runtime)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

module.exports = {
    prefix: config.PREFIX,
    mode: "public",
    botName: config.BOT_NAME
};
