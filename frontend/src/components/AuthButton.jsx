// frontend/src/components/AuthButton.jsx
import { useAuth0 } from "@auth0/auth0-react";

export function AuthButton() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      {!isAuthenticated ? (
        <button
          onClick={() => loginWithRedirect()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔐 Login
        </button>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: "32px", height: "32px", borderRadius: "50%" }}
              />
            )}
            <span>{user?.name || user?.email}</span>
          </div>
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            style={{
              padding: "8px 16px",
              backgroundColor: "#cc0000",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
