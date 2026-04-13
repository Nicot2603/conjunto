import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useSorteo } from '../contexts/SorteoContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminSorteoMonitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { parqueaderos, residentes, iniciarTurnos, getTurnoActual, turnos } = useSorteo();
  const [filtro, setFiltro] = useState('carro');

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const turnoActual = getTurnoActual(filtro);
  const listaTurnos = turnos[filtro] || [];

  const renderCard = (p) => {
    const capacidad = p.capacidad || 1;
    const ocupados = Array.isArray(p.ocupadoPor) ? p.ocupadoPor : (p.ocupadoPor ? [p.ocupadoPor] : []);
    const libre = ocupados.length < capacidad;
    const compartido = capacidad > 1;
    
    // Obtener detalles de quién ocupó (Torre y Apto)
    const ocupantesInfo = ocupados.map(username => {
      const res = residentes.find(r => r.username === username);
      return res ? `Apto ${res.apartamento}` : username;
    });

    const color =
      p.tipo === 'carro'
        ? libre
          ? 'border-brand-c4 text-brand-c4 bg-brand-c3'
          : 'border-brand-c4 text-white bg-brand-c4'
        : libre
        ? 'border-brand-c5 text-brand-c5 bg-brand-c3'
        : 'border-brand-c5 text-white bg-brand-c5';
        
    return (
      <div key={`${p.tipo}-${p.numero}`} className={`rounded-lg px-2 py-3 text-center font-bold border shadow-sm flex flex-col justify-center h-full min-h-[80px] ${color}`} title={`${p.ubicacion} • ${p.torre}`}>
        <div className="text-sm sm:text-base leading-none">{p.numero}</div>
        {compartido && <div className="text-[9px] sm:text-[10px] mt-1 opacity-80 leading-none">Compartido</div>}
        <div className="text-[9px] sm:text-[10px] mt-1 opacity-90 leading-none">{ocupados.length}/{capacidad}</div>
        {ocupantesInfo.length > 0 && (
          <div className={`text-[9px] sm:text-[10px] mt-auto pt-2 font-normal leading-tight ${libre ? 'text-gray-700' : 'text-white/90'}`}>
            {ocupantesInfo.map((info, idx) => (
              <div key={idx} className="border-t border-current/20 pt-1 mt-1 truncate">{info}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Solo mostramos los parqueaderos que tienen al menos una asignación
  const filtrados = parqueaderos.filter(p => p.tipo === filtro && p.ocupadoPor && p.ocupadoPor.length > 0);

  return (
    <AdminLayout>
      <div className="h-full flex flex-col min-h-0">
        <div className="bg-white rounded-xl p-4 mb-4 border shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Monitoreo del Sorteo</h2>
              <p className="text-xs text-gray-600">Estado en tiempo real de las asignaciones</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('carro')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${filtro === 'carro' ? 'border-brand-c4 text-brand-c4 bg-brand-c3' : 'border-gray-200'}`}
              >
                Carros
              </button>
              <button
                onClick={() => setFiltro('moto')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${filtro === 'moto' ? 'border-brand-c5 text-brand-c5 bg-brand-c3' : 'border-gray-200'}`}
              >
                Motos
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Control de Turnos */}
        <div className="bg-white rounded-xl p-4 mb-4 border shrink-0 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-gray-700">Control de Turnos ({filtro})</h3>
            <p className="text-xs text-gray-500 mt-1">
              Turno actual: <span className="font-bold text-brand-c4 text-base ml-1">{turnoActual || 'No iniciado'}</span>
            </p>
            {listaTurnos.length > 0 && (
              <p className="text-[10px] text-gray-500 mt-1">
                Siguientes: {listaTurnos.slice((turnos[filtro]?.indexOf(turnoActual) || 0) + 1, (turnos[filtro]?.indexOf(turnoActual) || 0) + 4).join(', ')}...
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border flex-1 overflow-y-auto min-h-0">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg font-medium">Aún no hay parqueaderos ocupados</p>
              <p className="text-sm mt-1">Los parqueaderos aparecerán aquí a medida que los residentes los elijan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filtrados.map(renderCard)}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
