import { useState } from "react";
import './SessionPage.css';
const SessionPage = () => {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(true)
    const [showAskModal, setShowAskModal] = useState(false);
    const [question, setQuestion] = useState("");

    const submitQuestion = () => {
        const trimmed = question.trim();
        if (!trimmed) {
            // simple client-side validation
            alert("Please type a question before submitting.");
            return;
        }
        // Replace this with real submit logic later
        alert(`Question submitted: ${trimmed}`);
        setQuestion("");
        setShowAskModal(false);
        newSessionElement("question");
    };

    const cancelAsk = () => {
        setQuestion("");
        setShowAskModal(false);
    };

    const newSessionElement = (type: string) => { 

        setVisible(false);
        /* generate session element with attributes to be used in backend:
            	- icon type? same style icons
                - element id
                - instantiation time
                - end time
                - object created on submit
        */
    }

    return (
        <div className="session-page">

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

            {showAskModal && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Ask a question dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelAsk();
                    }}
                >
                    <div className="modal">
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