import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-container">
        <div className="landing-header">
          <h1 className="landing-title">Agora</h1>
          <div className="landing-subtitle">Enter a code or host a session</div>
        </div>
        
        <div className="landing-actions">
          <div className="action-card join-card">
            <div className="card-icon">🔢</div>
            <h2>Join</h2>
            <p>Enter a code to join an existing session</p>
            <button className="btn btn-join">Join Session</button>
          </div>
          
          <div className="action-card host-card">
            <div className="card-icon">🎮</div>
            <h2>Host</h2>
            <p>Create and host your own session</p>
            <button className="btn btn-host">Host Session</button>
          </div>
        </div>
      </div>
    </div>
  );
}
