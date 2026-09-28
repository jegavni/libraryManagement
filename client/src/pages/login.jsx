import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const storedUser = JSON.parse(
      localStorage.getItem("user")
    );

    if (storedUser.role === "librarian") {
      navigate("/librarian");
    } else {
      navigate("/books");
    }
  };

  return (
    <div className="auth-page">
      <h1>Library Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account?{" "}
        <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;