import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { useSorteo } from '../contexts/SorteoContext';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCountdown, getCountdownEspera, isSorteoActivo, isSalaAbierta, isHabilitado, getFechaApertura, getTipoAsignadoPorAdmin, parqueaderos, obtenerResidentes } = useSorteo();
  const asignado = user?.rol === 'usuario' ? getTipoAsignadoPorAdmin(user?.username) : 'ambos';
  
  const getCurrentCountdown = (tipo) => {
    if (isSorteoActivo(tipo) || isSalaAbierta(tipo)) return getCountdown(tipo);
    return getCountdownEspera(tipo);
  };

  const [countdownCarros, setCountdownCarros] = useState(getCurrentCountdown('carro'));
  const [countdownMotos, setCountdownMotos] = useState(getCurrentCountdown('moto'));
  
  const total = parqueaderos.length;
  const totalCarros = parqueaderos.filter(p => p.tipo === 'carro').length;
  const totalMotos = parqueaderos.filter(p => p.tipo === 'moto').length;
  const cuposCarros = parqueaderos.filter(p => p.tipo === 'carro').reduce((acc, p) => acc + (p.capacidad || 1), 0);
  const cuposMotos = parqueaderos.filter(p => p.tipo === 'moto').reduce((acc, p) => acc + (p.capacidad || 1), 0);
  const compartidosCarros = parqueaderos.filter(p => p.tipo === 'carro' && (p.capacidad || 1) > 1).length;
  const participantes = obtenerResidentes().length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownCarros(getCurrentCountdown('carro'));
      setCountdownMotos(getCurrentCountdown('moto'));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSorteoActivo, isSalaAbierta]);

  const handleIngresarSorteo = (tipo) => {
    navigate('/sorteo-activo');
  };

  const CountdownDisplay = ({ countdown }) => (
    <div className="flex justify-center gap-3 sm:gap-6 my-2 sm:my-6">
      {Object.entries(countdown).map(([key, value]) => (
        <div key={key} className="text-center">
          <div className="bg-white rounded-lg px-3 py-2 sm:px-6 sm:py-4 shadow-md min-w-[60px] sm:min-w-[80px] border border-gray-100">
            <span className="text-2xl sm:text-4xl font-black text-brand-c4 block drop-shadow-sm">
              {String(value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-600 uppercase mt-2 block font-bold tracking-wider">
            {key}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col min-h-0 w-full relative">
        
        {/* Banner Principal Inmersivo */}
        <div className="bg-brand-c4 text-white rounded-3xl p-6 sm:p-10 mb-6 shrink-0 shadow-xl relative overflow-hidden group">
           <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105">
               <img
                src="/parqueadero.jpeg"
                alt="Fondo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-c4/90 to-transparent z-0"></div>
            
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left max-w-xl">
              <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-3 border border-white/30">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Sistema de Asignación
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 leading-tight drop-shadow-lg">
                Elige tu espacio ideal
              </h1>
              <p className="text-sm sm:text-base text-white/90 font-medium max-w-md">
                Participa en el sorteo de parqueaderos de forma transparente, rápida y en tiempo real.
              </p>
            </div>
            
            {/* Stats Rápidas en el Banner */}
            <div className="hidden sm:flex gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
              <div className="text-center">
                <div className="text-4xl font-black text-white drop-shadow-md">{total}</div>
                <div className="text-[10px] uppercase font-bold text-white/80 mt-1">Espacios</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-white drop-shadow-md">{participantes}</div>
                <div className="text-[10px] uppercase font-bold text-white/80 mt-1">Participantes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-4 pr-1 -mr-1">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            
            {/* Tarjeta Sorteo Carros */}
            {(asignado === 'carro' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('carro') && (
            <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 flex flex-col shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-c4"></div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Sorteo Carros</h3>
                    <p className="text-sm font-semibold text-brand-c4 mt-1">
                      Inicio: {getFechaApertura('carro').toLocaleString('es-CO')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 border">Espacios: {totalCarros}</span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 border">Cupos: {cuposCarros}</span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-brand-c4/10 text-brand-c4 border border-brand-c4/20">Compartidos: {compartidosCarros}</span>
                    </div>
                  </div>
                  <div className="bg-brand-c3 text-brand-c4 p-3 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 my-auto border border-gray-100">
                  <CountdownDisplay countdown={countdownCarros} />
                </div>

                <button
                  onClick={() => handleIngresarSorteo('carros')}
                  className="w-full py-3 px-6 bg-brand-c4 text-white font-black rounded-2xl shadow-lg hover:bg-brand-c4/90 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  INGRESAR AL SORTEO
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
            )}

            {/* Tarjeta Sorteo Motos */}
            {(asignado === 'moto' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('moto') && (
            <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 flex flex-col shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-c5"></div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Sorteo Motos</h3>
                    <p className="text-sm font-semibold text-brand-c5 mt-1">
                      Inicio: {getFechaApertura('moto').toLocaleString('es-CO')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 border">Espacios: {totalMotos}</span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700 border">Cupos: {cuposMotos}</span>
                    </div>
                  </div>
                  <div className="bg-brand-c3 text-brand-c5 p-3 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 my-auto border border-gray-100">
                  <CountdownDisplay countdown={countdownMotos} />
                </div>

                <button
                  onClick={() => handleIngresarSorteo('motos')}
                  className="w-full py-3 px-6 bg-brand-c5 text-white font-black rounded-2xl shadow-lg hover:bg-brand-c5/90 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  INGRESAR AL SORTEO
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
