import { useState } from "react";
import './SessionPage.css';
const SessionPage = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="session-page">

            <main className="content">
                <h1>Welcome to the Session!</h1>
                <p>It's pretty quiet in here...press the "+" button in the bottom right to get started!</p>
            </main>

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
                            alert("Ask clicked");
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
        </div>
    );
}
export default SessionPage;