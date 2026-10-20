import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { auth } from 'express-oauth2-jwt-bearer'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

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

// Globales Rate Limit: 100 Requests pro 15 Minuten pro IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen, bitte später erneut versuchen.' },
})

// Strenges Limit: 5 Requests pro Minute pro IP
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Zu viele Versuche. Bitte in einer Minute erneut versuchen.',
  },
})

app.use(globalLimiter)

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

// Schema: erwartetes Eingabeformat (Allowlist)
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().int().positive().max(10000),
  category: z.enum(['food', 'medicine', 'other']),
})

// Validierungs-Middleware
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Ungültige Eingabe',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      })
    }
    req.validatedBody = result.data
    next()
  }
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

app.get(
  '/api/test403',
  checkJwt,
  requirePermission('does:not-exist'),
  (req, res) => res.json({ ok: true })
)

app.get('/api/sensitive', strictLimiter, checkJwt, (req, res) => {
  res.json({ data: 'streng limitiert' })
})

app.post('/api/items', checkJwt, validate(createItemSchema), (req, res) => {
  const item = req.validatedBody
  console.log('✅ [ITEMS] validiert:', item)
  res.status(201).json({ created: item })
})

// Server starten
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`)
  console.log(`Frontend erreichbar auf ${process.env.FRONTEND_URL}`)
})
