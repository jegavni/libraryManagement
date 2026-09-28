import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/login";
import Register from "./pages/Register";
import Books from "./pages/Books";
import MyLoans from "./pages/MyLoans";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/protectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter> 
        <Navbar />
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Member */}
          <Route element={<ProtectedRoute roles={["member"]} />}>
            <Route
              path="/books"
              element={<Books />}
            />

            <Route
              path="/my-loans"
              element={<MyLoans />}
            />
          </Route>

          {/* Librarian */}
          <Route
            element={
              <ProtectedRoute roles={["librarian"]} />
            }
          >
            <Route
              path="/librarian"
              element={<LibrarianDashboard />}
            />
          </Route>

          {/* Default */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
        
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;