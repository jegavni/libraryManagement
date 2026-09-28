import { useEffect, useState } from "react";
import api from "../services/api";

const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/loans/my");

      setLoans(response.data.loans || []);
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
          "Failed to load your loans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  if (loading) {
    return <p>Loading your loans...</p>;
  }

  return (
    <div className="my-loans-page">
      <h1>My Loans</h1>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {!error && loans.length === 0 && (
        <p>You have no loan history.</p>
      )}

      {loans.length > 0 && (
        <div className="loans-list">
          {loans.map((loan) => (
            <div
              className="loan-card"
              key={loan.id}
            >
              <h2>{loan.title}</h2>

              <p>
                <strong>Author:</strong>{" "}
                {loan.author}
              </p>

              <p>
                <strong>Copy:</strong>{" "}
                {loan.copy_code}
              </p>

              <p>
                <strong>Borrowed:</strong>{" "}
                {formatDate(loan.borrowed_at)}
              </p>

              <p>
                <strong>Due date:</strong>{" "}
                {formatDate(loan.due_date)}
              </p>

              <p>
                <strong>Returned:</strong>{" "}
                {formatDate(loan.returned_at)}
              </p>

              {/* Active / returned status */}
              {loan.returned_at ? (
                <p className="loan-status">
                  <strong>Status:</strong> Returned
                </p>
              ) : loan.overdue ? (
                <p className="loan-status overdue">
                  <strong>Status:</strong> Overdue
                </p>
              ) : (
                <p className="loan-status active">
                  <strong>Status:</strong> Active
                </p>
              )}

              {/* Fine */}
              <p>
                <strong>Fine:</strong>{" "}
                ₹{loan.fine || 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLoans;