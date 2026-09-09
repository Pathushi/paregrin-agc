import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import AGCDashboard from "./pages/AGCDashboard"; // Updated import name

// A secure route wrapper to check if the user is authenticated as an admin
const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem("access_token");
  const userRole = sessionStorage.getItem("user_role");

  if (!token || userRole !== "admin") {
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

        {/* Protected Admin Dashboard Route */}
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
