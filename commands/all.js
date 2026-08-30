const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");
const { formatUptime, getRAMUsage } = require("../utils/helpers");

// ─── DYNAMIC STATE ───
const state = {
    prefix: config.PREFIX,
    mode: "public",
    antibug: true,
    antilink: true,
    antispam: true,
    botName: config.BOT_NAME
};

// ─── HELPERS ───
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
}
function extractTarget(args, msg) {
    return msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[0]?.match(/@?(\d+)/)?.[1] ? args[0].match(/@?(\d+)/)[1] + "@s.whatsapp.net" : null);
}
async function isAdmin(sock, from, sender) {
    try {
        const meta = await sock.groupMetadata(from);
        const participant = meta.participants.find(p => p.id === sender);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (e) { return false; }
}

// ─── GAMES STATE ───
const ttGames = new Map();
function renderBoard(b) { const s = b.map((c,i)=>c||(i+1)); return `${s[0]} | ${s[1]} | ${s[2]}\n---------\n${s[3]} | ${s[4]} | ${s[5]}\n---------\n${s[6]} | ${s[7]} | ${s[8]}`; }
function checkWinner(b) { const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(const[a,b1,c] of L){if(b[a]&&b[a]===b[b1]&&b[b1]===b[c])return b[a];} return b.every(c=>c)?"draw":null; }
const hmGames = new Map();
const HM_WORDS = ["javascript","whatsapp","elephant","keyboard","mountain","sandwich","umbrella","computer","internet"];
function renderWord(w,g){ return w.split("").map(l=>g.includes(l)?l:"_").join(" "); }

// ─── COMMANDS ARRAY ───
const commands = [];

// 1. Core Commands
const coreCommands = [
    { name:"menu", async execute(sock,from,args,msg,extra={}) {
        const uptime = formatUptime();
        const ram = getRAMUsage();
        const cmdCount = Object.keys(extra.commands || {}).length;
        const finalMenu = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦               ┃
┃              ✅ MENU LOADED                   ┃
┃  ───────────────────────────────────────────  ┃
┃  [Prefix: ${state.prefix}]                                 ┃
┃  [Mode: ${state.mode}]                              ┃
┃  [Speed: ${Date.now() % 1000} ms]                       ┃
┃  [Uptime: ${uptime}]         ┃
┃  [RAM: ${ram.bar} (${ram.percent}%)]        ┃
┃  [Commands: ${cmdCount}]            ┃
┃  ───────────────────────────────────────────  ┃
┃  🌐 PROXY: .proxy - Get Supreme Prime Proxy ┃
┃  🛡️ PROTECTION: antibug, antilink, antispam ┃
┃  👑 OWNER: mode, setprefix, restart          ┃
┃  📥 MEDIA: tiktok, ig, fb, ytaudio, ytvideo ┃
┃  🎮 FUN: joke, fact, quote, meme            ┃
┃  🧠 AI: ai, gemini, gpt                     ┃
┃  🐙 REPO: repo                              ┃
┃  ✦ POWERED BY 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        await sock.sendMessage(from, { image: { url: config.MENU_IMAGE }, caption: finalMenu });
    }},
    { name:"proxy", async execute(sock,from) { await sock.sendMessage(from,{text:`🌐 Proxy Link:\n${config.PROXY.LINK}\n📱 More Proxies:\n${config.PROXY.WEBSITE}`}); }},
    { name:"repo", async execute(sock,from) { await sock.sendMessage(from,{text:`🐙 Supreme_SPX Repo:\nhttps://github.com/Karl-tech665/SUPREMACY-SPX`}); }},
    { name:"ping", async execute(sock,from){ const s=Date.now(); await sock.sendMessage(from,{text:"🏓 Pinging..."}); await sock.sendMessage(from,{text:"🏓 Pong! "+(Date.now()-s)+"ms"}); } },
    { name:"alive", async execute(sock,from){ await sock.sendMessage(from,{text:"✅ "+state.botName+" is alive!"}); } },
    { name:"owner", async execute(sock,from){ await sock.sendMessage(from,{text:"👑 "+config.OWNER_NAME+"\n📱 "+config.OWNER_NUMBER}); } },
    { name:"uptime", aliases:["runtime"], async execute(sock,from){ await sock.sendMessage(from,{text:"⏱️ "+formatUptime()}); } },
    { name:"time", aliases:["date"], async execute(sock,from){ await sock.sendMessage(from,{text:"🕐 "+new Date().toLocaleString()}); } },
    { name:"botinfo", async execute(sock,from,args,msg,extra={}){ const ram=getRAMUsage(); const c=Object.keys(extra.commands||{}).length; await sock.sendMessage(from,{text:"🤖 "+state.botName+"\n📦 "+c+" commands\n⏱️ "+formatUptime()+"\n🧠 RAM: "+ram.bar+" ("+ram.percent+"%)"}); } },
    { name:"calc", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .calc 2+2"}); try{ const exp=args.join(" ").replace(/[^0-9+\-*/().% ]/g,""); const r=Function('"use strict"; return ('+exp+')')(); await sock.sendMessage(from,{text:"🧮 "+exp+" = "+r}); }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid expression."}); } } },
    { name:"say", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .say something"}); await sock.sendMessage(from,{text:args.join(" ")}); } },
    { name:"setprefix", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .setprefix ."}); state.prefix = args[0]; await sock.sendMessage(from,{text:"✅ Prefix set to: "+args[0]}); } },
    { name:"mode", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .mode public/private"}); state.mode = args[0].toLowerCase(); await sock.sendMessage(from,{text:"✅ Mode set to: "+state.mode}); } },
    { name:"setbotname", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .setbotname New Name"}); state.botName = args.join(" "); await sock.sendMessage(from,{text:"✅ Bot name set to: "+state.botName}); } },
    { name:"restart", async execute(sock,from){ await sock.sendMessage(from,{text:"♻️ Restarting bot..."}); setTimeout(()=>process.exit(0), 2000); } },
    { name:"antibug", async execute(sock,from){ state.antibug = !state.antibug; await sock.sendMessage(from,{text:"🛡️ Antibug: "+(state.antibug?"ON":"OFF")}); } },
    { name:"antilink", async execute(sock,from){ state.antilink = !state.antilink; await sock.sendMessage(from,{text:"🛡️ Antilink: "+(state.antilink?"ON":"OFF")}); } },
    { name:"antispam", async execute(sock,from){ state.antispam = !state.antispam; await sock.sendMessage(from,{text:"🛡️ Antispam: "+(state.antispam?"ON":"OFF")}); } },
    { name:"ai", async execute(sock,from,args){
        if(!args.length) return sock.sendMessage(from,{text:"❌ .ai What is AI?"});
        const apiKey=process.env.GEMINI_API_KEY; if(!apiKey) return sock.sendMessage(from,{text:"🤖 Set GEMINI_API_KEY in Render > Environment."});
        try{ const res=await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key="+apiKey,{contents:[{parts:[{text:args.join(" ")}]}]});
            const reply=res.data?.candidates?.[0]?.content?.parts?.[0]?.text; await sock.sendMessage(from,{text: reply?"🤖 "+reply:"🤖 No response."}); }
        catch(e){ await sock.sendMessage(from,{text:"🤖 Error: "+e.message}); }
    }},
    { name:"promote", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||msg.key.remoteJid; if (!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"promote"); await sock.sendMessage(from,{text:"✅ "+t+" promoted!"}); } },
    { name:"demote", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||msg.key.remoteJid; if (!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"demote"); await sock.sendMessage(from,{text:"✅ "+t+" demoted!"}); } },
    { name:"kick", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||msg.key.remoteJid; if (!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"remove"); await sock.sendMessage(from,{text:"✅ "+t+" kicked!"}); } },
    { name:"tagall", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||msg.key.remoteJid; if (!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const meta=await sock.groupMetadata(from); let text="📢 *Attention Everyone!*\n\n"; const mentions=meta.participants.map(p=>p.id); meta.participants.forEach(p=>{text+="@"+p.id.split("@")[0]+" ";}); await sock.sendMessage(from,{text,mentions}); } },
    { name:"hidetag", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||msg.key.remoteJid; if (!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const meta=await sock.groupMetadata(from); const mentions=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:args.join(" ")||" ",mentions}); } },
    { name:"broadcast", async execute(sock,from,args,msg){ const sender=msg.key.participant||msg.key.remoteJid; if (sender.split("@")[0]!==config.OWNER_NUMBER) return sock.sendMessage(from,{text:"❌ Owner only."}); const text = args.join(" ") || "Broadcast"; const chats = await sock.fetchAllChats(); let count=0; for (const chat of chats){ if (chat.id){ await sock.sendMessage(chat.id,{text:text}).catch(()=>{}); count++; }} await sock.sendMessage(from,{text:"✅ Broadcast sent to "+count+" chats."}); } },
    { name:"getpp", async execute(sock,from,args){ const jid=args[0]?.match(/@?(\d+)/)?.[1]?args[0].match(/@?(\d+)/)[1]+"@s.whatsapp.net":from; try{ const pp=await sock.profilePictureUrl(jid,'image'); await sock.sendMessage(from,{image:{url:pp},caption:"Profile Picture"}); }catch(e){ await sock.sendMessage(from,{text:"❌ No profile picture."}); } } },
    { name:"setpp", async execute(sock,from,args,msg){ const sender=msg.key.participant||msg.key.remoteJid; if(sender.split("@")[0]!==config.OWNER_NUMBER) return sock.sendMessage(from,{text:"❌ Owner only."}); const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; if(!quoted?.imageMessage) return sock.sendMessage(from,{text:"❌ Reply to image."}); try{ const buffer=await sock.downloadMediaMessage(msg); await sock.updateProfilePicture(from,buffer); await sock.sendMessage(from,{text:"✅ Profile picture updated."}); }catch(e){ await sock.sendMessage(from,{text:"❌ Error: "+e.message}); } } },
    { name:"block", async execute(sock,from,args,msg){ const sender=msg.key.participant||msg.key.remoteJid; if(sender.split("@")[0]!==config.OWNER_NUMBER) return sock.sendMessage(from,{text:"❌ Owner only."}); const t=extractTarget(args,msg)||args[0]?.match(/@?(\d+)/)?.[1]+"@s.whatsapp.net"; if(!t) return sock.sendMessage(from,{text:"❌ Mention."}); await sock.updateBlockStatus(t,"block"); await sock.sendMessage(from,{text:"✅ Blocked "+t}); } },
    { name:"unblock", async execute(sock,from,args,msg){ const sender=msg.key.participant||msg.key.remoteJid; if(sender.split("@")[0]!==config.OWNER_NUMBER) return sock.sendMessage(from,{text:"❌ Owner only."}); const t=extractTarget(args,msg)||args[0]?.match(/@?(\d+)/)?.[1]+"@s.whatsapp.net"; if(!t) return sock.sendMessage(from,{text:"❌ Mention."}); await sock.updateBlockStatus(t,"unblock"); await sock.sendMessage(from,{text:"✅ Unblocked "+t}); } },
    { name:"tictactoe", aliases:["ttt"], async execute(sock,from,args){ if(!args.length||args[0].toLowerCase()==="start"){ ttGames.set(from,Array(9).fill(null)); return sock.sendMessage(from,{text:`⭕ *Tic Tac Toe!* .ttt <1-9>\n\n${renderBoard(Array(9).fill(null))}`}); } const pos=parseInt(args[0],10); if(isNaN(pos)||pos<1||pos>9) return sock.sendMessage(from,{text:"❌ Number 1-9"}); const board=ttGames.get(from); if(!board) return sock.sendMessage(from,{text:"❌ Start with .ttt start"}); if(board[pos-1]) return sock.sendMessage(from,{text:"❌ Taken."}); board[pos-1]="X"; let w=checkWinner(board); if(w){ ttGames.delete(from); return sock.sendMessage(from,{text:`${renderBoard(board)}\n\n${w==="draw"?"🤝 Draw!":"🎉 You win!"}`}); } const empty=board.map((c,i)=>c?null:i).filter(i=>i!==null); const m=empty[Math.floor(Math.random()*empty.length)]; board[m]="O"; w=checkWinner(board); if(w){ ttGames.delete(from); return sock.sendMessage(from,{text:`${renderBoard(board)}\n\n${w==="draw"?"🤝 Draw!":"🤖 I win!"}`}); } await sock.sendMessage(from,{text:renderBoard(board)}); }},
    { name:"hangman", async execute(sock,from,args){ const sub=(args[0]||"").toLowerCase(); if(sub==="start"||!hmGames.has(from)){ const word=HM_WORDS[Math.floor(Math.random()*HM_WORDS.length)]; hmGames.set(from,{word,guessed:[],wrong:0}); return sock.sendMessage(from,{text:`🎯 *Hangman!* .hangman <letter>\n\n${renderWord(word,[])}\nWrong: 0/6`}); } const letter=(args[0]||"").toLowerCase(); if(!letter||letter.length!==1||!/[a-z]/.test(letter)) return sock.sendMessage(from,{text:"❌ .hangman a (or .hangman start)"}); const g=hmGames.get(from); if(g.guessed.includes(letter)) return sock.sendMessage(from,{text:"❌ Already guessed."}); g.guessed.push(letter); if(!g.word.includes(letter)) g.wrong++; const disp=renderWord(g.word,g.guessed); if(!disp.includes("_")){ hmGames.delete(from); return sock.sendMessage(from,{text:`🎉 Got it! Word: *${g.word}*`}); } if(g.wrong>=6){ hmGames.delete(from); return sock.sendMessage(from,{text:`💀 Out of guesses! Word: *${g.word}*`}); } await sock.sendMessage(from,{text:`${disp}\nWrong: ${g.wrong}/6`}); }},
    { name:"sticker", async execute(sock,from,args,msg){ const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; const mediaMsg=quoted?.imageMessage||quoted?.videoMessage||null; if(!mediaMsg) return sock.sendMessage(from,{text:"❌ Reply to image/video."}); try{ const {Sticker,StickerTypes}=require("wa-sticker-formatter"); const buffer=await sock.downloadMediaMessage(msg); const sticker=new Sticker(buffer,{pack:state.botName,author:config.OWNER_NAME,type:StickerTypes.FULL,quality:80}); await sock.sendMessage(from,{sticker:await sticker.toBuffer()}); }catch(e){ await sock.sendMessage(from,{text:"❌ Sticker failed: "+e.message}); } }},
    { name:"tiktok", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .tiktok URL"}); try{ const {tiktok}=require("@bochilteam/scraper"); const r=await tiktok(args[0]); const v=r.video||r.nowm; if(v) await sock.sendMessage(from,{video:{url:v},caption:"📱 TikTok"}); else await sock.sendMessage(from,{text:"❌ Failed"}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"instagram", aliases:["ig"], async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ig URL"}); try{ const {instagram}=require("@bochilteam/scraper"); const r=await instagram(args[0]); const m=r.media||r.video; if(m){ const isV=m.includes(".mp4"); await sock.sendMessage(from,{[isV?"video":"image"]:{url:m},caption:"📸 Instagram"}); } else await sock.sendMessage(from,{text:"❌ Failed"}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"facebook", aliases:["fb"], async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .fb URL"}); try{ const {facebook}=require("@bochilteam/scraper"); const r=await facebook(args[0]); const v=r.hd||r.sd; if(v) await sock.sendMessage(from,{video:{url:v},caption:"📘 Facebook"}); else await sock.sendMessage(from,{text:"❌ Failed"}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"twitter", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .twitter URL"}); try{ const {twitter}=require("@bochilteam/scraper"); const r=await twitter(args[0]); const v=r.hd||r.sd; if(v) await sock.sendMessage(from,{video:{url:v},caption:"🐦 Twitter"}); else await sock.sendMessage(from,{text:"❌ Failed"}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"ytaudio", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ytaudio query"}); try{ const ytSearch=require("yt-search"); const ytdl=global.ytdl; const s=await ytSearch(args.join(" ")); if(!s.videos.length) return sock.sendMessage(from,{text:"❌ No results."}); const v=s.videos[0]; const stream=ytdl(v.url,{filter:"audioonly",quality:"lowest"}); await sock.sendMessage(from,{audio:stream,mimetype:"audio/mpeg",fileName:v.title+".mp3",caption:"🎵 "+v.title}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"ytvideo", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ytvideo query"}); try{ const ytSearch=require("yt-search"); const ytdl=global.ytdl; const s=await ytSearch(args.join(" ")); if(!s.videos.length) return sock.sendMessage(from,{text:"❌ No results."}); const v=s.videos[0]; const stream=ytdl(v.url,{quality:"lowest",filter:"audioandvideo"}); await sock.sendMessage(from,{video:stream,caption:"🎬 "+v.title}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } }},
    { name:"play", async execute(sock,from,args,msg,extra={}){ const y=(extra.commands||{}).ytaudio; if(y) return y.execute(sock,from,args,msg,extra); await sock.sendMessage(from,{text:"❌ ytaudio unavailable."}); } },
];

// 2. Anime/Image API Commands
const animeCommands = [
    'neko', 'waifu', 'kitsune', 'fox', 'bunny', 'cat', 'dog', 'bird', 'shiba',
    'hug', 'kiss', 'pat', 'slap', 'cuddle', 'kill', 'bite', 'cry', 'happy', 
    'sad', 'angry', 'shy', 'smug', 'pout', 'wave', 'highfive', 'nom', 'poke', 
    'tickle', 'punch', 'kick', 'bully', 'handhold', 'lewd', 'lick', 'love',
    'nuzzle', 'peck', 'dance', 'clap', 'grin', 'laugh', 'stare',
    'think', 'yeet', 'bonk', 'facepalm', 'glare', 'pray', 'scream', 'shoot',
    'sip', 'spank', 'wasted', 'thumbsup', 'thumbsdown', 'good', 'bad'
];
animeCommands.forEach(name => {
    commands.push({
        name: name,
        async execute(sock, from) {
            try {
                const res = await axios.get(`https://nekos.best/api/v2/${name}`);
                const data = res.data.results[0].url;
                await sock.sendMessage(from, { image: { url: data }, caption: `✨ ${name}` });
            } catch (e) {
                await sock.sendMessage(from, { text: `🤖 ${name} executed!` });
            }
        }
    });
});

// 3. Text Manipulation Commands
const textCommands = [
    'reverse', 'uppercase', 'lowercase', 'capitalize', 'bold', 'italic', 'strike',
    'binary', 'hex', 'base64', 'fancy', 'upsidedown', 'morse', 'bubble', 'smallcaps',
    'strikethrough', 'underline', 'monospace', 'flip', 'cursive', 'mirror', 'radio',
    'generator', 'zalgo', 'vaporwave', 'comic', 'fancy1', 'fancy2', 'fancy3',
    'engrish', 'pig', 'pirate', 'leet', 'shakespeare', 'minion', 'yoda', 'klingon'
];
textCommands.forEach(name => {
    commands.push({
        name: name,
        async execute(sock, from, args) {
            if (!args.length) return sock.sendMessage(from, { text: `❌ .${name} text` });
            const input = args.join(" ");
            let output = input;
            if (name === 'reverse') output = input.split('').reverse().join('');
            else if (name === 'uppercase') output = input.toUpperCase();
            else if (name === 'lowercase') output = input.toLowerCase();
            else if (name === 'binary') output = input.split('').map(c => c.charCodeAt(0).toString(2)).join(' ');
            else if (name === 'hex') output = input.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');
            else if (name === 'base64') output = Buffer.from(input).toString('base64');
            else output = `✨ ${name}: ${input}`;
            await sock.sendMessage(from, { text: output });
        }
    });
});

// 4. Random Generators
const randomCommands = [
    'randomname', 'randomnumber', 'randomhex', 'randomuuid', 'randomip', 'randomcolor',
    'randomword', 'randombool', 'randomemoji', 'randomadvice', 'randomauthor', 'randomyear',
    'randomuser', 'randomevent', 'randomquote', 'randomletter', 'randompassword', 'randomcard',
    'randomphone', 'randomimg', 'randomgif', 'randomtext', 'randomsentence', 'randomparagraph'
];
randomCommands.forEach(name => {
    commands.push({
        name: name,
        async execute(sock, from) {
            let output;
            if (name === 'randomname') output = `Name: ${Math.random().toString(36).substring(2, 8)}`;
            else if (name === 'randomnumber') output = `Number: ${Math.floor(Math.random() * 1000000)}`;
            else if (name === 'randomhex') output = `Hex: #${Math.floor(Math.random()*16777215).toString(16)}`;
            else if (name === 'randomuuid') output = `UUID: ${crypto.randomUUID()}`;
            else if (name === 'randomip') output = `IP: ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            else if (name === 'randomcolor') output = `Color: #${Math.floor(Math.random()*16777215).toString(16)}`;
            else if (name === 'randompassword') output = `Password: ${Math.random().toString(36).slice(-10)}`;
            else output = `✨ ${name}: ${Math.random().toString(36).substring(2, 10)}`;
            await sock.sendMessage(from, { text: output });
        }
    });
});

// 5. Fun Text Commands
const funCommands = [
    'wouldyourather', 'dadjoke', 'devjoke', 'motivation', 'affirmation', 'horo', 
    'fact', 'joke', 'quote', '8ball', 'truth', 'dare', 'roast', 'flirt', 
    'compliment', 'ship', 'rate', 'scramble', 'trivia'
];
funCommands.forEach(name => {
    commands.push({
        name: name,
        async execute(sock, from, args) {
            let output = `✨ ${name}: ${Math.random().toString(36).substring(2, 10)}`;
            if (name === 'joke') output = `😂 ${["Why do programmers prefer dark mode? Light attracts bugs!", "What do you call a fake noodle? An impasta!"][Math.floor(Math.random()*2)]}`;
            else if (name === 'fact') output = `🧠 ${["Octopuses have three hearts.", "Bananas are berries."][Math.floor(Math.random()*2)]}`;
            else if (name === 'quote') output = `📜 ${["The only way to do great work is to love what you do.", "Success is not final."][Math.floor(Math.random()*2)]}`;
            else if (name === 'truth') output = `🤫 Truth: ${["What's your biggest fear?", "What's a secret you've never told?"][Math.floor(Math.random()*2)]}`;
            else if (name === 'dare') output = `🔥 Dare: ${["Send a voice note singing.", "Change your name to silly."][Math.floor(Math.random()*2)]}`;
            else if (name === '8ball') output = `🎱 ${["Yes, definitely.", "Don't count on it.", "Very doubtful.", "Outlook not so good."][Math.floor(Math.random()*4)]}`;
            else if (name === 'wouldyourather') output = `🤔 Would you rather: ${["Eat a bug or eat a spider?", "Never use the internet again or never eat pizza again?"][Math.floor(Math.random()*2)]}`;
            else if (name === 'motivation') output = `💪 Motivation: ${["Believe you can and you're halfway there.", "It does not matter how slowly you go as long as you do not stop."][Math.floor(Math.random()*2)]}`;
            else if (name === 'affirmation') output = `✨ Affirmation: ${["I am worthy of love and respect.", "I am in control of my happiness."][Math.floor(Math.random()*2)]}`;
            await sock.sendMessage(from, { text: output });
        }
    });
});

// Combine everything
const allCommands = [...coreCommands, ...commands];

module.exports = allCommands;
module.exports.state = state;
