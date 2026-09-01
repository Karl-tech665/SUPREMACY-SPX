// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOLS — weather, define, lyrics (all free, no API key)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = [
    {
        name: "weather",
        async execute(sock, from, args) {
            if (!args.length) return sock.sendMessage(from, { text: "❌ .weather <city>\nExample: .weather Nairobi" });
            try {
                const res = await fetch(`https://wttr.in/${encodeURIComponent(args.join(" "))}?format=3`);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const text = await res.text();
                await sock.sendMessage(from, { text: "🌦️ " + text.trim() });
            } catch (e) {
                await sock.sendMessage(from, { text: "❌ Weather lookup failed: " + e.message });
            }
        }
    },
    {
        name: "define",
        aliases: ["urban"],
        async execute(sock, from, args) {
            if (!args.length) return sock.sendMessage(from, { text: "❌ .define <word>" });
            try {
                const term = args.join(" ");
                const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
                const data = await res.json();
                if (!data.list || !data.list.length) return sock.sendMessage(from, { text: "❌ No definition found." });
                const d = data.list[0];
                const def = d.definition.replace(/[\[\]]/g, "").slice(0, 600);
                const example = (d.example || "").replace(/[\[\]]/g, "").slice(0, 300);
                await sock.sendMessage(from, { text: `📖 *${term}*\n\n${def}${example ? `\n\n_Example:_ ${example}` : ""}` });
            } catch (e) {
                await sock.sendMessage(from, { text: "❌ Define failed: " + e.message });
            }
        }
    },
    {
        name: "lyrics",
        async execute(sock, from, args) {
            if (!args.length) return sock.sendMessage(from, { text: "❌ .lyrics <artist> - <song>\nExample: .lyrics Adele - Hello" });
            const parts = args.join(" ").split(" - ");
            if (parts.length < 2) return sock.sendMessage(from, { text: "❌ Format: .lyrics <artist> - <song>" });
            const [artist, song] = parts;
            try {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist.trim())}/${encodeURIComponent(song.trim())}`);
                const data = await res.json();
                if (!data.lyrics) return sock.sendMessage(from, { text: "❌ Lyrics not found." });
                const trimmed = data.lyrics.length > 3500 ? data.lyrics.slice(0, 3500) + "\n\n... (truncated)" : data.lyrics;
                await sock.sendMessage(from, { text: `🎵 *${song.trim()}* — ${artist.trim()}\n\n${trimmed}` });
            } catch (e) {
                await sock.sendMessage(from, { text: "❌ Lyrics lookup failed: " + e.message });
            }
        }
    }
];
