import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function CallbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Warte kurz dann navigate (KEIN Page Reload!)
      setTimeout(() => {
        navigate("/dashboard"); // window.location.href macht page reload und damit ein logout
      }, 500);
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>🔄 Authentifizierung läuft...</h1>
      <p>Backend tauscht Code gegen Token...</p>
    </div>
  );
}
