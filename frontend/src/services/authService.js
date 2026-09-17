import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function exchangeCodeForToken(code) {
  try {
    console.log("Sende Code an Backend:", code);

    const response = await axios.post(
      `${API_URL}/api/auth/callback`,
      { code },
      { withCredentials: true }, // Sendet Cookies mit
    );

    console.log("✅ Token vom Backend erhalten:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Token Exchange Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
}
