# SONNTAG: OAuth 2.0 Full-Stack App (React + Node.js) — Detaillierter Plan

**Zeit:** 14:00–16:30 Uhr (2.5h, nicht unterbrechen!)

**Ziel:** Funktionierende Multi-Page OAuth App mit React Frontend + Node.js Backend

---

## Überblick: Was bauen wir

```
Frontend (React)                Backend (Node.js)
├── Home Page                  ├── Port 3001
├── Login Button               ├── /api/auth/callback
├── Dashboard (geschützt)      ├── Token Exchange
├── Profile Page               ├── User Data
└── Navbar + User Info         └── Protected Routes
                               
FLOW:
User → Frontend Login → Auth0 → Code → Backend Exchange → Token → Session
```

---

## SONNTAG DETAILLIERT (2.5h)

### **14:00–14:15 | Projekt-Setup (15 min)**

#### **Schritt 1: Folder-Struktur anlegen**

```bash
cd ~/workspace
mkdir oauth-fullstack
cd oauth-fullstack

# Frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install @auth0/auth0-react react-router-dom axios
cd ..

# Backend
mkdir backend
cd backend
npm init -y
npm install express jsonwebtoken cookie-parser cors dotenv axios
cd ..
```

**Struktur jetzt:**
```
oauth-fullstack/
├── frontend/
│   ├── node_modules/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── node_modules/
    ├── server.js
    └── package.json
```

#### **Schritt 2: Environment Files**

**Frontend:**
```bash
cd frontend
cat > .env.local << 'EOF'
VITE_AUTH0_DOMAIN=YOUR_DOMAIN.auth0.com
VITE_AUTH0_CLIENT_ID=YOUR_CLIENT_ID
VITE_BACKEND_URL=http://localhost:3001
EOF
```

**Backend:**
```bash
cd ../backend
cat > .env << 'EOF'
PORT=3001
AUTH0_DOMAIN=YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
FRONTEND_URL=http://localhost:5173
EOF
```

**Erfolgs-Checkpoint:**
- ✅ Frontend + Backend Folder erstellt
- ✅ Dependencies installiert
- ✅ .env Files vorhanden

---

### **14:15–14:45 | Frontend: Auth0Provider + AuthButton + Navbar (30 min)**

#### **Schritt 1: main.jsx mit Auth0Provider**

```jsx
// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`,
        audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)
```

#### **Schritt 2: AuthButton Component**

```bash
mkdir -p frontend/src/components
touch frontend/src/components/AuthButton.jsx
```

```jsx
// frontend/src/components/AuthButton.jsx
import { useAuth0 } from '@auth0/auth0-react'

export function AuthButton() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0()

  if (isLoading) return <div>Loading...</div>

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {!isAuthenticated ? (
        <button
          onClick={() => loginWithRedirect()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔐 Login
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
            )}
            <span>{user?.name || user?.email}</span>
          </div>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  )
}
```

#### **Schritt 3: App.jsx mit Router + Navbar**

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { AuthButton } from './components/AuthButton'
import { ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './pages/Home'
import DashboardPage from './pages/Dashboard'
import ProfilePage from './pages/Profile'
import CallbackPage from './pages/Callback'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid #ccc'
      }}>
        <h1 style={{ margin: 0 }}>🔐 OAuth Full-Stack Demo</h1>
        <AuthButton />
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/callback" element={<CallbackPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
```

**Erfolgs-Checkpoint:**
- ✅ main.jsx mit Auth0Provider
- ✅ AuthButton Component erstellt
- ✅ App.jsx mit Router
- ✅ Frontend startet (`cd frontend && npm run dev`)

---

### **14:45–15:30 | Frontend: Pages + Protected Route (45 min)**

#### **Schritt 1: ProtectedRoute Component**

```bash
touch frontend/src/components/ProtectedRoute.jsx
```

```jsx
// frontend/src/components/ProtectedRoute.jsx
import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/" replace />

  return children
}
```

#### **Schritt 2: Callback Page**

```bash
mkdir -p frontend/src/pages
touch frontend/src/pages/Callback.jsx
```

```jsx
// frontend/src/pages/Callback.jsx
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function CallbackPage() {
  const { isAuthenticated, isLoading } = useAuth0()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      window.location.href = '/dashboard'
    }
  }, [isAuthenticated, isLoading])

  return <div style={{ padding: '20px', textAlign: 'center' }}>Authentifizierung läuft...</div>
}
```

#### **Schritt 3: Home Page**

```bash
touch frontend/src/pages/Home.jsx
```

```jsx
// frontend/src/pages/Home.jsx
import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  const { isAuthenticated } = useAuth0()

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Willkommen bei OAuth Full-Stack Demo</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Was ist hier drin?</h2>
        <ul>
          <li>React Frontend mit Auth0 OAuth</li>
          <li>Node.js Backend mit Token Exchange</li>
          <li>Geschützte Routes (/dashboard, /profile)</li>
          <li>User Profile mit Authentifizierung</li>
        </ul>
      </div>

      {isAuthenticated ? (
        <div style={{ marginTop: '20px' }}>
          <p>Du bist angemeldet! 🎉</p>
          <Link to="/dashboard" style={{ marginRight: '10px' }}>
            📊 Dashboard
          </Link>
          <Link to="/profile">
            👤 Profile
          </Link>
        </div>
      ) : (
        <p style={{ marginTop: '20px' }}>
          👆 Klick auf Login oben rechts um zu starten!
        </p>
      )}
    </div>
  )
}
```

#### **Schritt 4: Dashboard Page**

```bash
touch frontend/src/pages/Dashboard.jsx
```

```jsx
// frontend/src/pages/Dashboard.jsx
export default function DashboardPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📊 Dashboard</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Du siehst diese Seite, weil du angemeldet bist!</h2>
        <p>Diese Route ist geschützt mit ProtectedRoute Component.</p>
        <p>Nicht angemeldete User werden zur Home Page weitergeleitet.</p>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ffffcc', borderRadius: '8px' }}>
        <h3>Nächste Schritte (Woche 2):</h3>
        <ul>
          <li>Backend API Integration</li>
          <li>Token Refresh Rotation</li>
          <li>Daten-Persistierung</li>
          <li>User-spezifische Inhalte</li>
        </ul>
      </div>
    </div>
  )
}
```

#### **Schritt 5: Profile Page**

```bash
touch frontend/src/pages/Profile.jsx
```

```jsx
// frontend/src/pages/Profile.jsx
import { useAuth0 } from '@auth0/auth0-react'

export default function ProfilePage() {
  const { user } = useAuth0()

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>👤 Dein Profil</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        {user?.picture && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img
              src={user.picture}
              alt="Avatar"
              style={{ width: '120px', height: '120px', borderRadius: '50%' }}
            />
          </div>
        )}

        <div style={{ marginTop: '10px' }}>
          <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          <p><strong>User ID:</strong> {user?.sub || 'N/A'}</p>
          <p><strong>Last Updated:</strong> {user?.updated_at || 'N/A'}</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#ccffcc', borderRadius: '8px' }}>
        <h3>✅ OAuth erfolgreich!</h3>
        <p>Diese Infos kommen von Auth0 nach erfolgreichem Login.</p>
      </div>
    </div>
  )
}
```

**Erfolgs-Checkpoint:**
- ✅ ProtectedRoute Component erstellt
- ✅ Callback Page fertig
- ✅ Home, Dashboard, Profile Pages fertig
- ✅ Frontend startet: `npm run dev` (Port 5173)
- ✅ Navigation funktioniert

---

### **15:30–16:00 | Backend: Token Exchange + Server (30 min)**

#### **Schritt 1: Backend Server**

```bash
# backend/server.js
cat > server.js << 'EOF'
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
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// ============================================
// ROUTE 1: Token Exchange Endpoint
// ============================================
app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Code erforderlich' })
  }

  try {
    // SCHRITT 9: Backend tauscht Code gegen Token
    const response = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/callback`
      }
    )

    const { access_token, refresh_token, expires_in } = response.data

    // Speichere Refresh Token in httpOnly Cookie
    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
    })

    // Sende Access Token zum Frontend
    res.json({
      accessToken: access_token,
      expiresIn: expires_in
    })
  } catch (error) {
    console.error('Token Exchange Error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Token Exchange fehlgeschlagen' })
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
EOF
```

**Oder mit CommonJS (falls du das lieber hast):**

```bash
cat > server.js << 'EOF'
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// Token Exchange
app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body

  try {
    const response = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/callback`
      }
    )

    const { access_token, refresh_token, expires_in } = response.data

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      accessToken: access_token,
      expiresIn: expires_in
    })
  } catch (error) {
    console.error('Error:', error.response?.data)
    res.status(500).json({ error: 'Token Exchange fehlgeschlagen' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', port: PORT })
})

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`)
})
EOF
```

#### **Schritt 2: package.json Update**

```bash
# Bearbeite backend/package.json
cat > package.json << 'EOF'
{
  "name": "oauth-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.0.3",
    "axios": "^1.4.0"
  }
}
EOF
```

**Erfolgs-Checkpoint:**
- ✅ Backend server.js erstellt
- ✅ Token Exchange Endpoint vorhanden
- ✅ `npm start` läuft (Port 3001)
- ✅ `/api/health` antwortet

---

### **16:00–16:15 | Integration: Frontend ↔ Backend (15 min)**

#### **Schritt 1: Frontend nutzt Backend-Token Exchange**

Erstelle einen **Auth Service** im Frontend:

```bash
mkdir -p frontend/src/services
touch frontend/src/services/authService.js
```

```javascript
// frontend/src/services/authService.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL

export async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/callback`,
      { code },
      { withCredentials: true } // Sendet Cookies mit
    )
    return response.data
  } catch (error) {
    console.error('Token Exchange Error:', error)
    throw error
  }
}

export async function getUserData(accessToken) {
  try {
    const response = await axios.get(
      `${API_URL}/api/user`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true
      }
    )
    return response.data
  } catch (error) {
    console.error('User Data Error:', error)
    throw error
  }
}
```

#### **Schritt 2: Callback Page mit Backend Integration**

```jsx
// frontend/src/pages/Callback.jsx (UPDATED)
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useSearchParams } from 'react-router-dom'
import { exchangeCodeForToken } from '../services/authService'

export default function CallbackPage() {
  const { isAuthenticated, isLoading } = useAuth0()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    
    if (code && !isLoading) {
      // Tausche Code gegen Token mit BACKEND
      exchangeCodeForToken(code)
        .then((data) => {
          console.log('✅ Token vom Backend erhalten:', data)
          // Token ist jetzt im httpOnly Cookie!
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
        })
        .catch((error) => {
          console.error('❌ Token Exchange fehlgeschlagen:', error)
          window.location.href = '/'
        })
    }
  }, [searchParams, isLoading])

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🔄 Authentifizierung läuft...</h1>
      <p>Frontend sendet Code an Backend...</p>
      <p>Backend tauscht gegen Token...</p>
    </div>
  )
}
```

**Erfolgs-Checkpoint:**
- ✅ authService erstellt
- ✅ Frontend sendet Code an Backend
- ✅ Backend antwortet mit Token
- ✅ Refresh Token im httpOnly Cookie

---

### **16:15–16:30 | Git + Dokumentation + Test (15 min)**

#### **Schritt 1: Kompletter Test**

```bash
# Terminal 1: Backend
cd oauth-fullstack/backend
npm start
# Sollte zeigen: "Backend läuft auf http://localhost:3001"

# Terminal 2: Frontend
cd oauth-fullstack/frontend
npm run dev
# Sollte zeigen: "Local:   http://localhost:5173"
```

**Test Checklist:**

```markdown
## Sonntag Test-Checklist

### Frontend
- [ ] Localhost:5173 öffnet ohne Fehler
- [ ] Navbar mit Login Button sichtbar
- [ ] Klick Login → Auth0 Seite

### Auth0 Flow
- [ ] Login mit Email/Passwort
- [ ] Permissions Dialog
- [ ] Zurück zu Callback Page

### Backend Integration
- [ ] "Authentifizierung läuft..." sichtbar
- [ ] Kein Error in Browser Console
- [ ] Browser zeigt /dashboard
- [ ] User Name/Email sichtbar

### Geschützte Routes
- [ ] /dashboard ohne Login → Redirect
- [ ] /profile ohne Login → Redirect
- [ ] Nach Login: Beide Seiten sichtbar

### Logout
- [ ] Klick Logout
- [ ] Zurück zu Home Page
- [ ] /dashboard → wieder Redirect
```

#### **Schritt 2: Git Repo erstellen**

```bash
cd oauth-fullstack

# Git init
git init
git add .
git commit -m "feat: OAuth 2.0 Full-Stack App (React + Node.js)

- React frontend with Auth0 OAuth 2.0 integration
- Node.js backend with token exchange endpoint
- Protected routes (/dashboard, /profile)
- User profile page
- httpOnly cookie for refresh token storage
- CORS setup for frontend-backend communication

Architecture:
- Frontend: React + Vite on :5173
- Backend: Express on :3001
- Auth: Auth0 OAuth 2.0 flow"
```

#### **Schritt 3: README**

```bash
cat > README.md << 'EOF'
# OAuth 2.0 Full-Stack App

React Frontend + Node.js Backend mit Auth0 OAuth 2.0

## Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm start
# http://localhost:3001
```

## Features
- ✅ OAuth 2.0 Authorization Code Flow
- ✅ Auth0 Integration
- ✅ Protected Routes
- ✅ User Profile Page
- ✅ Token Exchange (Backend)
- ✅ httpOnly Cookies

## Architecture
- Frontend: React + Vite
- Backend: Express
- Auth: Auth0
- Token Storage: httpOnly Cookie (Refresh), Memory (Access)

## Next Steps (Woche 2)
- Refresh Token Rotation
- Backend Token Validation
- Database Integration
- User-specific Data
EOF

git add README.md
git commit -m "docs: Add README"
```

**Erfolgs-Checkpoint:**
- ✅ Backend läuft auf Port 3001
- ✅ Frontend läuft auf Port 5173
- ✅ Login funktioniert vollständig
- ✅ Code committed mit guten Messages

---

## SONNTAG SUMMARY

```markdown
## Was du heute gebaut hast:

### Frontend (React)
✅ Auth0Provider Integration
✅ AuthButton Component
✅ Navbar mit Auth-Status
✅ Home, Dashboard, Profile Pages
✅ Protected Routes mit ProtectedRoute
✅ Callback Page mit Backend Integration

### Backend (Node.js)
✅ Express Server (Port 3001)
✅ /api/auth/callback Endpoint
✅ Token Exchange mit Auth0
✅ httpOnly Cookie für Refresh Token
✅ CORS Setup für Frontend

### Architektur
✅ OAuth 2.0 Authorization Code Flow
✅ Frontend sendet Code an Backend
✅ Backend tauscht Code gegen Token
✅ Tokens sicher gespeichert

### Dokumentation
✅ Git Repository
✅ README
✅ Code Comments
```

---

## Nächste Schritte (Woche 2)

```
Woche 2: Token Refresh + Backend Security
├── Refresh Token Rotation implementieren
├── Access Token Validation im Backend
├── User-spezifische API Endpoints
├── Datenbank Integration (DynamoDB/MongoDB)
└── Advanced Security (CSRF Token, Rate Limiting)
```

---

**Sonntag ist dein Turbo-Tag! Nach dieser Woche hast du eine echte OAuth 2.0 App mit Frontend + Backend!** 🚀

Ready to go? Sollen wir starten? ⏰
