import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export default function CallbackPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth0()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return

    if (isAuthenticated) {
      hasRun.current = true
      console.log('✅ [CALLBACK] Authentifizierung erfolgreich')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🔄 Authentifizierung läuft...</h1>
    </div>
  )
}
