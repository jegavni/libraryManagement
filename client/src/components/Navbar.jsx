import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="navbar">
      <h2>Library Management</h2>

      <div className="nav-links">
        {user.role === "member" && (
          <>
            <Link to="/books">
              Books
            </Link>

            <Link to="/my-loans">
              My Loans
            </Link>
          </>
        )}

        {user.role === "librarian" && (
          <Link to="/librarian">
            Dashboard
          </Link>
        )}

        <span>
          {user.name}
        </span>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;