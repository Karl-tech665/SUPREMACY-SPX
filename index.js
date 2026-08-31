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

// ─── INSTANCE DIAGNOSTIC ──────────────────────
// Render sets these automatically. If two different values ever show up
// in "CONNECTED AND ACTIVE" logs close together, that's hard proof of a
// duplicate running service.
global.INSTANCE_ID = process.env.RENDER_INSTANCE_ID || process.env.RENDER_SERVICE_ID || ("local-" + Date.now());
console.log("🆔 INSTANCE ID: " + global.INSTANCE_ID);

// ─── HTTP SERVER (serves public/index.html + /api/pair) ──
const server = http.createServer(async (req, res) => {
    if (req.url === "/api/pair" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
            try {
                let parsed = {};
                try { parsed = JSON.parse(body || "{}"); }
                catch { parsed = Object.fromEntries(new URLSearchParams(body)); }

                const number = parsed.number || parsed.phone || parsed.whatsappNumber || parsed.waNumber;
                if (!number) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "No number provided", received: parsed }));
                }
                if (!global.botSock) {
                    res.writeHead(503, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Bot socket not ready yet" }));
                }
                const code = await global.botSock.requestPairingCode(String(number).replace(/[^0-9]/g, ""));
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ code }));
            } catch (e) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    const filePath = path.join(__dirname, "public", "index.html");
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Page not found"); }
        else { res.writeHead(200, { "Content-Type": "text/html" }); res.end(data); }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 HTTP Server listening on port ${process.env.PORT || 3000} [instance ${global.INSTANCE_ID}]`);
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

// ─── GRACEFUL SHUTDOWN ─────────────────────────
// Ensures the WhatsApp socket closes cleanly before Render kills the
// process on redeploy, instead of leaving a half-open connection that
// can conflict with the next instance's fresh connection.
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
