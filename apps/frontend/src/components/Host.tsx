import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import "./Host.css";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

type CopyState = "idle" | "copied" | "error";
type SessionMode = "normal" | "colorShift" | "sizePulse";
type SubmitState = "idle" | "loading" | "success" | "error";

const MIN_TITLE_LENGTH = 3;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Calls the backend API to generate a unique session code and save session data
 * @param title - The session title
 * @param description - The session description (optional)
 * @param sessionType - The session type/mode
 * @returns The generated session code
 * @throws Error if the API call fails
 */
const generateSessionCode = async (
  title: string,
  description: string,
  sessionType: string
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/session/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      sessionType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to generate session code' }));
    throw new Error(errorData.message || 'Failed to generate session code');
  }

  const data = await response.json();
  return data.code;
};

type ModePreviewProps = {
  mode: SessionMode;
};

const ModePreview = ({ mode }: ModePreviewProps) => {
  return (
    <div
      className={`mode-preview mode-preview-${mode}`}
      aria-hidden="true"
    >
      <div className="mode-preview-shape" />
    </div>
  );
};

const Host = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [mode, setMode] = useState<SessionMode>("normal");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [titleTouched, setTitleTouched] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [codeHighlight, setCodeHighlight] = useState<boolean>(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const sessionCodeRef = useRef<HTMLDivElement>(null);
  const descriptionTextareaRef = useAutoResizeTextarea(description, 200);
  const navigate = useNavigate();

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

  const canSubmit =
    isValid && submitState !== "loading" && submitState !== "success";

  const handleInvalidSubmit = useCallback(() => {
    if (titleError && titleInputRef.current) {
      titleInputRef.current.focus();
      setTitleTouched(true);
    }
  }, [titleError]);

  useEffect(() => {
    if (!title.trim() && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [title]);

  const modeDescriptions: Record<SessionMode, string> = {
    normal: "Elements remain static.",
    colorShift: "Forum items gradually change hue over time.",
    sizePulse: "Forum items gently grow and shrink over time.",
  };

  const runSubmit = useCallback(async () => {
    setCopyState("idle");
    setErrorMessage("");
    setSubmitState("loading");

    try {
      const code = await generateSessionCode(title.trim(), description.trim(), mode);
      setSessionCode(code);
      setSubmitState("success");
      setShowToast(true);
      setCodeHighlight(true);

      console.log("Session created:", { code, mode, title, description });

      setTimeout(() => {
        sessionCodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);

      setTimeout(() => {
        setSubmitState("idle");
      }, 2000);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setTimeout(() => {
        setCodeHighlight(false);
      }, 600);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not create session. Please try again.");
      setTimeout(() => {
        setErrorMessage("");
        setSubmitState("idle");
      }, 5000);
    }
  }, [description, mode, title]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValid) {
      handleInvalidSubmit();
      return;
    }

    if (!canSubmit) {
      return;
    }

    runSubmit();
  };

  const handleFormKeyDown = (
    e: React.KeyboardEvent<HTMLFormElement>,
  ) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;
    const tagName = target.tagName;

    if (tagName === "BUTTON" || tagName === "A") {
      return;
    }

    e.preventDefault();

    if (!isValid) {
      handleInvalidSubmit();
      return;
    }

    if (!canSubmit) {
      return;
    }

    runSubmit();
  };

  const handleRetry = async () => {
    if (!canSubmit) return;
    setErrorMessage("");
    setSubmitState("loading");

    try {
      const code = await generateSessionCode(title.trim(), description.trim(), mode);
      setSessionCode(code);
      setSubmitState("success");
      setShowToast(true);
      setCodeHighlight(true);

      setTimeout(() => {
        sessionCodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);

      setTimeout(() => {
        setSubmitState("idle");
      }, 2000);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setTimeout(() => {
        setCodeHighlight(false);
      }, 600);
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not create session. Please try again.");
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

  const handleGoToSession = () => {
    if (!sessionCode) return;
    // TODO integrate actual routing logic if session pages are handled elsewhere
    navigate(`/forum/${sessionCode}`);
  };

  return (
    <main className="host-page">
      <div className="host-container">
        <header className="host-header">
          <h1 className="host-title">Host a Forum</h1>
          <p className="host-subtitle">
            Create a new forum session and share the code with others.
          </p>
        </header>

        <section
          className="host-card"
          role="region"
          aria-labelledby="hostFormTitle"
        >
          <h2 id="hostFormTitle" className="sr-only">
            Create forum session
          </h2>

          {errorMessage && (
            <div
              className="error-banner"
              role="alert"
              aria-live="assertive"
            >
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

          <form
            className="host-form"
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            noValidate
            aria-label="Host forum session form"
          >
            <div className="form-field">
              <label htmlFor="forumTitle">Forum title</label>
              <input
                ref={titleInputRef}
                id="forumTitle"
                name="forumTitle"
                type="text"
                placeholder="For example Weekly standup"
                required
                value={title}
                onChange={handleTitleChange}
                onBlur={() => setTitleTouched(true)}
                aria-required="true"
                aria-invalid={shouldShowError}
                aria-describedby={
                  shouldShowError ? "title-error" : "title-help"
                }
                className={shouldShowError ? "input-error" : ""}
              />
              {!shouldShowError && (
                <span
                  id="title-help"
                  className="sr-only"
                >
                  Enter a short descriptive name for this forum.
                </span>
              )}
              {shouldShowError && (
                <span
                  id="title-error"
                  className="field-error"
                  role="alert"
                >
                  {titleError}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="forumDescription">Description optional</label>
              <textarea
                ref={descriptionTextareaRef}
                id="forumDescription"
                name="forumDescription"
                placeholder="Brief context for participants"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="auto-resize-textarea"
                aria-label="Forum description optional"
                aria-describedby="description-help"
              />
              <span
                id="description-help"
                className="sr-only"
              >
                You can add a short summary or leave this blank.
              </span>
            </div>

            <div className="session-settings">
              <h3 className="settings-title">Session settings</h3>
              <p className="settings-intro">
                This controls how forum elements behave as time progresses
                during a session.
              </p>

              <div className="settings-group">
                <label className="settings-label">Mode</label>
                <div
                  className="radio-group"
                  role="radiogroup"
                  aria-label="Session mode"
                >
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="normal"
                      checked={mode === "normal"}
                      onChange={(e) =>
                        setMode(e.target.value as SessionMode)
                      }
                      aria-label="Normal mode elements remain static"
                    />
                    <span>Normal</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="colorShift"
                      checked={mode === "colorShift"}
                      onChange={(e) =>
                        setMode(e.target.value as SessionMode)
                      }
                      aria-label="Color shift mode forum items gradually change hue over time"
                    />
                    <span>Color Shift</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mode"
                      value="sizePulse"
                      checked={mode === "sizePulse"}
                      onChange={(e) =>
                        setMode(e.target.value as SessionMode)
                      }
                      aria-label="Size pulse mode forum items gently grow and shrink over time"
                    />
                    <span>Size Pulse</span>
                  </label>
                </div>
                <p className="mode-description">
                  {modeDescriptions[mode]}
                </p>
                <ModePreview mode={mode} />
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-host ${
                submitState === "success" ? "btn-success" : ""
              }`}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              aria-busy={submitState === "loading"}
            >
              {submitState === "loading" && (
                <span className="spinner" aria-hidden="true" />
              )}
              <span className="btn-text">
                {submitState === "loading"
                  ? "Creating..."
                  : submitState === "success"
                  ? "Session created"
                  : "Create session"}
              </span>
            </button>
          </form>

          {sessionCode && (
            <div
              ref={sessionCodeRef}
              className={`host-success ${
                codeHighlight ? "host-success-highlight" : ""
              }`}
              role="status"
              aria-live="polite"
              aria-label={`Session created with code ${sessionCode}`}
            >
              <div className="code-display">
                <span className="code-label">Session code</span>
                <span
                  className={`code-value ${
                    codeHighlight ? "code-value-pulse" : ""
                  }`}
                  aria-label={`Session code ${sessionCode}`}
                >
                  {sessionCode}
                </span>
              </div>
              <p className="code-help">
                Share this code with participants so they can join your
                forum.
              </p>
              <button
                type="button"
                className={`btn btn-host copy-btn ${
                  copyState === "copied" ? "copy-success" : ""
                }`}
                onClick={handleCopy}
                aria-label={`Copy session code ${sessionCode}`}
              >
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "error"
                  ? "Copy failed"
                  : "Copy code"}
              </button>
              <button
                type="button"
                className="btn btn-secondary go-session-btn"
                onClick={handleGoToSession}
                aria-label="Go to this session"
              >
                Go to session
              </button>
            </div>
          )}
        </section>
      </div>

      {showToast && (
        <div className="host-toast-wrapper" aria-live="polite">
          <div className="host-toast" role="status">
            Your forum is ready
          </div>
        </div>
      )}
    </main>
  );
};

export default Host;
