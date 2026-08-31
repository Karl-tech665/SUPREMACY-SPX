// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTION ENFORCEMENT (antilink, antispam, etc.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { getGroupSettings } = require("../utils/groupSettings");
const { addWarn, resetWarns, MAX_WARNS } = require("../utils/warnStore");
const config = require("../config");

const BAD_WORDS = [];
const LINK_REGEX = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|wa\.me)/i;
const MAX_TEXT_LENGTH = 3000;
const MAX_MENTIONS = 30;
const recentMessages = {};

async function isSenderAdmin(sock, groupId, senderId) {
    try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(x => x.id === senderId);
        return !!(p && (p.admin === "admin" || p.admin === "superadmin"));
    } catch (e) {
        return false;
    }
}

async function deleteMessage(sock, groupId, msg) {
    try {
        await sock.sendMessage(groupId, { delete: msg.key });
    } catch (e) {
        console.log("⚠️ Protection: delete failed (is the bot a group admin?):", e.message);
    }
}

function buildWarningCard(label, sender, count) {
    const remaining = Math.max(0, MAX_WARNS - count);
    return `✦ ${config.FOOTER_BRAND} PROTECTION ✦\n\n` +
        `${label}\n\n` +
        `@${sender.split("@")[0]} Beware! ⚠️\n` +
        `Remaining warnings: ${remaining}\n` +
        `Use ${config.PREFIX}resetwarn to reset.`;
}

async function issueWarning(sock, groupId, sender, msg, label) {
    await deleteMessage(sock, groupId, msg);
    const count = addWarn(groupId, sender);
    await sock.sendMessage(groupId, {
        text: buildWarningCard(label, sender, count),
        mentions: [sender]
    });
    if (count >= MAX_WARNS) {
        try {
            await sock.groupParticipantsUpdate(groupId, [sender], "remove");
            resetWarns(groupId, sender);
            await sock.sendMessage(groupId, { text: `🚫 @${sender.split("@")[0]} removed after ${MAX_WARNS} warnings.`, mentions: [sender] });
        } catch (e) {
            console.log("⚠️ Auto-remove after max warnings failed (is bot admin?):", e.message);
        }
    }
}

async function warn(sock, groupId, sender, text) {
    await sock.sendMessage(groupId, { text: text + ` @${sender.split("@")[0]}`, mentions: [sender] });
}

function isSuspiciousBug(content, body) {
    if (body && body.length > MAX_TEXT_LENGTH) return "oversized text message";

    const vcard = content?.contactMessage?.vcard || content?.contactsArrayMessage?.contacts?.[0]?.vcard;
    if (vcard && (vcard.length > 5000 || (vcard.match(/\n/g) || []).length > 200)) {
        return "malformed contact card";
    }

    const mentioned = content?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > MAX_MENTIONS) return "mention flood";

    let depth = 0;
    let inner = content;
    while (inner?.viewOnceMessage || inner?.ephemeralMessage || inner?.viewOnceMessageV2) {
        inner = inner.viewOnceMessage?.message || inner.ephemeralMessage?.message || inner.viewOnceMessageV2?.message;
        depth++;
        if (depth > 4) return "suspicious nested message wrapper";
    }

    if (body) {
        const controlCharCount = (body.match(/[\u202E\u202D\u200B\u200E\u200F\uFEFF]/g) || []).length;
        if (controlCharCount > 20) return "malicious unicode control characters";
    }

    return null;
}

async function enforceProtection(sock, groupId, sender, msg, body, content) {
    const settings = getGroupSettings(groupId);
    if (!Object.values(settings).some(Boolean)) return false;
    if (await isSenderAdmin(sock, groupId, sender)) return false;

    if (settings.antibug) {
        const reason = isSuspiciousBug(content, body);
        if (reason) {
            await deleteMessage(sock, groupId, msg);
            await warn(sock, groupId, sender, `🛡️ Blocked a bug/crash attempt (${reason}).`);
            return true;
        }
    }

    if (settings.antilink && body && LINK_REGEX.test(body)) {
        await issueWarning(sock, groupId, sender, msg, "🔗 LINK DETECTED");
        return true;
    }

    const mentioned = content?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (settings.antigroupmention && mentioned.length >= 5) {
        await issueWarning(sock, groupId, sender, msg, "📢 GROUP MENTION DETECTED");
        return true;
    }
    if (settings.antitag && mentioned.length >= 5) {
        await deleteMessage(sock, groupId, msg);
        await warn(sock, groupId, sender, "🚫 Mass-tagging isn't allowed for members.");
        return true;
    }

    if (settings.antibadword && body && BAD_WORDS.some(w => body.toLowerCase().includes(w))) {
        await deleteMessage(sock, groupId, msg);
        await warn(sock, groupId, sender, "🤬 Inappropriate language removed.");
        return true;
    }

    if (settings.antiimage && content?.imageMessage) { await deleteMessage(sock, groupId, msg); await warn(sock, groupId, sender, "🚫 Images aren't allowed here."); return true; }
    if (settings.antivideo && content?.videoMessage) { await deleteMessage(sock, groupId, msg); await warn(sock, groupId, sender, "🚫 Videos aren't allowed here."); return true; }
    if (settings.antisticker && content?.stickerMessage) { await deleteMessage(sock, groupId, msg); await warn(sock, groupId, sender, "🚫 Stickers aren't allowed here."); return true; }

    if (settings.antispam) {
        const now = Date.now();
        recentMessages[groupId] = recentMessages[groupId] || {};
        const arr = (recentMessages[groupId][sender] || []).filter(t => now - t < 6000);
        arr.push(now);
        recentMessages[groupId][sender] = arr;
        if (arr.length > 4) {
            await deleteMessage(sock, groupId, msg);
            await warn(sock, groupId, sender, "⚠️ Slow down — spam detected.");
            return true;
        }
    }

    return false;
}

module.exports = { enforceProtection };
