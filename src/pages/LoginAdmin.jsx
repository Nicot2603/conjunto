import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { HouseBack } from '../components/HouseBack';

export function LoginAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ingresar = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login({ usuario, password, rol: 'admin' });
    if (success) {
      navigate('/admin');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden app-bg flex flex-col">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex-1 flex flex-col justify-center w-full h-full">
        <div className="mb-2">
          <HouseBack size={20} />
        </div>

        <div className="grid md:grid-cols-12 gap-4 xl:gap-6 items-stretch flex-1 min-h-0">
          <div className="hidden md:flex md:col-span-7 bg-brand-c4 text-white rounded-3xl p-6 xl:p-8 shadow-2xl flex-col overflow-hidden relative">
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
               <img
                src="/admin.png"
                alt="Fondo admin"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 xl:space-y-4 flex-1 flex flex-col z-10">
              <div>
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Panel Administrativo</span>
                </div>
                <div className="mb-4 flex-1 min-h-0 relative rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
                  <img
                    src="/admin.png"
                    alt="Administrador"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%23d9ceb2'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' font-family='Arial' font-size='40' fill='%237a6a53'%3EAdmin%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <h1 className="text-2xl xl:text-4xl font-black leading-tight drop-shadow-md">
                  Conjunto Residencial
                </h1>
                <h2 className="text-3xl xl:text-5xl font-black mt-1 tracking-tight drop-shadow-md">
                  Parques de Almazán
                </h2>
              </div>
              
              <p className="text-white/90 text-sm xl:text-base leading-relaxed font-medium">
                Control total del sistema de sorteos
              </p>

              <div className="grid grid-cols-3 gap-2 xl:gap-4 pt-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 xl:p-4 text-center transform hover:scale-105 transition-transform">
                  <div className="font-bold text-xs">Fechas</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Programar</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 xl:p-4 text-center transform hover:scale-105 transition-transform">
                  <div className="font-bold text-xs">Tipos</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Gestionar</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 xl:p-4 text-center transform hover:scale-105 transition-transform">
                  <div className="font-bold text-xs">Reportes</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Consultar</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-5 bg-white/95 backdrop-blur-sm rounded-3xl p-6 xl:p-8 shadow-xl border border-gray-100 flex flex-col justify-center overflow-y-auto">
            <div className="mb-6">
              <div className="mb-1">
                <h2 className="text-2xl xl:text-3xl font-bold text-gray-900">Administrador</h2>
              </div>
              <p className="text-sm text-gray-600">
                Ingresa tus credenciales de acceso
              </p>
            </div>

            <form onSubmit={ingresar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Usuario
                </label>
                <input 
                  value={usuario} 
                  onChange={(e) => setUsuario(e.target.value)} 
                  placeholder="Ingresa tu usuario" 
                  className="border-2 border-gray-200 focus:border-brand-c4 rounded-xl px-3 py-2.5 w-full transition-colors outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Ingresa tu contraseña" 
                  className="border-2 border-gray-200 focus:border-brand-c4 rounded-xl px-3 py-2.5 w-full transition-colors outline-none text-sm"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-800 font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-3 rounded-xl font-bold bg-brand-c4 text-white hover:opacity-90 transition-opacity shadow-md text-base mt-2"
              >
                Ingresar al Panel
              </button>
            </form>

            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => navigate('/login-usuario')}
                className="px-5 py-2.5 rounded-xl border-2 border-brand-c3 text-brand-c4 font-bold hover:bg-brand-c3 transition-colors inline-flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a Residente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
