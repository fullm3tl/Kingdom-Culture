# Kingdom Kulture – Myth or Truth

Host URL:   https://YOUR-APP.onrender.com/?key=YOUR_SECRET
Guest URL:  https://YOUR-APP.onrender.com/   (the host screen shows it as a QR code)

## Deploy free on Render
1. Create a free GitHub account, make a new repository, and upload all files from this folder (keep the `public` folder).
2. On render.com: New > Web Service > connect that repo.
3. Settings: Runtime = Node, Build Command = (leave blank), Start Command = `node server.js`, Instance Type = Free.
4. Add an Environment Variable: HOST_KEY = a secret word only you know.
5. Deploy, then open the host URL above.

## Notes
- Free Render services sleep after ~15 min idle; the first load can take ~50 seconds. Open the host URL a few minutes before the event.
- Game state lives in memory, so a restart clears the current round. Run only one instance.
- Edit questions, answers and verses at the top of `server.js` (M = Myth, T = Truth).
- Test locally: `node server.js`, then open http://localhost:3000/?key=kingdom
