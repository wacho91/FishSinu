import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      localStorage.setItem('fishsinu_token', data.session.access_token);
      navigate('/');
      
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      
      {/* === FONDO DE PESCADERÍA DIFUMINADO (NUEVA IMAGEN) === */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1535399831218-d4dbf7778c5c?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      
      {/* Capa oscura difuminada para dar contraste */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/50 backdrop-blur-md"></div>
      
      {/* Marca de agua gigante con el nombre de la empresa */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-[18vw] font-extrabold text-white/5 tracking-tighter select-none">
          FishSinu
        </h1>
      </div>

      {/* Tarjeta de Login translúcida (Glassmorphism) */}
      <div className="relative z-10 max-w-md w-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">FishSinu</h1>
          <p className="text-teal-300 mt-2 text-sm font-medium tracking-wide">SISTEMA DE GESTIÓN DE PESCADERÍA</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-teal-100 mb-2">Correo electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:outline-none backdrop-blur-sm"
              placeholder="admin@fishsinu.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-teal-100 mb-2">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:outline-none backdrop-blur-sm"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-3 rounded-lg text-sm font-medium backdrop-blur-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-teal-500/30 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}