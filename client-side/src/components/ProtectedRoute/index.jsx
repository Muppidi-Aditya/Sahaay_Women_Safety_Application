import { Navigate, Outlet } from 'react-router-dom'
import Cookies from 'js-cookie'

const ProtectedRoute = () => {
  const jwtToken = Cookies.get('auth')
  
  if (jwtToken === undefined) {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}

export default ProtectedRoute
