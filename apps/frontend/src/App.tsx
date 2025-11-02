// App.ts
import React from 'react';
import Landing from './components/Landing';

export default function App() {
  return (
    <div className="app-shell">
      {/* Global Top Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">Agora</div>
          <div className="navbar-actions">
            {/* (Optional) wire these to routes later */}
            <button className="btn btn-join btn-nav">Join</button>
            <button className="btn btn-host btn-nav">Host</button>
          </div>
        </div>
      </nav>

      {/* Your existing pages/components */}
      <Landing />
    </div>
  );
}
