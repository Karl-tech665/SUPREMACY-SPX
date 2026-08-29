// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 – MAIN ENTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const config = require("./config");
const { restoreSession } = require("./utils/session");
const { loadCommands } = require("./utils/commandLoader");
const registerConnectionHandler = require("./events/connection");
const registerMessageHandler = require("./events/messages");
const registerCallHandler = require("./events/calls");
const registerGroupHandler = require("./events/group");

// ─── LOAD MEDIA DEPENDENCIES (GLOBAL ACCESS) ──
// These are required here so the commands folder can use them without crashing
const ytdl = require("@zorner/ytdl-core");
const sharp = require("sharp");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");

global.ytdl = ytdl;
global.sharp = sharp;
global.ffmpegPath = ffmpeg.path;

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
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            markOnlineOnConnect: true,
            connectTimeoutMs: 30000
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
