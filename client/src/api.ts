// Talks to OUR Express server (never to CometChat's REST API directly).
export type PublicConfig = { appId: string; region: string };
export type Session = { uid: string; name: string; authToken: string };

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchConfig(): Promise<PublicConfig> {
  let res: Response;
  try {
    res = await fetch("/api/config");
  } catch {
    throw new Error("Cannot reach the DevConnect server. Is `npm start` running in the server folder?");
  }
  const data = await readJson(res);
  if (!res.ok || !data?.appId) throw new Error("Server is up but returned no CometChat config. Check server/.env.");
  return data as PublicConfig;
}

export async function createSession(name: string): Promise<Session> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || `Sign-in failed (HTTP ${res.status})`);
  return data as Session;
}
