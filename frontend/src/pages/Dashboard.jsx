import { useAuth0 } from '@auth0/auth0-react'

export default function Dashboard() {
  const { user, getAccessTokenSilently, isLoading } = useAuth0()

  if (isLoading) return <p>Laden...</p>

   const handleForceRefresh = async () => {
    try {
      console.log('🔄 Force Refresh gestartet...')
      const token = await getAccessTokenSilently({ cacheMode: 'off' })
      console.log('✅ Neuer Token:', token.substring(0, 30) + '...')
    } catch (error) {
      console.error('❌ Refresh Error:', error)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎉 Dashboard</h1>
      <p>
        <strong>Name:</strong> {user?.name}
      </p>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>
      {/* {accessToken && (
        <p style={{ fontSize: '12px', color: '#666' }}>
          <strong>Access Token:</strong> {accessToken.substring(0, 30)}...
        </p>
      )} */}

      <button 
        onClick={handleForceRefresh}
        style={{ padding: '8px 16px', marginTop: '20px' }}
      >
        🔄 Force Token Refresh
      </button>
    </div>
  )
}
