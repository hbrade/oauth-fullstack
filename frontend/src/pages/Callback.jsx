// frontend/src/pages/Callback.jsx
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const code = searchParams.get("code");

    if (isAuthenticated && !isLoading) {
      // Warte kurz dann navigate (KEIN Page Reload!)
      setTimeout(() => {
        navigate("/dashboard"); // window.location.href macht page reload und damit ein logout
      }, 500);
    }
  }, [searchParams, isAuthenticated, isLoading, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>🔄 Authentifizierung läuft...</h1>
      <p>Du wirst gleich weitergeleitet...</p>
    </div>
  );
}
