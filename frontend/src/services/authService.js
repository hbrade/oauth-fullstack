import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export async function exchangeCodeForToken(code) {
  try {
    console.log('📤 [AUTH] Code an Backend senden')

    const response = await axios.post(
      `${API_URL}/api/auth/callback`,
      { code },
      { withCredentials: true } // httpOnly Cookies! (client command: send also cookies
    )

    console.log('✅ [AUTH] Access Token vom Backend erhalten')
    return response.data.accessToken
  } catch (error) {
    console.error(
      '❌ [AUTH] Token Exchange Error:',
      error.response?.data || error.message
    )
    throw error
  }
}

export async function refreshAccessToken() {
  try {
    console.log('🔄 [AUTH] Refresh Token nutzen für neuen Access Token')

    const response = await axios.post(
      `${API_URL}/api/refresh`,
      {},
      { withCredentials: true }
    )

    console.log('✅ [AUTH] Neuer Access Token erhalten')
    return response.data.accessToken
  } catch (error) {
    console.error(
      '❌ [AUTH] Refresh Error:',
      error.response?.data || error.message
    )
    throw error
  }
}
