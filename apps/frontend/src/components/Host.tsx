import { FormEvent, useCallback, useMemo, useState } from "react";
import "./Landing.css";
import "./Host.css";

type CopyState = "idle" | "copied" | "error";

const generateSessionCode = (length: number = 6): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

const Host = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCopyState("idle");
    if (!canSubmit) return;
    // Simulate backend session creation
    const code = generateSessionCode(6);
    setSessionCode(code);
  };

  const handleCopy = useCallback(async () => {
    if (!sessionCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sessionCode);
        setCopyState("copied");
      } else {
        // Simple fallback
        const ok = window.prompt("Copy this code:", sessionCode);
        setCopyState(ok === null ? "error" : "copied");
      }
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  }, [sessionCode]);

  return (
    <main className="host-page">
      <div className="host-container">
        <header className="host-header">
          <h1 className="host-title">Host a Forum</h1>
          <p className="host-subtitle">Create a session and share the code with others.</p>
        </header>

        <section className="host-card" role="region" aria-labelledby="hostFormTitle">
          <h2 id="hostFormTitle" className="sr-only">Create forum session</h2>
          <form className="host-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="forumTitle">Forum title</label>
              <input
                id="forumTitle"
                name="forumTitle"
                type="text"
                placeholder="e.g., Weekly Standup"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="forumDescription">Description (optional)</label>
              <textarea
                id="forumDescription"
                name="forumDescription"
                placeholder="Brief context for participants..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-host" disabled={!canSubmit} aria-disabled={!canSubmit}>
              Create session
            </button>
          </form>

          {sessionCode && (
            <div className="host-success" role="status" aria-live="polite">
              <div className="code-display">
                <span className="code-label">Session code</span>
                <span className="code-value" aria-label={`Session code ${sessionCode}`}>{sessionCode}</span>
              </div>
              <p className="code-help">Share this code with participants so they can join your forum.</p>
              <button type="button" className="btn btn-host copy-btn" onClick={handleCopy}>
                {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy code"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Host;


