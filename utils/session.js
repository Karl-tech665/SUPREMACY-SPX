// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SESSION HANDLER (Restore & Backup)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require("fs");
const path = require("path");
const config = require("../config");

function parseSessionId(sessionId) {
    let value = String(sessionId || "").trim();
    value = value.replace(/^["']|["']$/g, "");
    if (value.startsWith("SUPREMACY-SPX:~")) {
        value = value.slice("SUPREMACY-SPX:~".length).trim().replace(/^~+/, "");
    }
    try {
        const decoded = Buffer.from(value, "base64").toString("utf8");
        return JSON.parse(decoded);
    } catch {
        return JSON.parse(value);
    }
}

function restoreSession() {
    const sessionId = process.env.SESSION_ID || "";
    if (!sessionId) {
        console.log("⚠️ No SESSION_ID provided – will pair fresh");
        return null;
    }
    try {
        const sessionData = parseSessionId(sessionId);
        const dir = config.SESSION_DIR;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const credsPath = path.join(dir, "creds.json");
        fs.writeFileSync(credsPath, JSON.stringify(sessionData, null, 2));
        console.log("✅ Session restored from SESSION_ID.");
        return credsPath;
    } catch (e) {
        console.log("❌ Failed to restore session:", e.message);
        return null;
    }
}

function getSessionId() {
    try {
        const credsPath = path.join(config.SESSION_DIR, "creds.json");
        if (fs.existsSync(credsPath)) {
            const buffer = fs.readFileSync(credsPath);
            return "SUPREMACY-SPX:~" + buffer.toString("base64");
        }
    } catch (e) {}
    return null;
}

module.exports = { restoreSession, getSessionId };
