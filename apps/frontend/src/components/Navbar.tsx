import "./Navbar.css";
import { AgoraLogo } from "./AgoraLogo";

const Navbar = () => {

  const handleSignIn = () => {
    window.alert('Sign in clicked');
  };

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
        <button 
          className="signin-btn btn-nav" 
          onClick={handleSignIn}
          aria-label="Sign in" 
          type="button"
        >
          Sign in
        </button>
      </div>
    </nav>
  );
}

export default Navbar;