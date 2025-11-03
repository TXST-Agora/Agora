import React from "react";
import "./Navbar.css";

type NavbarProps = {
  title?: string;
  rightActions?: React.ReactNode;
};

const Navbar = ({ title = "Agora", rightActions }: NavbarProps) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">{title}</div>
        {rightActions ? <div className="navbar-actions">{rightActions}</div> : null}
      </div>
    </nav>
  );
}

export default Navbar;