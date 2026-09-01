// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: GITCLONE — downloads a public GitHub repo as a zip
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseRepo(input) {
    const m = input.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);
    if (m) return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
    const parts = input.split("/");
    if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
    return null;
}

module.exports = {
    name: "gitclone",
    aliases: ["clone"],
    async execute(sock, from, args) {
        if (!args.length) {
            return sock.sendMessage(from, { text: "❌ .gitclone <owner/repo or full GitHub URL>\nExample: .gitclone Karl-tech665/SUPREMACY-SPX" });
        }
        const parsed = parseRepo(args[0]);
        if (!parsed) {
            return sock.sendMessage(from, { text: "❌ Couldn't parse that as a GitHub repo. Use owner/repo or a full github.com URL." });
        }

        await sock.sendMessage(from, { text: `📦 Fetching ${parsed.owner}/${parsed.repo}...` });

        try {
            const checkRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
            if (!checkRes.ok) {
                return sock.sendMessage(from, { text: `❌ Repo not found or private (HTTP ${checkRes.status}).` });
            }

            const zipUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/heads/main.zip`;
            await sock.sendMessage(from, {
                document: { url: zipUrl },
                mimetype: "application/zip",
                fileName: `${parsed.repo}.zip`,
                caption: `📦 ${parsed.owner}/${parsed.repo}\nIf this fails, the default branch may not be "main" — try .gitclone ${parsed.owner}/${parsed.repo}/tree/master`
            });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Failed to fetch repo: " + e.message });
        }
    }
};
