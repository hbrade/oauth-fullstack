import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="container">
      <h1>Willkommen bei OAuth Full-Stack Demo</h1>

      <div className="info-box info-box-primary">
        <h2>Was ist hier drin?</h2>
        <ul>
          <li>React Frontend mit Auth0 OAuth</li>
          <li>Node.js Backend mit Token Exchange</li>
          <li>Geschützte Routes (/dashboard, /profile)</li>
          <li>User Profile mit Authentifizierung</li>
        </ul>
      </div>

      {isAuthenticated ? (
        <div style={{ marginTop: "20px" }}>
          <p>Du bist angemeldet! 🎉</p>
          <Link
            to="/dashboard"
            style={{
              marginRight: "10px",
              textDecoration: "none",
              color: "#0066cc",
            }}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/profile"
            style={{ textDecoration: "none", color: "#0066cc" }}
          >
            👤 Profile
          </Link>
        </div>
      ) : (
        <p style={{ marginTop: "20px" }}>
          👆 Klick auf Login oben rechts um zu starten!
        </p>
      )}
    </div>
  );
}
