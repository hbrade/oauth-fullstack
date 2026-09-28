import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

// ============================================
// ROUTE 1: Token Exchange Endpoint
// ============================================
// ============ OAUTH ENDPOINTS ============

app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code erforderlich' })
  }

  try {
    console.log('🔍 [CALLBACK] Token Exchange gestartet')
    console.log('   Code:', code.substring(0, 30) + '...')

    // SCHRITT 9: Backend tauscht Code gegen Token
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/callback`,
      }
    )

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    console.log('✅ [CALLBACK] Token von Auth0 erhalten')

    // Speichere Refresh Token in httpOnly Cookie
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    })

    console.log('✅ [CALLBACK] Refresh Token in httpOnly Cookie gespeichert')

    // Sende Access Token zum Frontend
    res.json({
      accessToken: access_token,
      expiresIn: expires_in,
    })
  } catch (error) {
    console.error('❌ [CALLBACK] Token Exchange Error')
    console.error('   Details:', error.response?.data || error.message)
    res.status(500).json({ error: 'Token Exchange fehlgeschlagen' })
  }
})

app.post('/api/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    console.log('❌ [REFRESH] Kein Refresh Token im Cookie')
    return res.status(401).json({ error: 'Nicht authentifiziert' })
  }

  try {
    console.log('🔍 [REFRESH] Token Exchange mit Refresh Token gestartet')

    axios
      .post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })
      .then((response) => {
        const {
          access_token,
          refresh_token: newRefreshToken,
          expires_in,
        } = response.data

        console.log('✅ [REFRESH] Neuer Access Token erhalten')

        if (newRefreshToken) {
          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          console.log('✅ [REFRESH] Neuer Refresh Token gespeichert')
        }

        res.json({
          accessToken: access_token,
          expiresIn: expires_in,
        })
      })
      .catch((error) => {
        console.error(
          '❌ [REFRESH] Auth0 Error:',
          error.response?.data || error.message
        )
        res.status(401).json({ error: 'Refresh fehlgeschlagen' })
      })
  } catch (error) {
    console.error('❌ [REFRESH] Server Error:', error.message)
    res.status(500).json({ error: 'Server Error' })
  }
})

// ============================================
// ROUTE 2: User Info (geschützt)
// ============================================
app.get('/api/user', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'No token' })
  }

  const token = authHeader.split(' ')[1]
  // In Woche 2: Token validieren

  res.json({ message: 'Token ist gültig!' })
})

// ============================================
// ROUTE 3: Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend läuft auf Port ' + PORT })
})

// Server starten
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`)
  console.log(`Frontend erreichbar auf ${process.env.FRONTEND_URL}`)
})
