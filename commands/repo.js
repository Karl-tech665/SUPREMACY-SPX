// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: REPO (Live Stats + Interactive Buttons)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { animateMessage } = require("../utils/helpers");

const REPO_OWNER = "Karl-tech665";
const REPO_NAME = "SUPREMACY-SPX";
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const ZIP_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/main.zip`;

function timeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
}

async function fetchRepoStats() {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: { "User-Agent": config.BOT_NAME }
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();
    return {
        stars: data.stargazers_count,
        forks: data.forks_count,
        created: new Date(data.created_at).toDateString(),
        updated: timeAgo(data.updated_at),
        owner: data.owner?.login || REPO_OWNER,
        description: data.description || "The Ultimate WhatsApp Bot"
    };
}

function buildLinksBlock() {
    const groups = (config.AUTO_JOIN_GROUPS || []).map(id => `https://chat.whatsapp.com/${id}`);
    const channels = (config.AUTO_FOLLOW_CHANNELS || []).map(id => `https://whatsapp.com/channel/${id}`);
    let block = "";
    groups.forEach((link, i) => { block += `💬 *Group ${i + 1}*: ${link}\n`; });
    channels.forEach((link, i) => { block += `📢 *Channel ${i + 1}*: ${link}\n`; });
    return block.trim();
}

function buildCaption(stats) {
    const divider = "───────────────────────";
    return `🐙 ✦ *${config.BOT_NAME}* ✦
_${stats.description}_
${divider}
⭐ Stars       : ${stats.stars}
🍴 Forks       : ${stats.forks}
📅 Created     : ${stats.created}
🔄 Last Update : ${stats.updated}
👤 Owner       : ${stats.owner}
${divider}
🔗 *Repository*
${REPO_URL}

${buildLinksBlock()}
${divider}
✦ *POWERED BY ${config.BOT_NAME}* ✦`;
}

function buildFallbackCaption(reason) {
    const divider = "───────────────────────";
    return `🐙 ✦ *${config.BOT_NAME}* ✦
_The Ultimate WhatsApp Bot_
${divider}
🔗 *Repository*
${REPO_URL}
⭐ Star and Fork to support!

${buildLinksBlock()}
${divider}
⚠️ _Could not fetch live stats (${reason}). Visit the repo for the latest info._
${divider}
✦ *POWERED BY ${config.BOT_NAME}* ✦`;
}

async function sendInteractiveRepoCard(sock, from, caption) {
    const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
    const buttons = [
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 Open Repo", url: REPO_URL, merchant_url: REPO_URL }) },
        { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copy Repo URL", copy_code: REPO_URL }) },
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📦 Download ZIP", url: ZIP_URL, merchant_url: ZIP_URL }) }
    ];
    const msg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: `Powered by ${config.BOT_NAME}` }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons })
                })
            }
        }
    }, {});
    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
}

module.exports = {
    name: "repo",
    aliases: ["repository", "source", "github"],
    async execute(sock, from) {
        const frames = [
            "🐙 *Connecting to GitHub...*\n░░░░░░░░░░ 0%",
            "🐙 *Fetching Repository Data...*\n████░░░░░░ 40%",
            "🐙 *Pulling Live Stats...*\n███████░░░ 70%",
            "✅ *Repo Data Ready!*\n██████████ 100%",
        ];
        await animateMessage(sock, from, frames, 400);

        let caption;
        try {
            const stats = await fetchRepoStats();
            caption = buildCaption(stats);
        } catch (e) {
            caption = buildFallbackCaption(e.message);
        }

        try {
            await sendInteractiveRepoCard(sock, from, caption);
        } catch (e) {
            try {
                await sock.sendMessage(from, { image: { url: config.MENU_IMAGE }, caption });
            } catch (e2) {
                console.log("❌ Repo: fallback send also failed:", e2.message);
            }
        }
    }
};
