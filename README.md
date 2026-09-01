# PRIMACY_SPX_ULTRA — WhatsApp Bot

<p align="center">
  <img src="https://i.imgur.com/C3irQ1X.jpeg" width="200" alt="PRIMACY_SPX_ULTRA logo">
</p>

A modular WhatsApp bot built on Baileys, with a built-in pairing page.
Each deployment pairs to **the deployer's own WhatsApp number** — this
repo does not host or manage pairing for anyone else's number, and no
shared server ever holds a session that isn't yours.

## Deploy your own instance

1. Fork or clone this repository.
2. Deploy to Render, Railway, or any Node.js host (Node 18+).
3. Build command: `npm install`
4. Start command: `node index.js`
5. (Optional) Set these Environment Variables on **your own** hosting
   account:
   - `OWNER_NUMBER` — your WhatsApp number, digits only, with country
     code, e.g. `254712345678`
   - `OWNER_NAME` — how you want to be addressed in bot messages
   - `PREFIX` — command prefix, defaults to `.`
6. Deploy, then open your service's URL in a browser. You'll see the
   pairing page:
   - Enter **your own** WhatsApp number.
   - Tap **Generate Pairing Code**.
   - On your phone: WhatsApp → Settings → Linked Devices → Link with
     phone number → enter the code shown, within 20 seconds.
7. Once connected, the bot sends a success message — including your
   `SESSION_ID` — to your own WhatsApp. Save that `SESSION_ID` as an
   environment variable named `SESSION_ID` on your host so future
   restarts restore your session instead of requiring you to re-pair.

> The pairing page only works once per deployment, before that
> deployment's session is registered. After you've paired, the page
> will show "already paired" — that's expected, and prevents a live
> session from being disrupted by accidental re-pairing attempts.

## Commands

Send `.menu` once your bot is connected to see the full, current list.

## Group protection

Group admins can toggle protection features per group:
`.antilink on`, `.antispam on`, `.antibug on`, `.antigroupmention on`,
`.antitag on`, `.antiimage on`, `.antivideo on`, `.antisticker on`,
`.antibadword on` — replace `on` with `off` to disable, or omit it to
check current status.

## Notes

- This bot requires no shared server and no phone numbers other than
  the one you configure for your own deployment.
- Protection settings and warning counts are stored in `./session/` on
  disk — on free hosting tiers this may reset on redeploy unless a
  persistent disk is configured.
