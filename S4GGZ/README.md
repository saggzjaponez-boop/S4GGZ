S4GGZ — Deploying chat server

This repo contains a static site (published to GitHub Pages) and a small Node.js server that persists chat messages.

Quick deploy (recommended): Render.com
1. Create a free account on https://render.com and connect your GitHub account.
2. Create a new Web Service, select this repository `saggzjaponez-boop/S4GGZ` and the `main` branch.
3. Set the build and start commands (Render autodetects Node). Start command: `npm start`.
4. Add an environment variable if needed; the server stores messages in `data/messages.json` within the service. For persistent storage across redeploys use a managed DB — see notes.
5. After deploy, note your server URL, e.g. `https://s4ggz-chat.onrender.com`.

Point the static client to the server
- Open `config.json` in the repo root and edit `apiBase` to the server API endpoint, e.g.: `https://s4ggz-chat.onrender.com/api/messages`.
- Commit and push the `config.json` change; GitHub Pages will serve it and client will read the value.

Local testing
```bash
npm install
npm start
# open http://localhost:3000/chat/index.html
```

Notes & recommendations
- The server uses a file `data/messages.json` to store messages. On platforms with ephemeral disks this may be lost; for production use a DB (Postgres, Supabase) and I can adapt `server.js` to use it.
- The server enforces a 500MB file size and trims the oldest 100 messages when exceeded.
- If you want automatic deploys to Render via GitHub Actions, I can add a workflow — you'll need a Render API key.
