import { useState } from "react";
const SessionPage = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="session-page">

            <main className="content">
                <h1>Session</h1>
                <p>Content goes here. This area scrolls under the fixed top navigation bar.</p>
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

            <style>{`
                .top-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    background: linear-gradient(90deg, #2b6cb0, #4c51bf);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                    z-index: 40;
                }
                .top-nav .brand {
                    font-weight: 700;
                    font-size: 18px;
                }
                .top-nav .nav-links a {
                    color: rgba(255,255,255,0.9);
                    margin-left: 16px;
                    text-decoration: none;
                    font-size: 14px;
                }

                .content {
                    padding: 88px 20px 140px; /* leave space for nav & fab */
                    max-width: 900px;
                    margin: 0 auto;
                }

                /* FAB container */
                .fab-container {
                    position: fixed;
                    right: 24px;
                    bottom: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 12px;
                    z-index: 50;
                }

                .fab-main {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(180deg,#ff7a59,#ff4d6d);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    transition: transform .18s ease, box-shadow .18s ease;
                }
                .fab-main:focus { outline: 2px solid rgba(255,255,255,0.3); }

                .fab-main.active { transform: rotate(45deg); box-shadow: 0 12px 28px rgba(0,0,0,0.28); }

                .fab-options {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                    transform-origin: bottom right;
                    transition: opacity .18s ease, transform .18s ease;
                    opacity: 0;
                    transform: translateY(8px) scale(.95);
                    pointer-events: none;
                }
                .fab-options.show {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                    pointer-events: auto;
                }

                .fab-option {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    color: #222;
                    padding: 8px 12px;
                    border-radius: 999px;
                    border: none;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
                    cursor: pointer;
                    font-weight: 600;
                }
                .fab-option .label {
                    font-size: 14px;
                }
                .fab-option .circle.small {
                    width: 36px;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: linear-gradient(180deg,#ffd166,#ffb86b);
                    color: #333;
                    font-weight: 700;
                }

                /* small responsive tweak */
                @media (max-width: 480px) {
                    .fab-container { right: 16px; bottom: 16px; }
                    .fab-main { width: 56px; height: 56px; font-size: 24px; }
                }
            `}</style>
        </div>
    );
}
export default SessionPage;