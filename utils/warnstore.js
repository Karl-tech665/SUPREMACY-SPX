const fs = require("fs");
const path = require("path");

const WARN_FILE = path.join(__dirname, "..", "session", "warns.json");
const MAX_WARNS = 3;

let cache = null;

function load() {
    if (cache) return cache;
    try {
        cache = fs.existsSync(WARN_FILE) ? JSON.parse(fs.readFileSync(WARN_FILE, "utf8")) : {};
    } catch (e) {
        cache = {};
    }
    return cache;
}

function save() {
    try {
        fs.mkdirSync(path.dirname(WARN_FILE), { recursive: true });
        fs.writeFileSync(WARN_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.log("⚠️ warnStore: save failed:", e.message);
    }
}

function key(groupId, userId) {
    return `${groupId}:${userId}`;
}

function addWarn(groupId, userId) {
    const data = load();
    const k = key(groupId, userId);
    data[k] = (data[k] || 0) + 1;
    save();
    return data[k];
}

function getWarns(groupId, userId) {
    return load()[key(groupId, userId)] || 0;
}

function resetWarns(groupId, userId) {
    const data = load();
    delete data[key(groupId, userId)];
    save();
}

module.exports = { addWarn, getWarns, resetWarns, MAX_WARNS };
