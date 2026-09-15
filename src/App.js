import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import AGCDashboard from "./pages/AGCDashboard";

// A secure route wrapper to check if the user is authenticated
const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem("access_token");

  // ONLY check for the token. Let the Dashboard component handle role restrictions.
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AGCDashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
