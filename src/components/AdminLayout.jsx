import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function AdminLayout({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const links = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/monitor', label: 'Monitoreo' },
    { path: '/admin/reportes', label: 'Reportes' },
    { path: '/admin/asignaciones', label: 'Asignaciones' },
    { path: '/admin/residentes', label: 'Residentes' },
    { path: '/admin/config', label: 'Configuración' },
  ];

  return (
    <div className="min-h-screen app-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          <aside className="bg-white rounded-2xl p-4 border sticky top-20 h-fit">
            <div className="font-bold mb-3">Admin</div>
            <div className="space-y-2">
              {links.map((l) => {
                const active = location.pathname === l.path;
                return (
                  <button
                    key={l.path}
                    onClick={() => navigate(l.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold ${
                      active ? 'bg-brand-c4 text-white' : 'text-gray-700 border'
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
