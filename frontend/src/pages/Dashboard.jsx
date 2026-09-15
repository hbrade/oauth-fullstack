// frontend/src/pages/Dashboard.jsx
export default function DashboardPage() {
  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>📊 Dashboard</h1>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
        }}
      >
        <h2>Du siehst diese Seite, weil du angemeldet bist!</h2>
        <p>Diese Route ist geschützt mit ProtectedRoute Component.</p>
        <p>Nicht angemeldete User werden zur Home Page weitergeleitet.</p>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#ffffcc",
          borderRadius: "8px",
        }}
      >
        <h3>Nächste Schritte (Woche 2):</h3>
        <ul>
          <li>Backend API Integration</li>
          <li>Token Refresh Rotation</li>
          <li>Daten-Persistierung</li>
          <li>User-spezifische Inhalte</li>
        </ul>
      </div>
    </div>
  );
}
