import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { auth } from 'express-oauth2-jwt-bearer'
import helmet from 'helmet'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(
  helmet({
    contentSecurityPolicy: {
      // <- CSP
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL], // explizit erlaubte fetch/XHR-Ziele
        frameAncestors: ["'none'"], // niemand darf iframen (strenger)
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
})

const requirePermission = (permission) => (req, res, next) => {
  const permissions = req.auth?.payload?.permissions || []

  if (!permissions.includes(permission)) {
    console.log(`🚫 [AUTHZ] ${req.auth?.payload?.sub} fehlt: ${permission}`)
    return res.status(403).json({
      error: 'insufficient_permission',
      required: permission,
    })
  }
  next()
}

// ============================================
// ROUTE 2: User Info (geschützt mit JWT Validierung)
// ============================================
app.get('/api/user', checkJwt, (req, res) => {
  console.log('✅ [USER] Token validiert')
  console.log('   Subject (sub):', req.auth.payload.sub)

  res.json({
    message: 'Token ist gültig!',
    sub: req.auth.payload.sub,
    scope: req.auth.payload.scope,
  })
})

// ============================================
// ROUTE 3: Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend läuft auf Port ' + PORT })
})

// ============================================
// ROUTE: Messages (braucht read:messages)
// ============================================
app.get(
  '/api/messages',
  checkJwt,
  requirePermission('read:messages'),
  (req, res) => {
    console.log('✅ [MESSAGES] Zugriff erlaubt für', req.auth.payload.sub)
    res.json({
      messages: ['Nachricht 1', 'Nachricht 2'],
      permissions: req.auth.payload.permissions,
    })
  }
)

// ============================================
// ROUTE: Admin (braucht admin:access)
// ============================================
app.get(
  '/api/admin',
  checkJwt,
  requirePermission('admin:access'),
  (req, res) => {
    console.log('✅ [ADMIN] Zugriff erlaubt für', req.auth.payload.sub)
    res.json({ message: 'Willkommen im Admin-Bereich' })
  }
)

// Server starten
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`)
  console.log(`Frontend erreichbar auf ${process.env.FRONTEND_URL}`)
})
