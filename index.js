// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 – MAIN ENTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const http = require("http");
const config = require("./config");
const { restoreSession } = require("./utils/session");
const { loadCommands } = require("./utils/commandLoader");
const registerConnectionHandler = require("./events/connection");
const registerMessageHandler = require("./events/messages");
const registerCallHandler = require("./events/calls");
const registerGroupHandler = require("./events/group");

// ─── LOAD MEDIA DEPENDENCIES (GLOBAL ACCESS) ──
const ytdl = require("@zorner/ytdl-core");
const sharp = require("sharp");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");

global.ytdl = ytdl;
global.sharp = sharp;
global.ffmpegPath = ffmpeg.path;

// ─── HTTP SERVER (BEAUTIFUL STATUS PAGE) ──
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SUPREMACY_SPX</title>
    <style>
        body { font-family: Arial, sans-serif; background: #121212; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { text-align: center; background: #1e1e1e; padding: 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        h1 { color: #8e44ad; }
        .status { color: #2ecc71; font-weight: bold; font-size: 1.2rem; }
        p { color: #aaa; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✦ SUPREMACY_SPX ✦</h1>
        <div class="status">Bot is Currently ONLINE</div>
        <p>If you want to pair, please check your WhatsApp DMs for the Pairing Code.</p>
        <p>Keep this page open to keep the bot active.</p>
    </div>
</body>
</html>`);
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 HTTP Server listening on port ${process.env.PORT || 3000}`);
});

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
