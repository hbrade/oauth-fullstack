import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export default function CallbackPage() {
  const navigate = useNavigate()
  const { isLoading, isAuthenticated, error } = useAuth0()
  const hasRun = useRef(false)

  useEffect(() => {
    if (isLoading) return
    if (hasRun.current) return
    hasRun.current = true

    if (error) {
      console.error('❌ [CALLBACK] Error:', error)
      navigate('/', { replace: true })
      return
    }

    if (isAuthenticated) {
      console.log('✅ [CALLBACK] Authentifizierung erfolgreich')
      navigate('/dashboard', { replace: true })
    } else {
      console.log('❌ [CALLBACK] Nicht authentifiziert')
      navigate('/', { replace: true })
    }
  }, [isLoading, isAuthenticated, error, navigate])

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🔄 Authentifizierung läuft...</h1>
    </div>
  )
}
