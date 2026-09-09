import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/pos', label: 'Punto de venta', icon: '🛒' },
  { to: '/sales', label: 'Ventas', icon: '🧾' },
  { to: '/inventory', label: 'Inventario', icon: '📦' },
  { to: '/products', label: 'Productos', icon: '🐟' },
  { to: '/categories', label: 'Categorías', icon: '🗂️' },
  { to: '/customers', label: 'Clientes', icon: '👥' },
  { to: '/credit-accounts', label: 'Créditos', icon: '💳' },
  { to: '/invoices', label: 'Facturas', icon: '📄' },
  { to: '/settings', label: 'Configuración', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-lg text-white">
          🐟
        </span>
        <div>
          <p className="text-base font-bold leading-tight text-slate-800">FishSinu</p>
          <p className="text-[11px] text-slate-400">ERP Marítimo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
