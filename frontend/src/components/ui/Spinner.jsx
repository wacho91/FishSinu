export default function Spinner({ size = 'md', fullContent = false }) {
  // === MODO PANTALLA COMPLETA CON LOGO FS ===
  if (fullContent) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] w-full">
        <div className="flex flex-col items-center gap-6">
          
          {/* Logo FS Animado (SVG) */}
          <div className="relative w-24 h-24 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" /> {/* Teal */}
                  <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="22" fill="url(#logoGrad)" />
              <text x="50" y="50" fontFamily="Arial, sans-serif" fontSize="52" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="central">FS</text>
            </svg>
          </div>
          
          {/* Barra de progreso fluida */}
          <div className="w-56 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
          
          <p className="text-slate-400 dark:text-gray-500 text-sm font-medium animate-pulse">Cargando módulo...</p>
        </div>
        
        {/* Animación CSS inyectada */}
        <style>{`
          @keyframes loading {
            0% { width: 0% }
            50% { width: 70% }
            100% { width: 100% }
          }
        `}</style>
      </div>
    )
  }

  // === MODO SPINNER PEQUEÑO (Para botones o tablas) ===
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }
  return (
    <div className={`${sizes[size]} border-slate-200 dark:border-gray-700 border-t-teal-600 rounded-full animate-spin`} />
  )
}