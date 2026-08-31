// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GROUP SETTINGS (per-group protection toggle storage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require("fs");
const path = require("path");

const SETTINGS_PATH = path.join(__dirname, "..", "session", "groupSettings.json");
let cache = null;

function loadAll() {
    if (cache) return cache;
    try {
        cache = fs.existsSync(SETTINGS_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")) : {};
    } catch (e) {
        cache = {};
    }
    return cache;
}

function saveAll() {
    try {
        fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.log("⚠️ groupSettings: save failed:", e.message);
    }
}

function getGroupSettings(groupId) {
    const data = loadAll();
    if (!data[groupId]) data[groupId] = {};
    return data[groupId];
}

function toggleFeature(groupId, feature, value) {
    getGroupSettings(groupId)[feature] = value;
    saveAll();
    return value;
}

module.exports = { getGroupSettings, toggleFeature };
