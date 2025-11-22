import { useState, useRef } from "react";
import './SessionPage.css';
const SessionPage = () => {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true)
    const [showAskModal, setShowAskModal] = useState(false);
    const [question, setQuestion] = useState("");

    const [submittedElements, setSubmittedElements] = useState<Array<{ id: number; type: string; content: string; submitTime: string; x?: number; y?: number }>>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const submitQuestion = () => {
        const trimmed = question.trim();
        if (!trimmed) {
            // simple client-side validation
            alert("Please type a question before submitting.");
            return;
        }
        // Replace this with real submit logic later
        alert(`Question submitted: ${trimmed}`);

        /* generate session element with attributes to be used in backend:
            	- icon type
                - element id
                - instantiation time
                - end time
                - position
                - object created on submit
        */
        const id = submittedElements.length;
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
        setSubmittedElements((s) => [...s, { id, type: "question", content: trimmed, submitTime: date.toISOString(), x: left, y: top }]);

        setQuestion("");
        setShowAskModal(false);
        setVisible(false);
    };

    const cancelAsk = () => {
        setQuestion("");
        setShowAskModal(false);
    };

    return (
        <div className="session-page" ref={containerRef}>

            {visible && (<main className="content">
                <h1>Welcome to the Session!</h1>
                <p>It's pretty quiet in here...press the "+" button in the bottom right to get started!</p>
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
                            alert("Comment clicked");
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
                {submittedElements.map((f, idx) => (
                    <button
                        key={f.id}
                        className="fab-element"
                        title={`${f.type}: ${f.content}`}
                        aria-label={`submitted-${f.type}-${idx}`}
                        style={{ left: f.x != null ? `${f.x}px` : undefined, top: f.y != null ? `${f.y}px` : undefined }}
                    >
                        <span className="circle small">?</span>
                    </button>
                ))}
            </div>

            {showAskModal && (
                <div
                    className= {`modal-overlay ${showAskModal ? "visible" : ""}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ask a question dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelAsk();
                    }}
                >
                    <div className={`modal ${showAskModal ? "visible": ""}`}>
                        <h2>Ask a Question</h2>
                        <label htmlFor="question-input" className="visually-hidden">Type your question</label>
                        <textarea
                            id="question-input"
                            className="question-input"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question here..."
                            rows={6}

                        />

                        <div className="modal-buttons">
                            <button className="btn btn-primary" onClick={submitQuestion}>Submit</button>
                            <button className="btn btn-secondary" onClick={cancelAsk}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default SessionPage;