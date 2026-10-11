# ⚡ DevConnect — Real-Time Developer Collaboration Hub

Project channels, direct messages, live typing indicators and online presence for developer teams, built on **CometChat** for the *Zero to Chat: CometChat Hackathon*.

## What it does

| Feature | How it is built |
| --- | --- |
| Sign in with a developer handle | Express server creates the CometChat user, then issues a per-user **Auth Token** |
| Project channels (`# frontend`, `# backend`, `# code-review`, …) | CometChat **public groups**, created and joined server-side |
| Real-time messaging (channels + 1:1 DMs) | CometChat UI Kit v7: `CometChatMessageList` + `CometChatMessageComposer` |
| Typing indicators | Built into `CometChatMessageHeader` / message list (UI Kit v7) |
| Online / offline presence | `subscribePresenceForAllUsers()` at init + `CometChatUsers` / header status |
| Recent conversations | `CometChatConversations` |
| Responsive layout | Two panes on desktop, one pane at a time on phones |

Nothing is simulated: every message goes through CometChat's servers.

## Architecture (and why there is a server)

```
Browser (React)                 Express server                 CometChat
   │  POST /api/session {name}      │                              │
   ├───────────────────────────────►│  create user (REST API Key)  │
   │                                ├─────────────────────────────►│
   │                                │  add to project groups       │
   │                                │  create Auth Token           │
   │◄───────────────────────────────┤◄─────────────────────────────┤
   │  { uid, authToken }            │
   │  CometChatUIKit.loginWithAuthToken(authToken) ───────────────►│
   │◄════════ real-time messages, typing, presence ═══════════════►│
```

- The **REST API Key** (powerful) lives only in `server/.env`.
- The browser only ever receives App ID + Region (public values) and its own Auth Token.
- The **Auth Key** is never used anywhere in this project.

## Project layout

```
devconnect/
├─ client/   React + Vite + TypeScript UI
├─ server/   Express: users, groups, auth tokens
└─ docs/     GitHub publishing guide + 85-second demo script
```

## Setup (step by step)

### 0. Requirements
Node.js 18 or newer. Check with `node -v`.

### 1. Create your CometChat app
1. Sign up / log in at https://app.cometchat.com
2. Create a new app and pick a **region** (`us`, `eu` or `in`).
3. From the app's dashboard, find your **App ID**, **Region**, and the **REST API Key** (the key with full access — *not* the "Auth Key"). Menu labels can change; look for the credentials / API keys section.

### 2. Start the server (Terminal 1)
```bash
cd server
cp .env.example .env        # Windows PowerShell: copy .env.example .env
# open .env in an editor and fill in the three values
npm install
npm start
```
You should see `server listening on http://localhost:3001`.
If a value is missing the server stops and tells you which one.

### 3. Start the client (Terminal 2)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173

## Test with two users

1. **Window A** (normal browser window): handle `alice` → *Enter DevConnect*.
2. **Window B** (private/incognito window, or another browser): handle `bob`.
3. In both, open **Projects → # general**.
4. In A, type a message and send → it should appear in B without refreshing.
5. In B, start typing (don't send) → A's header should show a typing indicator.
6. Open **People** in A → `bob` should show as online. Close window B → status should change to offline shortly after.
7. In A, **People → bob** → send a direct message → check B's **Direct** tab.
8. On a phone-sized window (or browser dev-tools device mode) confirm one pane at a time with a back button.

> Sign-in is a demo: anyone can claim any handle, and there are no passwords. For real use, put your own login in front of `POST /api/session` and derive the CometChat `uid` from your authenticated user.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Cannot reach the DevConnect server" | Server isn't running. Start it (step 2) and keep it open. |
| Server exits: "Missing server/.env values" | Create `server/.env` from `.env.example` and fill all three values. |
| Sign-in says "Could not start a chat session" | Read the server terminal. Usual causes: wrong App ID, wrong region, or you pasted the **Auth Key** instead of the **REST API Key**. |
| Blank chat area | Make sure you picked a channel; check the browser console for errors. |

## Production build

```bash
npm run build     # builds client/dist
npm start         # Express serves the API and the built client on one port
```
Set `COMETCHAT_APP_ID`, `COMETCHAT_REGION`, `COMETCHAT_REST_API_KEY` as environment variables on your host. Never commit `.env`.

## Tech
React 19, Vite, TypeScript, `@cometchat/chat-uikit-react` v7, Express, Node 18+.
