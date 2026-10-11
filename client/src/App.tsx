import { useCallback, useEffect, useState } from "react";
import type { ChatUser } from "./types";
import { createSession, fetchConfig } from "./api";
import { initChat, loginWithToken, logout } from "./cometchat";
import LoginScreen from "./components/LoginScreen";
import ChatShell from "./components/ChatShell";

type Phase =
  | { kind: "booting" }
  | { kind: "login" }
  | { kind: "ready"; user: ChatUser }
  | { kind: "fatal"; message: string };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: "booting" });

  // 1) Ask our server for App ID/Region  2) init CometChat  3) resume session if any
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchConfig();
        const existing = await initChat(cfg);
        if (cancelled) return;
        setPhase(existing ? { kind: "ready", user: existing } : { kind: "login" });
      } catch (e) {
        if (!cancelled) setPhase({ kind: "fatal", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = useCallback(async (name: string) => {
    const session = await createSession(name); // server mints the Auth Token
    const user = await loginWithToken(session.authToken); // real CometChat login
    setPhase({ kind: "ready", user });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      setPhase({ kind: "login" });
    }
  }, []);

  if (phase.kind === "booting") return <div className="center-screen"><div className="spinner" aria-label="Loading" /></div>;
  if (phase.kind === "fatal")
    return (
      <div className="center-screen">
        <div className="card">
          <h1>Setup problem</h1>
          <p className="muted">{phase.message}</p>
          <p className="muted small">See the README, "Troubleshooting" section.</p>
        </div>
      </div>
    );
  if (phase.kind === "login") return <LoginScreen onSignIn={handleSignIn} />;
  return <ChatShell user={phase.user} onLogout={handleLogout} />;
}
