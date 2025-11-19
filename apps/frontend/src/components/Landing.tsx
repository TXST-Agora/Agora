import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="landing">
      <div className="landing-container">
        <header className="landing-header">
          <h1 className="landing-title">Welcome</h1>
          <p className="landing-subtitle">
            Host or join a forum in seconds.
          </p>
        </header>

        <section className="landing-actions">
          <article className="action-card join-card" tabIndex={0}>
            <h2>Join</h2>
            <p>Enter a code to jump into a live discussion.</p>
            <button className="btn btn-join" onClick={() => navigate('/join')}>Join Forum</button>
          </article>

          <article className="action-card host-card" tabIndex={0}>
            <h2>Host</h2>
            <p>Start a forum and invite participants instantly.</p>
            <button className="btn btn-host" onClick={() => navigate('/host')}>Host Forum</button>
          </article>
        </section>
      </div>
    </main>
  );
}

export default Landing;