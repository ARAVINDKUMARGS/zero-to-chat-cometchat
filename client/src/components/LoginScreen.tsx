import { useState } from "react";

export default function LoginScreen({ onSignIn }: { onSignIn: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSignIn(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card login" onSubmit={submit}>
        <div className="brand-mark" aria-hidden>⚡</div>
        <h1>DevConnect</h1>
        <p className="muted">Real-time collaboration for developers. Pick a handle to join your project channels.</p>

        <label htmlFor="handle">Your developer handle</label>
        <input
          id="handle"
          autoFocus
          autoComplete="off"
          placeholder="e.g. ada-lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />

        {error && <div className="error" role="alert">{error}</div>}

        <button type="submit" disabled={busy || name.trim().length < 2}>
          {busy ? "Connecting…" : "Enter DevConnect"}
        </button>
        <p className="muted small">
          Open this page in a second browser (or private window) with a different handle to chat live.
        </p>
      </form>
    </div>
  );
}
