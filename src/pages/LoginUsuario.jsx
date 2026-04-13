import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { HouseBack } from '../components/HouseBack';

export function LoginUsuario() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ingresar = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login({ rol: 'usuario', usuario, password });
    if (success) {
      navigate('/home');
    } else {
      setError('Credenciales inválidas. Verifica tu usuario y contraseña.');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden app-bg flex flex-col">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex-1 flex flex-col justify-center w-full h-full">
        <div className="mb-2">
          <HouseBack size={20} />
        </div>

        <div className="grid md:grid-cols-12 gap-4 xl:gap-6 items-stretch flex-1 min-h-0">
          <div className="hidden md:flex md:col-span-7 bg-brand-c4 text-white rounded-3xl p-6 xl:p-8 shadow-2xl flex-col justify-center overflow-hidden relative">
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
               <img
                src="/parqueadero.jpeg"
                alt="Fondo parqueadero"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="z-10 mb-4 xl:mb-6 flex-1 min-h-0 relative rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
              <img
                src="/parqueadero.jpeg"
                alt="Parqueadero del conjunto"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2 xl:space-y-4 mt-auto z-10">
              <h1 className="text-3xl xl:text-5xl font-black leading-tight drop-shadow-md">
                ¡Tu próximo parqueadero
                <span className="block text-white/90">te espera!</span>
              </h1>
            </div>
          </div>

          <div className="col-span-1 md:col-span-5 bg-white/95 backdrop-blur-sm rounded-3xl p-6 xl:p-8 shadow-xl border border-gray-100 flex flex-col justify-center overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl xl:text-3xl font-bold text-gray-900 mb-1">
                Ingreso Residente
              </h2>
              <p className="text-sm xl:text-base text-gray-600">
                Accede al sorteo de tu vehículo
              </p>
            </div>

            <form onSubmit={ingresar} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs xl:text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs xl:text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-c4 focus:border-transparent outline-none text-sm"
                  placeholder="Ej: apto101"
                  required
                />
              </div>

              <div>
                <label className="block text-xs xl:text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-c4 focus:border-transparent outline-none text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-brand-c4 text-white hover:opacity-90 transition-opacity shadow-md text-base mt-2"
              >
                Ingresar al Sorteo
              </button>
            </form>

            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => navigate('/login-admin')}
                className="px-5 py-2.5 rounded-xl border-2 border-brand-c3 text-brand-c4 font-bold hover:bg-brand-c3 transition-colors inline-flex items-center gap-2 text-sm"
              >
                Soy administrador
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
