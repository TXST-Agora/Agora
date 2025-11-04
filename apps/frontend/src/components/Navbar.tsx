import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    window.alert('Sign in clicked');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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