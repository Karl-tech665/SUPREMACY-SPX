// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALL COMMANDS — general, fun, games, ai, sticker, media, admin, settings, profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const axios = require("axios");
const crypto = require("crypto"); // Added for RandomUUID
const config = require("../config");
const { formatUptime, getRAMUsage } = require("../utils/helpers");
const state = require("../utils/botSettings");

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
function isOwner(sender) {
    return sender.split("@")[0] === config.OWNER_NUMBER;
}
async function isAdmin(sock, from, sender) {
    try {
        const meta = await sock.groupMetadata(from);
        const p = meta.participants.find(x => x.id === sender);
        return p?.admin === "admin" || p?.admin === "superadmin";
    } catch (e) { return false; }
}

// ─── GAME STATE ───
const ttGames = new Map();
function renderBoard(b) { const s=b.map((c,i)=>c||(i+1)); return `${s[0]} | ${s[1]} | ${s[2]}\n---------\n${s[3]} | ${s[4]} | ${s[5]}\n---------\n${s[6]} | ${s[7]} | ${s[8]}`; }
function checkWinner(b) { const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(const[a,b1,c] of L){if(b[a]&&b[a]===b[b1]&&b[b1]===b[c])return b[a];} return b.every(c=>c)?"draw":null; }
const hmGames = new Map();
const HM_WORDS = ["javascript","whatsapp","elephant","keyboard","mountain","sandwich","umbrella","computer","internet"];
function renderWord(w,g){ return w.split("").map(l=>g.includes(l)?l:"_").join(" "); }

module.exports = [
    // ── YOUR EXISTING CODE (NO REMOVALS) ──
    { name:"ping", async execute(sock,from){ const s=Date.now(); await sock.sendMessage(from,{text:"🏓 Pinging..."}); await sock.sendMessage(from,{text:"🏓 Pong! "+(Date.now()-s)+"ms"}); } },
    { name:"alive", async execute(sock,from){ await sock.sendMessage(from,{text:"✅ "+state.botName+" is alive!"}); } },
    { name:"owner", async execute(sock,from){ await sock.sendMessage(from,{text:"👑 "+config.OWNER_NAME+"\n📱 "+config.OWNER_NUMBER}); } },
    { name:"uptime", aliases:["runtime"], async execute(sock,from){ await sock.sendMessage(from,{text:"⏱️ "+formatUptime()}); } },
    { name:"time", aliases:["date"], async execute(sock,from){ await sock.sendMessage(from,{text:"🕐 "+new Date().toLocaleString()}); } },
    { name:"botinfo", async execute(sock,from,args,msg,extra={}){ const ram=getRAMUsage(); const c=Object.keys(extra.commands||{}).length; await sock.sendMessage(from,{text:"🤖 "+state.botName+"\n📦 "+c+" commands\n⏱️ "+formatUptime()+"\n🧠 RAM: "+ram.bar+" ("+ram.percent+"%)"}); } },
    { name:"calc", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .calc 2+2"}); try{ const exp=args.join(" ").replace(/[^0-9+\-*/().% ]/g,""); const r=Function('"use strict"; return ('+exp+')')(); await sock.sendMessage(from,{text:"🧮 "+exp+" = "+r}); }catch(e){ await sock.sendMessage(from,{text:"❌ Invalid expression."}); } } },
    { name:"say", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .say something"}); await sock.sendMessage(from,{text:args.join(" ")}); } },

    // ── FUN ──
    { name:"joke", async execute(sock,from){ const j=["Why do programmers prefer dark mode? Light attracts bugs!","What do you call a fake noodle? An impasta!","Why did the scarecrow win an award? Outstanding in his field!"]; await sock.sendMessage(from,{text:"😂 "+j[Math.floor(Math.random()*j.length)]}); } },
    { name:"fact", async execute(sock,from){ const f=["Octopuses have three hearts.","Bananas are berries, but strawberries aren't.","A day on Venus is longer than a year on Venus."]; await sock.sendMessage(from,{text:"🧠 "+f[Math.floor(Math.random()*f.length)]}); } },
    { name:"quote", async execute(sock,from){ const q=["The only way to do great work is to love what you do. - Jobs","In the middle of difficulty lies opportunity. - Einstein","Success is not final, failure is not fatal. - Churchill"]; await sock.sendMessage(from,{text:"📜 "+q[Math.floor(Math.random()*q.length)]}); } },
    { name:"meme", async execute(sock,from){ try{ const r=await axios.get("https://meme-api.com/gimme"); await sock.sendMessage(from,{image:{url:r.data.url},caption:"😂 "+r.data.title}); }catch(e){ await sock.sendMessage(from,{text:"❌ Meme fetch failed."}); } } },
    { name:"8ball", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .8ball Will I win?"}); const a=["Yes, definitely.","It is certain.","Without a doubt.","Most likely.","Ask again later.","Cannot predict now.","Don't count on it.","My sources say no.","Very doubtful.","Outlook not so good."]; const q=args.join(" "); await sock.sendMessage(from,{text:`🎱 *${q}*\n${a[hashString(q)%a.length]}`}); } },
    { name:"truth", async execute(sock,from){ const p=["What's the most embarrassing thing that's happened to you?","What's a secret you've never told anyone in this group?","What's the biggest lie you've ever told?","What's your biggest fear?","What's a habit you're trying to break?"]; await sock.sendMessage(from,{text:"🤫 *Truth:* "+p[Math.floor(Math.random()*p.length)]}); } },
    { name:"dare", async execute(sock,from){ const p=["Send a voice note singing your favorite song.","Change your WhatsApp name to something silly for 10 minutes.","Post an embarrassing childhood photo.","Type your next 3 messages using only emojis.","Text the last person you called and say 'I miss you'."]; await sock.sendMessage(from,{text:"🔥 *Dare:* "+p[Math.floor(Math.random()*p.length)]}); } },
    { name:"coinflip", aliases:["cf"], async execute(sock,from){ await sock.sendMessage(from,{text:Math.random()<0.5?"🪙 Heads":"🪙 Tails"}); } },
    { name:"scramble", async execute(sock,from){ const w=["javascript","elephant","whatsapp","keyboard","mountain","sandwich","umbrella"]; const word=w[Math.floor(Math.random()*w.length)]; const s=word.split("").sort(()=>Math.random()-0.5).join(""); await sock.sendMessage(from,{text:`🔤 Unscramble:\n\n*${s.toUpperCase()}*\n\n(${word.length} letters)`}); } },
    { name:"rate", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .rate something"}); const t=args.join(" "); const p=hashString(t.toLowerCase())%101; await sock.sendMessage(from,{text:`📊 I'd rate *${t}*: ${p}/100`}); } },
    { name:"ship", async execute(sock,from,args){ if(args.length<2) return sock.sendMessage(from,{text:"❌ .ship name1 name2"}); const p=hashString(args.join(" ").toLowerCase())%101; const bar="█".repeat(Math.round(p/10))+"░".repeat(10-Math.round(p/10)); await sock.sendMessage(from,{text:`💘 Shipping ${args[0]} + ${args[1]}\n${bar} ${p}%`}); } },
    { name:"compliment", async execute(sock,from,args){ const l=["You're smarter than you give yourself credit for.","Your energy makes this group better.","You have great taste.","You're stronger than most people realize.","You always know what to say."]; const t=args.length?args.join(" ")+", ":""; await sock.sendMessage(from,{text:`💬 ${t}${l[Math.floor(Math.random()*l.length)]}`}); } },
    { name:"flirt", async execute(sock,from){ const l=["Are you a parking ticket? Because you've got FINE written all over you.","Do you have a map? I keep getting lost in your eyes.","Is your name Wi-Fi? Because I'm really feeling a connection.","If being cute were a crime, you'd be serving a life sentence."]; await sock.sendMessage(from,{text:"😏 "+l[Math.floor(Math.random()*l.length)]}); } },
    { name:"roast", async execute(sock,from){ const l=["You bring everyone so much joy... when you leave the room.","I'd explain it to you, but I left my crayons at home.","You're proof that even evolution takes a day off sometimes.","You're not stupid, you just have bad luck thinking."]; await sock.sendMessage(from,{text:"🔥 "+l[Math.floor(Math.random()*l.length)]}); } },
    { name:"trivia", async execute(sock,from){ const qs=[{q:"What is the capital of Japan?",a:"Tokyo"},{q:"How many continents are there?",a:"7"},{q:"Chemical symbol for gold?",a:"Au"},{q:"Who wrote Romeo and Juliet?",a:"William Shakespeare"},{q:"Which planet is the Red Planet?",a:"Mars"}]; const it=qs[Math.floor(Math.random()*qs.length)]; await sock.sendMessage(from,{text:`🧠 *Trivia*\n${it.q}\n\n⏳ Answer in 10s...`}); await new Promise(r=>setTimeout(r,10000)); await sock.sendMessage(from,{text:`✅ Answer: *${it.a}*`}); } },

    // ── GAMES ──
    { name:"tictactoe", aliases:["ttt"], async execute(sock,from,args){
        if(!args.length||args[0].toLowerCase()==="start"){ ttGames.set(from,Array(9).fill(null)); return sock.sendMessage(from,{text:`⭕ *Tic Tac Toe!* You're X, I'm O. .ttt <1-9>\n\n${renderBoard(Array(9).fill(null))}`}); }
        const pos=parseInt(args[0],10); if(isNaN(pos)||pos<1||pos>9) return sock.sendMessage(from,{text:"❌ Number 1-9, or .ttt start"});
        const board=ttGames.get(from); if(!board) return sock.sendMessage(from,{text:"❌ Start with .ttt start"}); if(board[pos-1]) return sock.sendMessage(from,{text:"❌ Taken."});
        board[pos-1]="X"; let w=checkWinner(board);
        if(w){ ttGames.delete(from); return sock.sendMessage(from,{text:`${renderBoard(board)}\n\n${w==="draw"?"🤝 Draw!":"🎉 You win!"}`}); }
        const empty=board.map((c,i)=>c?null:i).filter(i=>i!==null); const m=empty[Math.floor(Math.random()*empty.length)]; board[m]="O"; w=checkWinner(board);
        if(w){ ttGames.delete(from); return sock.sendMessage(from,{text:`${renderBoard(board)}\n\n${w==="draw"?"🤝 Draw!":"🤖 I win!"}`}); }
        await sock.sendMessage(from,{text:renderBoard(board)});
    }},
    { name:"hangman", async execute(sock,from,args){
        const sub=(args[0]||"").toLowerCase();
        if(sub==="start"||!hmGames.has(from)){ const word=HM_WORDS[Math.floor(Math.random()*HM_WORDS.length)]; hmGames.set(from,{word,guessed:[],wrong:0}); return sock.sendMessage(from,{text:`🎯 *Hangman!* .hangman <letter>\n\n${renderWord(word,[])}\nWrong: 0/6`}); }
        const letter=(args[0]||"").toLowerCase(); if(!letter||letter.length!==1||!/[a-z]/.test(letter)) return sock.sendMessage(from,{text:"❌ .hangman a  (or .hangman start)"});
        const g=hmGames.get(from); if(g.guessed.includes(letter)) return sock.sendMessage(from,{text:"❌ Already guessed."});
        g.guessed.push(letter); if(!g.word.includes(letter)) g.wrong++;
        const disp=renderWord(g.word,g.guessed);
        if(!disp.includes("_")){ hmGames.delete(from); return sock.sendMessage(from,{text:`🎉 Got it! Word: *${g.word}*`}); }
        if(g.wrong>=6){ hmGames.delete(from); return sock.sendMessage(from,{text:`💀 Out of guesses! Word: *${g.word}*`}); }
        await sock.sendMessage(from,{text:`${disp}\nWrong: ${g.wrong}/6`});
    }},

    // ── AI ──
    { name:"ai", async execute(sock,from,args){
        if(!args.length) return sock.sendMessage(from,{text:"❌ .ai What is AI?"});
        const apiKey=process.env.GEMINI_API_KEY; if(!apiKey) return sock.sendMessage(from,{text:"🤖 Set GEMINI_API_KEY in Render > Environment."});
        try{ const res=await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key="+apiKey,{contents:[{parts:[{text:args.join(" ")}]}]});
            const reply=res.data?.candidates?.[0]?.content?.parts?.[0]?.text; await sock.sendMessage(from,{text: reply?"🤖 "+reply:"🤖 No response."}); }
        catch(e){ await sock.sendMessage(from,{text:"🤖 Error: "+e.message}); }
    }},

    // ── STICKER ──
    { name:"sticker", async execute(sock,from,args,msg){
        const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mediaMsg=quoted?.imageMessage||quoted?.videoMessage||null;
        if(!mediaMsg) return sock.sendMessage(from,{text:"❌ Reply to an image/video with .sticker"});
        try{ const {Sticker,StickerTypes}=require("wa-sticker-formatter"); const buffer=await sock.downloadMediaMessage({message:mediaMsg});
            const sticker=new Sticker(buffer,{pack:state.botName,author:config.OWNER_NAME,type:StickerTypes.FULL,quality:80});
            await sock.sendMessage(from,{sticker:await sticker.toBuffer()}); }
        catch(e){ await sock.sendMessage(from,{text:"❌ Sticker failed: "+e.message}); }
    }},

    // ── MEDIA ──
    { name:"tiktok", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .tiktok URL"}); try{ const {tiktok}=require("@bochilteam/scraper"); const r=await tiktok(args[0]); const v=r.video||r.nowm||r.video_with_watermark; if(v) await sock.sendMessage(from,{video:{url:v},caption:"📱 TikTok"}); else await sock.sendMessage(from,{text:"❌ Could not fetch."}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"instagram", aliases:["ig"], async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ig URL"}); try{ const {instagram}=require("@bochilteam/scraper"); const r=await instagram(args[0]); const m=r.media||r.video||r.image; if(m){ const isV=m.includes(".mp4"); await sock.sendMessage(from,{[isV?"video":"image"]:{url:m},caption:"📸 Instagram"}); } else await sock.sendMessage(from,{text:"❌ Could not fetch."}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"facebook", aliases:["fb"], async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .fb URL"}); try{ const {facebook}=require("@bochilteam/scraper"); const r=await facebook(args[0]); const v=r.hd||r.sd||r.video; if(v) await sock.sendMessage(from,{video:{url:v},caption:"📘 Facebook"}); else await sock.sendMessage(from,{text:"❌ Could not fetch."}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"twitter", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .twitter URL"}); try{ const {twitter}=require("@bochilteam/scraper"); const r=await twitter(args[0]); const v=r.hd||r.sd||r.video; if(v) await sock.sendMessage(from,{video:{url:v},caption:"🐦 Twitter"}); else await sock.sendMessage(from,{text:"❌ Could not fetch."}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"ytaudio", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ytaudio query"}); try{ const ytSearch=require("yt-search"); const ytdl=global.ytdl; const s=await ytSearch(args.join(" ")); if(!s.videos.length) return sock.sendMessage(from,{text:"❌ No results."}); const v=s.videos[0]; const stream=ytdl(v.url,{filter:"audioonly",quality:"lowest"}); await sock.sendMessage(from,{audio:stream,mimetype:"audio/mpeg",fileName:v.title+".mp3",caption:"🎵 "+v.title}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"ytvideo", async execute(sock,from,args){ if(!args.length) return sock.sendMessage(from,{text:"❌ .ytvideo query"}); try{ const ytSearch=require("yt-search"); const ytdl=global.ytdl; const s=await ytSearch(args.join(" ")); if(!s.videos.length) return sock.sendMessage(from,{text:"❌ No results."}); const v=s.videos[0]; const stream=ytdl(v.url,{quality:"lowest",filter:"audioandvideo"}); await sock.sendMessage(from,{video:stream,caption:"🎬 "+v.title}); }catch(e){ await sock.sendMessage(from,{text:"❌ "+e.message}); } } },
    { name:"play", async execute(sock,from,args,msg,extra={}){ const y=(extra.commands||{}).ytaudio; if(y) return y.execute(sock,from,args,msg,extra); await sock.sendMessage(from,{text:"❌ ytaudio unavailable."}); } },

    // ── ADMIN (group-admin gated) ──
    { name:"promote", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||from; if(!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"promote"); await sock.sendMessage(from,{text:"✅ "+t+" promoted!"}); } },
    { name:"demote", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||from; if(!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"demote"); await sock.sendMessage(from,{text:"✅ "+t+" demoted!"}); } },
    { name:"kick", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||from; if(!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const t=extractTarget(args,msg); if(!t) return sock.sendMessage(from,{text:"❌ Mention a user."}); await sock.groupParticipantsUpdate(from,[t],"remove"); await sock.sendMessage(from,{text:"✅ "+t+" kicked!"}); } },
    { name:"tagall", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||from; if(!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const meta=await sock.groupMetadata(from); let text="📢 *Attention Everyone!*\n\n"; const mentions=meta.participants.map(p=>p.id); meta.participants.forEach(p=>{text+="@"+p.id.split("@")[0]+" ";}); await sock.sendMessage(from,{text,mentions}); } },
    { name:"hidetag", async execute(sock,from,args,msg){ if(!from.endsWith("@g.us")) return sock.sendMessage(from,{text:"❌ Group only."}); const sender=msg.key.participant||from; if(!(await isAdmin(sock,from,sender))) return sock.sendMessage(from,{text:"❌ Admin only."}); const meta=await sock.groupMetadata(from); const mentions=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:args.join(" ")||" ",mentions}); } },

    // ── SETTINGS (owner-only) ──
    { name:"setprefix", async execute(sock,from,args,msg){ if(!isOwner(msg.key.participant||from)) return sock.sendMessage(from,{text:"❌ Owner only."}); if(!args.length) return sock.sendMessage(from,{text:"❌ .setprefix ."}); state.prefix=args[0]; await sock.sendMessage(from,{text:"✅ Prefix set to: "+args[0]}); } },
    { name:"mode", async execute(sock,from,args,msg){ if(!isOwner(msg.key.participant||from)) return sock.sendMessage(from,{text:"❌ Owner only."}); if(!args.length) return sock.sendMessage(from,{text:"❌ .mode public/private"}); state.mode=args[0].toLowerCase(); await sock.sendMessage(from,{text:"✅ Mode set to: "+state.mode}); } },
    { name:"setbotname", async execute(sock,from,args,msg){ if(!isOwner(msg.key.participant||from)) return sock.sendMessage(from,{text:"❌ Owner only."}); if(!args.length) return sock.sendMessage(from,{text:"❌ .setbotname New Name"}); state.botName=args.join(" "); await sock.sendMessage(from,{text:"✅ Bot name set to: "+state.botName}); } },
    { name:"restart", async execute(sock,from,args,msg){ if(!isOwner(msg.key.participant||from)) return sock.sendMessage(from,{text:"❌ Owner only."}); await sock.sendMessage(from,{text:"♻️ Restarting bot..."}); setTimeout(()=>process.exit(0),2000); } },

    // ── PROFILE (owner-only where sensitive) ──
    { name:"getpp", async execute(sock,from,args){ const jid=args[0]?.match(/@?(\d+)/)?.[1]?args[0].match(/@?(\d+)/)[1]+"@s.whatsapp.net":from; try{ const pp=await sock.profilePictureUrl(jid,"image"); await sock.sendMessage(from,{image:{url:pp},caption:"Profile Picture"}); }catch(e){ await sock.sendMessage(from,{text:"❌ No profile picture."}); } } },
    // ── COMPLETED cut-off line ──
    { name:"setpp", async execute(sock,from
