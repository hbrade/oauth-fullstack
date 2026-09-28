import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '1px solid #ccc',
        }}
      >
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
