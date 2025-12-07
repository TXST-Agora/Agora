import "./Navbar.css";
import { AgoraLogo } from "./AgoraLogo";
import { useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
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
        <div className="navbar-right">
          {sessionCode && (
            <div className="navbar-session-code">
              <span className="session-code-label">Session Code:</span>
              <span className="session-code-value">{sessionCode}</span>
            </div>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;