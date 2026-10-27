import { Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

// Sends logged-out visitors to /signup, then back here after they log in.
function RequireAuth({ message, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) {
    return <Navigate to="/signup" replace state={{ from: location.pathname, message }} />
  }
  return children
}

export default RequireAuth
