import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import './SessionPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type SessionData = {
    sessionCode: string;
    title: string;
    description: string;
    mode: string;
    hostStartTime: string;
    actions: Array<{
        id: string;
        actionID: number;
        type: string;
        content: string;
        start_time: string;
        size?: number;
        color?: string;
    }>;
};

const SessionPage = () => {
    const { sessionCode } = useParams<{ sessionCode: string }>();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true)
    const [showAskModal, setShowAskModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string>("");

    const [submittedElements, setSubmittedElements] = useState<Array<{ id: string; actionID: number; type: string; content: string; submitTime: string; x?: number; y?: number; size?: number; color?: string }>>([]);
    const [maxActionID, setMaxActionID] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Function to fetch actions with times
    const getActionsWithTimes = useCallback(async () => {
        if (!sessionCode) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}/actions/times`);
            if (!response.ok) {
                console.error("Failed to fetch actions with times");
                return;
            }

            const data = await response.json();
            console.log("Actions with times:", data);
            // You can process the data here if needed
        } catch (error) {
            console.error("Error fetching actions with times:", error);
        }
    }, [sessionCode]);

    // Load session data on mount
    useEffect(() => {
        const loadSession = async () => {
            if (!sessionCode) {
                setLoadError("Session code is missing");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setLoadError("Session not found");
                    } else {
                        setLoadError("Failed to load session");
                    }
                    setIsLoading(false);
                    return;
                }

                const data: SessionData = await response.json();
                setSessionData(data);

                // Load existing actions and convert to display format
                if (data.actions && data.actions.length > 0) {
                    // Find the maximum actionID from loaded actions
                    const maxID = Math.max(...data.actions.map(a => a.actionID || 0), 0);
                    setMaxActionID(maxID);

                    const elements = data.actions.map((action) => {
                        // Generate random positions for existing actions
                        const elemSize = 48;
                        const gap = 8;
                        const rect = containerRef.current?.getBoundingClientRect();
                        const containerWidth = rect ? rect.width : window.innerWidth;
                        const containerHeight = rect ? rect.height : window.innerHeight;
                        const maxLeft = Math.max(0, containerWidth - elemSize - 8);
                        const maxTop = Math.max(0, containerHeight - elemSize - 8);

                        return {
                            id: action.id,
                            actionID: action.actionID,
                            type: action.type,
                            content: action.content,
                            submitTime: action.start_time,
                            x: Math.floor(Math.random() * (maxLeft + 1)),
                            y: Math.floor(Math.random() * (maxTop + 1)),
                            size: action.size,
                            color: action.color,
                        };
                    });
                    setSubmittedElements(elements);
                    setVisible(false);
                } else {
                    setMaxActionID(0);
                }
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load session");
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, [sessionCode]);

    // Poll for actions with times every 5 seconds
    useEffect(() => {
        if (!sessionCode) return;

        const interval = setInterval(() => {
            getActionsWithTimes();
        }, 5000); // 5 seconds

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [sessionCode, getActionsWithTimes]);

    const submitElement = async (type: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
            // simple client-side validation
            alert("Please type a response before submitting.");
            return;
        }

        if (!sessionCode) {
            alert("Session code is missing. Please check the URL.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate numeric actionID on frontend (1-based, incrementing)
            // Use the max actionID from loaded session data + 1, or start at 1 if no actions
            const actionID = maxActionID + 1;

            // Call backend API to add action
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionCode}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    content: trimmed,
                    actionID: actionID,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to submit' }));
                throw new Error(errorData.message || 'Failed to submit');
            }

            const data = await response.json();

            // Success - add to local state for display
            // Use the UUID and actionID from backend response
            const backendActionID = data.action?.actionID || actionID;
            const id = data.action?.id || `temp-${backendActionID}`;
            const date = new Date();

            // compute a random non-overlapping position inside the session container
            const elemSize = 48; // px (matches CSS .fab-element size)
            const gap = 8; // px minimum gap between fabs
            const rect = containerRef.current?.getBoundingClientRect();
            const containerWidth = rect ? rect.width : window.innerWidth;
            const containerHeight = rect ? rect.height : window.innerHeight;

            const maxLeft = Math.max(0, containerWidth - elemSize - 8);
            const maxTop = Math.max(0, containerHeight - elemSize - 8);

            const overlaps = (x: number, y: number) => {
                for (const e of submittedElements) {
                    if (e.x == null || e.y == null) continue;
                    const ax1 = x - gap;
                    const ay1 = y - gap;
                    const ax2 = x + elemSize + gap;
                    const ay2 = y + elemSize + gap;

                    const bx1 = e.x - gap;
                    const by1 = e.y - gap;
                    const bx2 = e.x + elemSize + gap;
                    const by2 = e.y + elemSize + gap;

                    const noOverlap = ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2;
                    if (!noOverlap) return true;
                }
                return false;
            };

            let left = Math.floor(Math.random() * (maxLeft + 1));
            let top = Math.floor(Math.random() * (maxTop + 1));
            let attempts = 0;
            const maxAttempts = 60;
            while (overlaps(left, top) && attempts < maxAttempts) {
                left = Math.floor(Math.random() * (maxLeft + 1));
                top = Math.floor(Math.random() * (maxTop + 1));
                attempts++;
            }

            // store position (even if overlapping after attempts)
            setSubmittedElements((s) => [...s, { 
                id, 
                actionID: backendActionID, 
                type: type, 
                content: trimmed, 
                submitTime: date.toISOString(), 
                x: left, 
                y: top,
                size: data.action?.size,
                color: data.action?.color,
            }]);
            
            // Update maxActionID for next submission
            setMaxActionID(backendActionID);

            setInput("");
            if(type == "question") setShowAskModal(false);
            if(type == "comment" ) setShowCommentModal(false)
            setVisible(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelInput = () => {
        setInput("");
        setShowAskModal(false);
        setShowCommentModal(false);
    };

    if (isLoading) {
        return (
            <div className="session-page" ref={containerRef}>
                <main className="content">
                    <h1>Loading session...</h1>
                </main>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="session-page" ref={containerRef}>
                <main className="content">
                    <h1>Error</h1>
                    <p>{loadError}</p>
                </main>
            </div>
        );
    }

    return (
        <div className="session-page" ref={containerRef}>

            {visible && (<main aria-label="initial text" className="content">
                <h1>{sessionData?.title || "Welcome to the Session!"}</h1>
                <p>{sessionData?.description || "It's pretty quiet in here...press the \"+\" button in the bottom right to get started!"}</p>
            </main>)}

            <div
                className="fab-container"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen((s) => !s);
                    }
                }}
            >
                <div className={`fab-options ${open ? "show" : ""}`}>
                    <button
                        className="fab-option"
                        onClick={() => {
                            setOpen(false);
                            setShowAskModal(true);
                        }}
                    >
                        <span className="label">Ask</span>
                        <span className="circle small">?</span>
                    </button>

                    <button
                        className="fab-option"
                        onClick={() => {
                            setOpen(false);
                            setShowCommentModal(true);
                        }}
                    >
                        <span className="label">Comment</span>
                        <span className="circle small">✎</span>
                    </button>
                </div>

                <button
                    className={`fab-main ${open ? "active" : ""}`}
                    aria-expanded={open}
                    aria-label="Open actions"
                    onClick={() => setOpen((s) => !s)}
                >
                    <span className="plus">+</span>
                </button>
            </div>

            {/* Generated fabs appended for each submitted question */}
            <div className="generated-fabs" aria-live="polite">
                {submittedElements.map((f) => (
                    <button
                        key={f.id}
                        className="fab-element"
                        title={`${f.content}`}
                        aria-label={`submitted-${f.type}-${f.actionID}`}
                        style={{ 
                            left: f.x != null ? `${f.x}px` : undefined, 
                            top: f.y != null ? `${f.y}px` : undefined,
                            width: f.size != null ? `${f.size}px` : undefined,
                            height: f.size != null ? `${f.size}px` : undefined,
                            backgroundColor: f.color || undefined,
                        }}
                        id={String(f.actionID)}
                    >
                        {f.type == "question" ? <span className="circle small">?</span> : <span className="circle small">🗩</span>}
                    </button>
                ))}
            </div>
                <div
                    className= {`modal-overlay ${showAskModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ask a question dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelInput();
                    }}
                >
                    <div className={`modal ${showAskModal ? "visible": ""} `}>
                        <h2>Ask a Question</h2>
                        <label htmlFor="question-input" className="visually-hidden">Type your question</label>
                        <textarea
                            id="question-input"
                            className="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question here..."
                            rows={6}

                        />

                        <div className="modal-buttons">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {submitElement("question")}}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={cancelInput}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>    

                <div
                    className= {`modal-overlay ${showCommentModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Leave a comment dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelInput();
                    }}
                >

                    <div className={`modal ${showCommentModal ? "visible": ""}`}>
                        <h2>Leave a Comment</h2>
                        <label htmlFor="comment-input" className="visually-hidden">Type your comment</label>
                        <textarea
                            id="comment-input"
                            className="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your comment here..."
                            rows={6}

                        />

                        <div className="modal-buttons">
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {submitElement("comment")}}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={cancelInput}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                </div>
                
        
        </div>
    );
}
export default SessionPage;