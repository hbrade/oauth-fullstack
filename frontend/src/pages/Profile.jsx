import { useAuth0 } from "@auth0/auth0-react";

export default function ProfilePage() {
  const { user } = useAuth0();

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>👤 Dein Profil</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
        }}
      >
        {user?.picture && (
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <img
              src={user.picture}
              alt="Avatar"
              style={{ width: "120px", height: "120px", borderRadius: "50%" }}
            />
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <p>
            <strong>Name:</strong> {user?.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || "N/A"}
          </p>
          <p>
            <strong>User ID:</strong> {user?.sub || "N/A"}
          </p>
          <p>
            <strong>Last Updated:</strong> {user?.updated_at || "N/A"}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#ccffcc",
          borderRadius: "8px",
        }}
      >
        <h3>✅ OAuth erfolgreich!</h3>
        <p>Diese Infos kommen von Auth0 nach erfolgreichem Login.</p>
      </div>
    </div>
  );
}
