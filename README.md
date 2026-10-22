# werewoof

Play werewolf with everyone on their own phone. One person is the Game Master (GM); the rest join with a room code or QR. Hosted entirely on GitHub Pages, no server.

## How it works

- **Static app** deployed to GitHub Pages by `.github/workflows/deploy.yml`.
- **Peer-to-peer:** the GM's browser is the host (PeerJS/WebRTC). The GM sends each player only their own view: role, tokens, phase, public player list, messages, own submissions. Notes and other players' roles never leave the GM's device.
- **Event log, not a rules engine:** every GM action is an appended event. Undo adds a void event, so anything can be undone or restored from the Timeline. Phases, roles and tokens are free text from JSON presets (`src/domain/presets`), so the app never enforces game mechanics.
- **Resilient:** the GM's game is saved in `localStorage` and the room code is reclaimed after a refresh. Players keep a seat token and reconnect automatically.

## Play

1. GM opens the site, taps **Host a game**, shares the room code, QR or link.
2. Players tap **Join a game**, enter the code and a name.
3. GM applies a preset, deals roles (or assigns them by hand), then runs the game with the Phase, Night, Inbox, Players, Notes and Timeline tabs.
4. Players hold their role card to reveal it, check tokens and phase, and send votes or actions that the GM approves.

The GM must keep the host tab open. If it closes, reopen `/host` to resume.

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run lint
npm run build
```

## Deploy

1. Repo **Settings > Pages > Source**: GitHub Actions (`npm run deploy` tries to set this for you).
2. Run `npm run deploy` from `main`: it pushes (or re-runs the workflow if already pushed), waits for the build and prints the site URL. Pushing to `main` also deploys on its own.

If the repo is renamed, update the `/werewoof/` base path in `vite.config.ts`.

## Networking notes

PeerJS's free public broker and its default STUN/TURN servers are used. Strict mobile or corporate networks may need your own TURN server; set `VITE_TURN_URL`, `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL` at build time.