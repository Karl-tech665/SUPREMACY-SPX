const { getUser, updateUser, fmt, formatCooldown, getAllUsers, COIN } = require("../utils/economyStore");

const DAY_MS = 24 * 60 * 60 * 1000;
const WORK_COOLDOWN = 60 * 60 * 1000; // 1h
const ROB_COOLDOWN = 3 * 60 * 60 * 1000; // 3h

function extractTarget(args, msg) {
    return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
}

module.exports = [
    {
        name: "balance",
        aliases: ["bal", "wallet"],
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            await sock.sendMessage(from, { text: `${COIN} *Wallet:* ${fmt(u.wallet)}\n🏦 *Bank:* ${fmt(u.bank)}\n💰 *Net worth:* ${fmt(u.wallet + u.bank)}` });
        }
    },
    {
        name: "daily",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            const now = Date.now();
            const elapsed = now - (u.lastDaily || 0);
            if (u.lastDaily && elapsed < DAY_MS) {
                return sock.sendMessage(from, { text: `⏳ Come back in ${formatCooldown(DAY_MS - elapsed)}. Streak: 🔥${u.streak}` });
            }
            let streak = (!u.lastDaily || elapsed > DAY_MS * 2) ? 1 : (u.streak || 0) + 1;
            const reward = 250 + Math.min(streak, 14) * 50;
            updateUser(sender, user => { user.wallet += reward; user.lastDaily = now; user.streak = streak; });
            await sock.sendMessage(from, { text: `🎁 *Daily claimed!*\nEarned: ${COIN} ${fmt(reward)}\nStreak: 🔥${streak} days` });
        }
    },
    {
        name: "work",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            const now = Date.now();
            const elapsed = now - (u.lastWork || 0);
            if (u.lastWork && elapsed < WORK_COOLDOWN) {
                return sock.sendMessage(from, { text: `⏳ You're tired. Rest for ${formatCooldown(WORK_COOLDOWN - elapsed)}.` });
            }
            const jobs = ["delivered packages", "fixed a website bug", "walked some dogs", "washed cars", "tutored a student"];
            const earned = 50 + Math.floor(Math.random() * 150);
            updateUser(sender, user => { user.wallet += earned; user.lastWork = now; });
            await sock.sendMessage(from, { text: `💼 You ${jobs[Math.floor(Math.random() * jobs.length)]} and earned ${COIN} ${fmt(earned)}!` });
        }
    },
    {
        name: "rob",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const target = extractTarget(args, msg);
            if (!target) return sock.sendMessage(from, { text: "❌ Mention someone to rob: .rob @user" });
            if (target === sender) return sock.sendMessage(from, { text: "❌ You can't rob yourself." });
            const u = getUser(sender);
            const now = Date.now();
            const elapsed = now - (u.lastRob || 0);
            if (u.lastRob && elapsed < ROB_COOLDOWN) {
                return sock.sendMessage(from, { text: `⏳ Lay low for ${formatCooldown(ROB_COOLDOWN - elapsed)}.` });
            }
            const victim = getUser(target);
            updateUser(sender, user => { user.lastRob = now; });
            if (victim.wallet < 50) {
                return sock.sendMessage(from, { text: "❌ Target is too broke to rob." });
            }
            const success = Math.random() < 0.45;
            if (success) {
                const amount = Math.floor(victim.wallet * (0.1 + Math.random() * 0.2));
                updateUser(target, user => { user.wallet -= amount; });
                updateUser(sender, user => { user.wallet += amount; });
                await sock.sendMessage(from, { text: `🦹 Success! You stole ${COIN} ${fmt(amount)}.` });
            } else {
                const fine = Math.floor(Math.random() * 100) + 20;
                updateUser(sender, user => { user.wallet = Math.max(0, user.wallet - fine); });
                await sock.sendMessage(from, { text: `🚔 You got caught and paid a ${COIN} ${fmt(fine)} fine!` });
            }
        }
    },
    {
        name: "pay",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const target = extractTarget(args, msg);
            const amount = parseInt(args.find(a => /^\d+$/.test(a)), 10);
            if (!target || !amount || amount <= 0) return sock.sendMessage(from, { text: "❌ .pay @user <amount>" });
            const u = getUser(sender);
            if (u.wallet < amount) return sock.sendMessage(from, { text: "❌ Insufficient funds." });
            updateUser(sender, user => { user.wallet -= amount; });
            updateUser(target, user => { user.wallet += amount; });
            await sock.sendMessage(from, { text: `✅ Sent ${COIN} ${fmt(amount)} to the mentioned user.` });
        }
    },
    {
        name: "deposit",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            const amount = args[0] === "all" ? u.wallet : parseInt(args[0], 10);
            if (!amount || amount <= 0 || amount > u.wallet) return sock.sendMessage(from, { text: "❌ .deposit <amount|all>" });
            updateUser(sender, user => { user.wallet -= amount; user.bank += amount; });
            await sock.sendMessage(from, { text: `🏦 Deposited ${COIN} ${fmt(amount)}.` });
        }
    },
    {
        name: "withdraw",
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            const amount = args[0] === "all" ? u.bank : parseInt(args[0], 10);
            if (!amount || amount <= 0 || amount > u.bank) return sock.sendMessage(from, { text: "❌ .withdraw <amount|all>" });
            updateUser(sender, user => { user.bank -= amount; user.wallet += amount; });
            await sock.sendMessage(from, { text: `💵 Withdrew ${COIN} ${fmt(amount)}.` });
        }
    },
    {
        name: "gamble",
        aliases: ["slots", "slot"],
        async execute(sock, from, args, msg) {
            const sender = msg.key.participant || from;
            const u = getUser(sender);
            const bet = args[0] === "all" ? u.wallet : parseInt(args[0], 10);
            if (!bet || bet <= 0 || bet > u.wallet) return sock.sendMessage(from, { text: "❌ .gamble <amount|all>" });
            const reels = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎"];
            const spin = [0, 0, 0].map(() => reels[Math.floor(Math.random() * reels.length)]);
            let payout = 0;
            if (spin[0] === spin[1] && spin[1] === spin[2]) payout = bet * 8;
            else if (spin[0] === spin[1] || spin[1] === spin[2]) payout = Math.floor(bet * 1.5);
            const net = payout - bet;
            updateUser(sender, user => { user.wallet += net; });
            await sock.sendMessage(from, { text: `🎰 ${spin.join(" | ")}\n${net >= 0 ? "✅ Won" : "❌ Lost"} ${COIN} ${fmt(Math.abs(net))}` });
        }
    },
    {
        name: "leaderboard",
        aliases: ["lb", "richest"],
        async execute(sock, from) {
            const users = getAllUsers();
            const sorted = Object.entries(users).map(([jid, u]) => ({ jid, total: u.wallet + u.bank })).sort((a, b) => b.total - a.total).slice(0, 10);
            if (!sorted.length) return sock.sendMessage(from, { text: "📊 No economy data yet." });
            let text = "🏆 *Richest Users*\n\n";
            sorted.forEach((u, i) => { text += `${i + 1}. @${u.jid.split("@")[0]} — ${COIN} ${fmt(u.total)}\n`; });
            await sock.sendMessage(from, { text, mentions: sorted.map(u => u.jid) });
        }
    }
];
