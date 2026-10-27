import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import AuthForm from './AuthForm'

function LoginPage({ mode = 'login' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  // Logging in (or arriving already logged in) sends you where you were headed.
  if (user) return <Navigate to={location.state?.from ?? '/nearby'} replace />

  // key resets the form when moving between /login and /signup.
  return <AuthForm key={mode} initialMode={mode} message={location.state?.message} />
}

export default LoginPage
