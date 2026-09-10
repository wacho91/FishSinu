import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Por ahora, simulamos un login para proteger la ruta.
    // Más adelante, aquí conectaremos con Supabase Auth.
    localStorage.setItem('fishsinu_token', 'dummy_token_for_dev');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">FishSinu</h1>
          <p className="text-gray-500 mt-2 text-sm">Sistema de Gestión de Pescadería</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Correo electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 dark:text-white"
              placeholder="admin@fishsinu.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 dark:text-white"
              placeholder="********"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}