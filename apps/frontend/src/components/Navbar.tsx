import "./Navbar.css";
import ThemeToggle from "./ThemeToggle";

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
          Agora
        </div>
        <div className="navbar-actions">
          <ThemeToggle />
          <button 
            className="signin-btn btn-nav" 
            onClick={handleSignIn}
            aria-label="Sign in" 
            type="button"
          >
            Sign in
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;