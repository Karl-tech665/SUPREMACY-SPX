// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 PRIME – MAIN ENTRY
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

const ytdl = require("@zorner/ytdl-core");
const sharp = require("sharp");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
global.ytdl = ytdl;
global.sharp = sharp;
global.ffmpegPath = ffmpeg.path;

global.INSTANCE_ID = process.env.RENDER_INSTANCE_ID || process.env.RENDER_SERVICE_ID || ("local-" + Date.now());
console.log("🆔 INSTANCE ID: " + global.INSTANCE_ID);

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(config.BOT_NAME + " is running. Instance: " + global.INSTANCE_ID);
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 HTTP Server listening on port ${process.env.PORT || 3000} [instance ${global.INSTANCE_ID}]`);
});

restoreSession();

const commandsPath = path.join(__dirname, "commands");
const commands = loadCommands(commandsPath);
console.log("📦 Loaded " + Object.keys(commands).length + " commands");

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
console.log("║   ✦ PRIME ✦                            ║");
console.log("║   🚀 MODULAR BOT                       ║");
console.log("║   Waiting for connection...             ║");
console.log("╚═══════════════════════════════════════════╝\n");

startBot();

async function shutdown(signal) {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
        if (global.botSock) {
            global.botSock.ev.removeAllListeners();
            await global.botSock.end(undefined);
            console.log("✅ Socket closed cleanly.");
        }
    } catch (e) {
        console.log("⚠️ Error during shutdown:", e.message);
    }
    process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", function(e) { console.error("Error:", e); });
process.on("unhandledRejection", function(e) { console.error("Rejection:", e); });
