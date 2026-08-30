const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "session", "economy");
const USERS_FILE = path.join(DATA_DIR, "users.json");

let cache = null;
let saveTimer = null;

function load() {
    if (cache) return cache;
    try {
        if (!fs.existsSync(USERS_FILE)) { cache = { users: {} }; return cache; }
        cache = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
        if (!cache.users) cache.users = {};
    } catch (e) {
        console.log("⚠️ Economy: load failed, starting fresh:", e.message);
        cache = { users: {} };
    }
    return cache;
}

function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        try {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(USERS_FILE, JSON.stringify(cache, null, 2));
        } catch (e) {
            console.log("⚠️ Economy: save failed:", e.message);
        }
    }, 500);
}

function getUser(jid) {
    const data = load();
    if (!data.users[jid]) {
        data.users[jid] = { wallet: 500, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0, streak: 0 };
    }
    return data.users[jid];
}

function updateUser(jid, mutator) {
    const user = getUser(jid);
    mutator(user);
    scheduleSave();
    return user;
}

function fmt(n) {
    return Math.floor(n).toLocaleString();
}

function formatCooldown(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getAllUsers() {
    return load().users;
}

module.exports = { getUser, updateUser, fmt, formatCooldown, getAllUsers, COIN: "🪙" };
