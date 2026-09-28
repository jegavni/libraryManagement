import { Link } from "react-router-dom";

const LibrarianDashboard = () => {
  return (
    <div>
      <h1>Librarian Dashboard</h1>

      <p>Welcome to the library management system.</p>

      <div>
        <Link to="/manage-books">
          <button>Manage Books</button>
        </Link>

        <Link to="/manage-copies">
          <button>Manage Copies</button>
        </Link>

        <Link to="/manage-loans">
          <button>Manage Loans</button>
        </Link>
      </div>
    </div>
  );
};

export default LibrarianDashboard;