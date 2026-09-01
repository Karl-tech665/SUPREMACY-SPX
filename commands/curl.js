// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: CURL — fetch and display raw content from a URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: "curl",
    async execute(sock, from, args) {
        if (!args.length) return sock.sendMessage(from, { text: "❌ .curl <url>\nExample: .curl https://api.github.com" });
        let url = args[0];
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;

        try {
            const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            const contentType = res.headers.get("content-type") || "";
            let text = await res.text();
            if (text.length > 3500) text = text.slice(0, 3500) + "\n\n... (truncated, " + text.length + " chars total)";
            await sock.sendMessage(from, { text: `🌐 *${res.status} ${res.statusText}* — ${contentType}\n\n\`\`\`${text}\`\`\`` });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Request failed: " + e.message });
        }
    }
};
