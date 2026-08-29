// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 – MAIN ENTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const path = require("path");
const pino = require("pino");
const config = require("./config");
const { restoreSession } = require("./utils/session");
const { loadCommands } = require("./utils/commandLoader");
const registerConnectionHandler = require("./events/connection");
const registerMessageHandler = require("./events/messages");
const registerCallHandler = require("./events/calls");
const registerGroupHandler = require("./events/group");

// ─── RESTORE SESSION ──────────────────────────
restoreSession();

// ─── LOAD COMMANDS ────────────────────────────
const commandsPath = path.join(__dirname, "commands");
const commands = loadCommands(commandsPath);
console.log("📦 Loaded " + Object.keys(commands).length + " commands");

// ─── START BOT ────────────────────────────────
let startBot = async function() {
    try {
        const authDir = config.SESSION_DIR;
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"], // plain signature — confirmed working for pairing
            markOnlineOnConnect: true,
            connectTimeoutMs: 60000
        });

        sock.ev.on("creds.update", saveCreds);

        // ─── REGISTER EVENTS ──────────────────────
        registerConnectionHandler(sock, startBot, commands);
        registerMessageHandler(sock, commands);
        registerCallHandler(sock);
        registerGroupHandler(sock);

        global.botSock = sock;

    } catch (e) {
        console.error("Start error:", e.message);
        setTimeout(startBot, 10000);
    }
};

console.log("╔═══════════════════════════════════════════╗");
console.log("║   ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦               ║");
console.log("║   🚀 MODULAR BOT                       ║");
console.log("║   Waiting for connection...             ║");
console.log("╚═══════════════════════════════════════════╝\n");

startBot();

process.on("uncaughtException", function(e) { console.error("Error:", e); });
process.on("unhandledRejection", function(e) { console.error("Rejection:", e); });
