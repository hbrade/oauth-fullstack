import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

// ============================================
// ROUTE 1: Token Exchange Endpoint
// ============================================
app.post("/api/auth/callback", async (req, res) => {
  const { code } = req.body;

  console.log("🔍 DEBUG: Callback erhalten");
  console.log("Code:", code);
  console.log("AUTH0_DOMAIN:", process.env.AUTH0_DOMAIN);
  console.log("AUTH0_CLIENT_ID:", process.env.AUTH0_CLIENT_ID);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  if (!code) {
    return res.status(400).json({ error: "Code erforderlich" });
  }

  try {
    // SCHRITT 9: Backend tauscht Code gegen Token
    const response = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.FRONTEND_URL}/callback`,
      },
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Speichere Refresh Token in httpOnly Cookie
    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    });

    // Sende Access Token zum Frontend
    res.json({
      accessToken: access_token,
      expiresIn: expires_in,
    });
  } catch (error) {
    console.error(
      "Token Exchange Error:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Token Exchange fehlgeschlagen" });
  }
});

// ============================================
// ROUTE 2: User Info (geschützt)
// ============================================
app.get("/api/user", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token" });
  }

  const token = authHeader.split(" ")[1];
  // In Woche 2: Token validieren

  res.json({ message: "Token ist gültig!" });
});

// ============================================
// ROUTE 3: Health Check
// ============================================
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend läuft auf Port " + PORT });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
  console.log(`Frontend erreichbar auf ${process.env.FRONTEND_URL}`);
});
