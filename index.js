// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 PRIMACY_SPX_ULTRA – MAIN ENTRY
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
console.log("INSTANCE ID: " + global.INSTANCE_ID);

const server = http.createServer(async (req, res) => {
    if (req.url === "/api/pair" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", async () => {
            try {
                if (global.botSock && global.botSock.authState && global.botSock.authState.creds && global.botSock.authState.creds.registered) {
                    res.writeHead(409, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({
                        error: "This deployment is already paired to a number. Redeploy fresh (with a clear session) to pair a different number."
                    }));
                }

                let parsed = {};
                try { parsed = JSON.parse(body || "{}"); }
                catch (e) { parsed = Object.fromEntries(new URLSearchParams(body)); }

                const number = parsed.number || parsed.phone;
                if (!number) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "No number provided", received: parsed }));
                }
                if (!global.botSock) {
                    res.writeHead(503, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Bot socket not ready yet - wait a few seconds and retry." }));
                }

                const code = await global.botSock.requestPairingCode(String(number).replace(/[^0-9]/g, ""));
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ code: code }));
            } catch (e) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    const filePath = path.join(__dirname, "public", "index.html");
    fs.readFile(filePath, function(err, data) {
        if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Page not found"); }
        else { res.writeHead(200, { "Content-Type": "text/html" }); res.end(data); }
    });
});

server.listen(process.env.PORT || 3000, function() {
    console.log("HTTP Server listening on port " + (process.env.PORT || 3000) + " instance " + global.INSTANCE_ID);
});

restoreSession();

const commandsPath = path.join(__dirname, "commands");
const commands = loadCommands(commandsPath);
console.log("Loaded " + Object.keys(commands).length + " commands");

let startBot = async function() {
    try {
        const authDir = config.SESSION_DIR;
        const authResult = await useMultiFileAuthState(authDir);
        const state = authResult.state;
        const saveCreds = authResult.saveCreds;

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

console.log("Starting PRIMACY_SPX_ULTRA...");

startBot();

async function shutdown(signal) {
    console.log("Received " + signal + ", shutting down gracefully...");
    try {
        if (global.botSock) {
            global.botSock.ev.removeAllListeners();
            await global.botSock.end(undefined);
            console.log("Socket closed cleanly.");
        }
    } catch (e) {
        console.log("Error during shutdown:", e.message);
    }
    process.exit(0);
}

process.on("SIGTERM", function() { shutdown("SIGTERM"); });
process.on("SIGINT", function() { shutdown("SIGINT"); });

process.on("uncaughtException", function(e) { console.error("Error:", e); });
process.on("unhandledRejection", function(e) { console.error("Rejection:", e); });
