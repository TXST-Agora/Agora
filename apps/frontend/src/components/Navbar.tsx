import "./Navbar.css";

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