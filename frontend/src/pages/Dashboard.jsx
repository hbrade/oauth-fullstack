import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function Dashboard() {
  const { user, getAccessTokenSilently, isLoading } = useAuth0()
  const [apiResult, setApiResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  if (isLoading) return <p>Laden...</p>

  const callProtectedApi = async () => {
    setApiResult(null)
    setApiError(null)
    try {
      const token = await getAccessTokenSilently()
      console.log('📤 [API] Sende Request mit Bearer Token')

      const response = await axios.get(`${API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log('✅ [API] Antwort:', response.data)
      setApiResult(response.data)
    } catch (error) {
      console.error('❌ [API] Error:', error.response?.data || error.message)
      setApiError(
        error.response?.status + ' ' + JSON.stringify(error.response?.data)
      )
    }
  }

  const callWithoutToken = async () => {
    setApiResult(null)
    setApiError(null)
    try {
      await axios.get(`${API_URL}/api/user`)
    } catch (error) {
      console.log('🔒 [API] Ohne Token abgelehnt:', error.response?.status)
      setApiError(error.response?.status + ' (ohne Token)')
    }
  }

  const forceRefresh = async () => {
    setApiResult(null)
    setApiError(null)
    try {
      console.log('🔄 [REFRESH] Force Refresh gestartet')
      const token = await getAccessTokenSilently({ cacheMode: 'off' })
      console.log(
        '✅ [REFRESH] Neuer Access Token:',
        token.substring(0, 30) + '...'
      )
      setApiResult({
        refresh: 'erfolgreich',
        token: token.substring(0, 30) + '...',
      })
    } catch (error) {
      console.error('❌ [REFRESH] Error:', error)
      setApiError('Refresh fehlgeschlagen: ' + (error.error || error.message))
    }
  }

  const callEndpoint = async (path) => {
    setApiResult(null)
    setApiError(null)
    try {
      const token = await getAccessTokenSilently()
      console.log(`📤 [API] GET ${path}`)
      const response = await axios.get(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log(`✅ [API] ${path}:`, response.data)
      setApiResult(response.data)
    } catch (error) {
      const status = error.response?.status
      console.error(`❌ [API] ${path}: ${status}`, error.response?.data)
      setApiError(
        `${path} → ${status} ${JSON.stringify(error.response?.data || '')}`
      )
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>
        <strong>Name:</strong> {user?.name}
      </p>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={callProtectedApi}>🔐 API mit Token aufrufen</button>
        <button onClick={callWithoutToken}>🚫 API ohne Token aufrufen</button>
        <button onClick={forceRefresh}>🔄 Force Token Refresh</button>
        <button onClick={() => callEndpoint('/api/messages')}>
          📨 Messages (read:messages)
        </button>
        <button onClick={() => callEndpoint('/api/admin')}>
          🛡️ Admin (admin:access)
        </button>
      </div>

      {apiResult && (
        <pre
          style={{ background: '#e8f5e9', padding: '10px', marginTop: '20px' }}
        >
          {JSON.stringify(apiResult, null, 2)}
        </pre>
      )}
      {apiError && (
        <pre
          style={{ background: '#ffebee', padding: '10px', marginTop: '20px' }}
        >
          {apiError}
        </pre>
      )}
    </div>
  )
}
