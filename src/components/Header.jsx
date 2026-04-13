import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSorteo } from '../contexts/SorteoContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { isSorteoActivo, isSalaAbierta, isHabilitado } = useSorteo();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const algunSorteoAbierto = isSalaAbierta('carro') || isSalaAbierta('moto');
  const algunSorteoHabilitado = isHabilitado('carro') || isHabilitado('moto');

  const menuItems = [
    { path: '/home', label: 'Inicio' }
  ];

  if (algunSorteoHabilitado || user?.rol === 'admin') {
    menuItems.push({ path: '/sorteo-activo', label: 'Sala Sorteo' });
  }

  if (user?.rol === 'admin') {
    menuItems.push({ path: '/admin', label: 'Admin' });
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="cursor-pointer" onClick={() => navigate('/home')}>
            <span className="text-lg font-bold text-gray-900 block leading-tight">
              Parques de Almazán
            </span>
            <span className="text-xs text-gray-600">Sistema de Sorteo</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    isActive
                      ? 'bg-brand-c4 text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg">
              <div className="text-sm">
                <div className="font-semibold text-gray-900">{user?.username}</div>
                <div className="text-xs text-gray-600 capitalize">{user?.tipo}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-brand-c2 text-white rounded-lg font-semibold"
            >
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-200 bg-white">
        <nav className="flex justify-around py-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  isActive
                    ? 'text-brand-c4'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
