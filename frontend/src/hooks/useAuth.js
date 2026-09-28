import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'

export function useAuth() {
  const { getAccessTokenSilently, isAuthenticated, isLoading, user, logout } =
    useAuth0()
  const [accessToken, setAccessToken] = useState(null)
  const [isTokenLoading, setIsTokenLoading] = useState(false)

  // Hole Access Token wenn User authentifiziert ist
  useEffect(() => {
    if (!isAuthenticated) return

    async function getToken() {
      try {
        setIsTokenLoading(true)
        const token = await getAccessTokenSilently()
        setAccessToken(token)
        console.log('✅ [HOOK] Access Token geholt')
      } catch (error) {
        console.error('❌ [HOOK] Token Error:', error)
      } finally {
        setIsTokenLoading(false)
      }
    }

    getToken()
  }, [isAuthenticated, getAccessTokenSilently])

  return {
    isAuthenticated,
    isLoading: isLoading || isTokenLoading,
    user,
    accessToken,
    logout,
  }
}
