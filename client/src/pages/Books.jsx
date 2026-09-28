import { useEffect, useState } from "react";
import api from "../services/api";

const Books = () => {
  const [books, setBooks] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const limit = 20;

  // ============================================
  // LOAD BOOKS
  // ============================================

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/books", {
        params: {
          search,
          page,
          limit,
        },
      });

      setBooks(response.data.books || []);

      setPagination({
        total: response.data.pagination?.total || 0,
        totalPages:
          response.data.pagination?.totalPages || 1,
      });
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load books."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load when search/page changes
  useEffect(() => {
    fetchBooks();
  }, [page, search]);

  // ============================================
  // SEARCH
  // ============================================

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  // ============================================
  // BORROW BOOK
  // ============================================

  const handleBorrow = async (bookId) => {
    try {
      setBorrowingId(bookId);
      setError("");
      setMessage("");

      await api.post("/loans", {
        bookId,
      });

      setMessage("Book borrowed successfully.");

      // Refresh availability
      await fetchBooks();
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Unable to borrow this book."
      );
    } finally {
      setBorrowingId(null);
    }
  };

  return (
    <div className="books-page">
      <h1>Library Catalogue</h1>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Success */}
      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* Loading */}
      {loading && <p>Loading books...</p>}

      {/* Books */}
      {!loading && books.length === 0 && (
        <p>No books found.</p>
      )}

      {!loading && books.length > 0 && (
        <div className="books-list">
          {books.map((book) => (
            <div
              className="book-card"
              key={book.id}
            >
              <h2>{book.title}</h2>

              <p>
                <strong>Author:</strong>{" "}
                {book.author}
              </p>

              <p>
                <strong>ISBN:</strong>{" "}
                {book.isbn}
              </p>

              <p>
                <strong>Total copies:</strong>{" "}
                {book.total_copies}
              </p>

              <p>
                <strong>Available:</strong>{" "}
                {book.available_copies}
              </p>

              {book.available_copies > 0 ? (
                <button
                  onClick={() =>
                    handleBorrow(book.id)
                  }
                  disabled={borrowingId === book.id}
                >
                  {borrowingId === book.id
                    ? "Borrowing..."
                    : "Borrow"}
                </button>
              ) : (
                <button disabled>
                  Not Available
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {pagination.totalPages}
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Books;