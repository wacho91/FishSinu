import { Navigate } from 'react-router-dom';

// Este componente revisa si hay un token en el navegador.
// Si no lo hay, te manda de regreso a la página de login.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('fishsinu_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}