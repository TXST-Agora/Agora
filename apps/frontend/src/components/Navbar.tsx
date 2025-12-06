import "./Navbar.css";
import { AgoraLogo } from "./AgoraLogo";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  // Extract sessionCode from URL path like /forum/ABC123
  const sessionCodeMatch = location.pathname.match(/^\/forum\/([^/]+)$/);
  const sessionCode = sessionCodeMatch ? sessionCodeMatch[1] : null;

  const handleHomeClick = () => {
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
          <AgoraLogo width={36} height={36} className="navbar-logo" />
          <span className="navbar-brand-text">Agora</span>
        </div>
        {sessionCode && (
          <div className="navbar-session-code">
            <span className="session-code-label">Session Code:</span>
            <span className="session-code-value">{sessionCode}</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;