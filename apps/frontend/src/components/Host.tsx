import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Landing.css";
import "./Host.css";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

type CopyState = "idle" | "copied" | "error";
type SessionMode = "normal" | "focus" | "casual";
type SessionSize = "small" | "medium" | "large";
type SessionColor = "blue" | "green" | "purple" | "orange" | "red" | "slate";
type SubmitState = "idle" | "loading" | "success" | "error";

const generateSessionCode = (length: number = 6): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

const MIN_TITLE_LENGTH = 3;

const Host = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [mode, setMode] = useState<SessionMode>("normal");
  const [size, setSize] = useState<SessionSize>("medium");
  const [color, setColor] = useState<SessionColor>("slate");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [titleTouched, setTitleTouched] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sessionCodeRef = useRef<HTMLDivElement>(null);
  const descriptionTextareaRef = useAutoResizeTextarea(description, 200);

  // Validation logic
  const titleError = useMemo(() => {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return "Title is required";
    }
    if (trimmed.length < MIN_TITLE_LENGTH) {
      return "Title must be at least 3 characters";
    }
    return null;
  }, [title]);

  const isValid = useMemo(() => titleError === null, [titleError]);
  const shouldShowError = titleTouched && titleError !== null;

  // Auto-focus first invalid field on submit attempt
  const handleInvalidSubmit = useCallback(() => {
    if (titleError && titleInputRef.current) {
      titleInputRef.current.focus();
      setTitleTouched(true);
    }
  }, [titleError]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCopyState("idle");
    setErrorMessage("");
    
    if (!isValid) {
      handleInvalidSubmit();
      return;
    }

    setSubmitState("loading");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate potential API error (uncomment to test error state)
      // if (Math.random() > 0.8) {
      //   throw new Error("API Error");
      // }

    const code = generateSessionCode(6);
    setSessionCode(code);
      setSubmitState("success");
      
      // TODO: Send settings (mode, size, color) to backend when creating session
      console.log("Session settings:", { mode, size, color, title, description });

      // Auto-scroll to session code after animation
      setTimeout(() => {
        sessionCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);

      // Reset submit state after showing success
      setTimeout(() => setSubmitState("idle"), 2000);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage("Could not create session. Please try again.");
      // Reset error after 5 seconds
      setTimeout(() => {
        setErrorMessage("");
        setSubmitState("idle");
      }, 5000);
    }
  };

  const handleRetry = async () => {
    setErrorMessage("");
    setSubmitState("loading");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const code = generateSessionCode(6);
      setSessionCode(code);
      setSubmitState("success");

      // Auto-scroll to session code after animation
      setTimeout(() => {
        sessionCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);

      // Reset submit state after showing success
      setTimeout(() => setSubmitState("idle"), 2000);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage("Could not create session. Please try again.");
      setTimeout(() => {
        setErrorMessage("");
        setSubmitState("idle");
      }, 5000);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!sessionCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sessionCode);
        setCopyState("copied");
      } else {
        const ok = window.prompt("Copy this code:", sessionCode);
        setCopyState(ok === null ? "error" : "copied");
      }
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1500);
    }
  }, [sessionCode]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!titleTouched) {
      setTitleTouched(true);
    }
  };

  const handleColorKeyDown = (
    e: React.KeyboardEvent<HTMLLabelElement>,
    value: SessionColor
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setColor(value);
    }
  };

  return (
    <main className="host-page">
      <div className="host-container">
        <header className="host-header">
          <h1 className="host-title">Host a Forum</h1>
          <p className="host-subtitle">Create a session and share the code with others.</p>
        </header>

        <section className="host-card" role="region" aria-labelledby="hostFormTitle">
          <h2 id="hostFormTitle" className="sr-only">Create forum session</h2>
          
          {errorMessage && (
            <div className="error-banner" role="alert" aria-live="assertive">
              <span className="error-message">{errorMessage}</span>
              <button
                type="button"
                className="error-retry"
                onClick={handleRetry}
                aria-label="Retry creating session"
              >
                Retry
              </button>
            </div>
          )}

          <form className="host-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="forumTitle">Forum title</label>
              <input
                ref={titleInputRef}
                id="forumTitle"
                name="forumTitle"
                type="text"
                placeholder="e.g., Weekly Standup"
                required
                value={title}
                onChange={handleTitleChange}
                onBlur={() => setTitleTouched(true)}
                aria-invalid={shouldShowError}
                aria-describedby={shouldShowError ? "title-error" : undefined}
                className={shouldShowError ? "input-error" : ""}
              />
              {shouldShowError && (
                <span id="title-error" className="field-error" role="alert">
                  {titleError}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="forumDescription">Description (optional)</label>
              <textarea
                ref={descriptionTextareaRef}
                id="forumDescription"
                name="forumDescription"
                placeholder="Brief context for participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="auto-resize-textarea"
              />
            </div>

            <div className="session-settings">
              <h3 className="settings-title">Session Settings</h3>
              
              <div className="settings-group">
                <label className="settings-label">Mode</label>
                <div className="radio-group" role="radiogroup" aria-label="Session mode">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="normal"
                      checked={mode === "normal"}
                      onChange={(e) => setMode(e.target.value as SessionMode)}
                      aria-label="Normal mode"
                    />
                    <span>Normal</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="focus"
                      checked={mode === "focus"}
                      onChange={(e) => setMode(e.target.value as SessionMode)}
                      aria-label="Focus mode"
                    />
                    <span>Focus</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="casual"
                      checked={mode === "casual"}
                      onChange={(e) => setMode(e.target.value as SessionMode)}
                      aria-label="Casual mode"
                    />
                    <span>Casual</span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <label className="settings-label">Size</label>
                <div className="radio-group" role="radiogroup" aria-label="Session size">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="size"
                      value="small"
                      checked={size === "small"}
                      onChange={(e) => setSize(e.target.value as SessionSize)}
                      aria-label="Small size"
                    />
                    <span>Small</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="size"
                      value="medium"
                      checked={size === "medium"}
                      onChange={(e) => setSize(e.target.value as SessionSize)}
                      aria-label="Medium size"
                    />
                    <span>Medium</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="size"
                      value="large"
                      checked={size === "large"}
                      onChange={(e) => setSize(e.target.value as SessionSize)}
                      aria-label="Large size"
                    />
                    <span>Large</span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <label className="settings-label">Color Theme</label>
                <div className="color-options" role="radiogroup" aria-label="Color theme">
                  {(["blue", "green", "purple", "orange", "red", "slate"] as SessionColor[]).map((colorValue) => (
                    <label
                      key={colorValue}
                      className="color-option"
                      onKeyDown={(e) => handleColorKeyDown(e, colorValue)}
                      tabIndex={0}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={colorValue}
                        checked={color === colorValue}
                        onChange={(e) => setColor(e.target.value as SessionColor)}
                        aria-label={`${colorValue.charAt(0).toUpperCase() + colorValue.slice(1)} color theme`}
                      />
                      <span className={`color-swatch ${colorValue}`} aria-hidden="true">
                        {color === colorValue && (
                          <svg
                            className="color-checkmark"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 9L7 13L15 5"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-host ${submitState === "success" ? "btn-success" : ""}`}
              disabled={!isValid || submitState === "loading" || submitState === "success"}
              aria-disabled={!isValid || submitState === "loading" || submitState === "success"}
              aria-busy={submitState === "loading"}
            >
              {submitState === "loading" && (
                <span className="spinner" aria-hidden="true"></span>
              )}
              <span className="btn-text">
                {submitState === "loading"
                  ? "Creating…"
                  : submitState === "success"
                  ? "Session created!"
                  : "Create session"}
              </span>
            </button>
          </form>

          {sessionCode && (
            <div
              ref={sessionCodeRef}
              className="host-success"
              role="status"
              aria-live="polite"
            >
              <div className="code-display">
                <span className="code-label">Session code</span>
                <span className="code-value" aria-label={`Session code ${sessionCode}`}>
                  {sessionCode}
                </span>
              </div>
              <p className="code-help">
                Share this code with participants so they can join your forum.
              </p>
              <button
                type="button"
                className={`btn btn-host copy-btn ${copyState === "copied" ? "copy-success" : ""}`}
                onClick={handleCopy}
                aria-label={`Copy session code ${sessionCode}`}
              >
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
