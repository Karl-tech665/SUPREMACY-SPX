const guessSessions = new Map();

const WORDLE_WORDS = ["apple", "chair", "brave", "stone", "flame", "grape", "storm", "cloud", "sword", "plant"];
const wordleSessions = new Map();

module.exports = [
    {
        name: "numberguess",
        aliases: ["ng"],
        async execute(sock, from, args) {
            const sub = (args[0] || "").toLowerCase();
            if (sub === "quit") {
                const s = guessSessions.get(from);
                guessSessions.delete(from);
                return sock.sendMessage(from, { text: s ? `🏳️ Ended. It was *${s.answer}*.` : "❌ No active game." });
            }
            if (!guessSessions.has(from)) {
                guessSessions.set(from, { answer: 1 + Math.floor(Math.random() * 100), tries: 0 });
                return sock.sendMessage(from, { text: "🎯 Guessing a number 1-100! You have 7 tries.\n.ng <number>" });
            }
            const guess = parseInt(sub, 10);
            if (isNaN(guess)) return sock.sendMessage(from, { text: "❌ .ng <number>" });
            const s = guessSessions.get(from);
            s.tries++;
            if (guess === s.answer) {
                guessSessions.delete(from);
                return sock.sendMessage(from, { text: `🎉 Correct! It was ${s.answer}, in ${s.tries} tries.` });
            }
            if (s.tries >= 7) {
                guessSessions.delete(from);
                return sock.sendMessage(from, { text: `💀 Out of tries! It was *${s.answer}*.` });
            }
            await sock.sendMessage(from, { text: `${guess < s.answer ? "📈 Higher!" : "📉 Lower!"} (${s.tries}/7 tries)` });
        }
    },
    {
        name: "wordle",
        async execute(sock, from, args) {
            const sub = (args[0] || "").toLowerCase();
            if (sub === "start" || !wordleSessions.has(from)) {
                const word = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
                wordleSessions.set(from, { word, tries: 0 });
                return sock.sendMessage(from, { text: "🟩 Wordle started! Guess a 5-letter word: .wordle <word>\nYou have 6 tries." });
            }
            const guess = sub;
            if (!guess || guess.length !== 5) return sock.sendMessage(from, { text: "❌ Guess a 5-letter word: .wordle apple" });
            const s = wordleSessions.get(from);
            s.tries++;
            const result = guess.split("").map((l, i) => {
                if (s.word[i] === l) return "🟩";
                if (s.word.includes(l)) return "🟨";
                return "⬛";
            }).join("");
            if (guess === s.word) {
                wordleSessions.delete(from);
                return sock.sendMessage(from, { text: `${result}\n🎉 Correct! (${s.tries}/6 tries)` });
            }
            if (s.tries >= 6) {
                wordleSessions.delete(from);
                return sock.sendMessage(from, { text: `${result}\n💀 Out of tries! Word was *${s.word}*.` });
            }
            await sock.sendMessage(from, { text: `${result}\n(${s.tries}/6 tries)` });
        }
    }
];
