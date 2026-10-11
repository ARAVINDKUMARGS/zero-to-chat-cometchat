// DevConnect server
// ----------------------------------------------------------------------------
// Why this exists: the CometChat REST API Key can do ANYTHING in your app, so it
// must never reach the browser. This small server keeps it secret and gives each
// browser a short-lived-by-design "Auth Token" for just that one user.
//
// Flow:  browser --(name)--> POST /api/session --> CometChat REST API
//        browser <--(uid + authToken)--
//        browser logs in with CometChatUIKit.loginWithAuthToken(authToken)
// ----------------------------------------------------------------------------
import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const { COMETCHAT_APP_ID, COMETCHAT_REGION, COMETCHAT_REST_API_KEY } = process.env;
const PORT = Number(process.env.PORT) || 3001;

const missing = ["COMETCHAT_APP_ID", "COMETCHAT_REGION", "COMETCHAT_REST_API_KEY"].filter(
  (k) => !process.env[k] || process.env[k].startsWith("your_")
);
if (missing.length) {
  console.error(
    `\n[DevConnect] Missing server/.env values: ${missing.join(", ")}\n` +
      `Copy server/.env.example to server/.env and fill them in from app.cometchat.com.\n`
  );
  process.exit(1);
}

const BASE = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3`;

// Project channels = CometChat public groups. GUIDs: letters, digits, dashes only.
const PROJECTS = [
  { guid: "devconnect-general", name: "# general", description: "Announcements and hallway chat for all developers" },
  { guid: "devconnect-frontend", name: "# frontend", description: "React, CSS, accessibility and UI help" },
  { guid: "devconnect-backend", name: "# backend", description: "APIs, databases and infrastructure" },
  { guid: "devconnect-code-review", name: "# code-review", description: "Paste a snippet or PR link and get feedback" },
  { guid: "devconnect-hackathon", name: "# hackathon-team", description: "Plan, split tasks and ship the demo" },
];

// ---- tiny CometChat REST helper (the secret key only ever lives here) -------
async function cc(method, route, body) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      apikey: COMETCHAT_REST_API_KEY,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return { ok: res.ok, status: res.status, json };
}

function ccError(label, r) {
  const code = r.json?.error?.code || "UNKNOWN";
  const message = r.json?.error?.message || `HTTP ${r.status}`;
  const err = new Error(`${label}: ${code} - ${message}`);
  err.status = r.status;
  return err;
}

async function ensureGroup(p) {
  const found = await cc("GET", `/groups/${encodeURIComponent(p.guid)}`);
  if (found.ok) return;
  if (found.status !== 404) throw ccError(`check group ${p.guid}`, found);
  const created = await cc("POST", "/groups", {
    guid: p.guid,
    name: p.name,
    type: "public",
    description: p.description,
    tags: ["project"],
  });
  if (!created.ok) throw ccError(`create group ${p.guid}`, created);
  console.log(`[DevConnect] created project group ${p.guid}`);
}

let groupsReady = false;
async function ensureAllGroups() {
  if (groupsReady) return;
  for (const p of PROJECTS) await ensureGroup(p);
  groupsReady = true;
}

async function ensureUser(uid, name) {
  const found = await cc("GET", `/users/${encodeURIComponent(uid)}`);
  if (found.ok) return;
  if (found.status !== 404) throw ccError("check user", found);
  const created = await cc("POST", "/users", { uid, name });
  if (!created.ok) throw ccError("create user", created);
}

async function joinAllProjects(uid) {
  for (const p of PROJECTS) {
    const r = await cc("POST", `/groups/${encodeURIComponent(p.guid)}/members`, {
      participants: [uid],
    });
    // Re-joining returns a per-member error (e.g. ERR_ALREADY_JOINED) - that's fine.
    if (!r.ok) console.warn(`[DevConnect] add ${uid} to ${p.guid}: HTTP ${r.status}`);
  }
}

async function createAuthToken(uid) {
  const r = await cc("POST", `/users/${encodeURIComponent(uid)}/auth_tokens`, {});
  const token = r.json?.data?.authToken;
  if (!r.ok || !token) throw ccError("create auth token", r);
  return token;
}

// ---- helpers ----------------------------------------------------------------
function toUid(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Minimal in-memory rate limit: 20 sign-ins / minute / IP.
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const recent = (hits.get(key) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 20) return res.status(429).json({ error: "Too many attempts. Wait a minute." });
  recent.push(now);
  hits.set(key, recent);
  next();
}

// ---- app --------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: "10kb" }));

// App ID + Region are NOT secret (they ship in every CometChat client). Serving
// them from here means you configure everything in exactly one file.
app.get("/api/config", (_req, res) => {
  res.json({ appId: COMETCHAT_APP_ID, region: COMETCHAT_REGION });
});

app.post("/api/session", rateLimit, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!/^[A-Za-z0-9 _.-]{2,30}$/.test(name)) {
    return res.status(400).json({ error: "Name must be 2-30 characters: letters, numbers, spaces, _ . -" });
  }
  const uid = toUid(name);
  if (uid.length < 2) return res.status(400).json({ error: "Please use at least 2 letters or numbers." });

  try {
    await ensureAllGroups();
    await ensureUser(uid, name);
    await joinAllProjects(uid);
    const authToken = await createAuthToken(uid);
    res.json({ uid, name, authToken });
  } catch (err) {
    console.error("[DevConnect] session error:", err.message);
    // Don't leak internals to the browser.
    res.status(502).json({ error: "Could not start a chat session. Check the server log." });
  }
});

// In production, serve the built React app from the same server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[DevConnect] server listening on http://localhost:${PORT}`);
  // Warm up: create project groups now so the first sign-in is fast.
  ensureAllGroups().catch((e) => console.error("[DevConnect] startup group check failed:", e.message));
});
