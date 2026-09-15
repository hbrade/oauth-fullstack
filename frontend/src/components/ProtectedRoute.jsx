// frontend/src/components/ProtectedRoute.jsx
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
