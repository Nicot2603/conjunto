import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useSorteo } from '../contexts/SorteoContext';
import { useAuth } from '../contexts/AuthContext';
import { MapaInteractivo } from '../components/MapaInteractivo';

export function MapaSeleccion() {
  const navigate = useNavigate();
  const { isHabilitado, getTipoAsignadoPorAdmin, isSalaAbierta } = useSorteo();
  const { user } = useAuth();
  
  const algunSorteoAbierto = isSalaAbierta('carro') || isSalaAbierta('moto');

  useEffect(() => {
    if (user?.rol !== 'admin' && !algunSorteoAbierto) {
      navigate('/home');
    }
  }, [user, algunSorteoAbierto, navigate]);

  const asignado = user?.rol === 'usuario' ? getTipoAsignadoPorAdmin(user?.username) : 'ambos';
  const defaultTipo = 'general';
  const [tipo, setTipo] = useState(defaultTipo);

  return (
    <div className="h-screen w-screen overflow-hidden app-bg flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-3 flex-1 flex flex-col min-h-0 w-full">
        <div className="bg-white rounded-xl p-4 mb-3 border shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Mapa del Conjunto</h2>
              <p className="text-xs text-gray-600">Navega el plano. En sorteo, haz clic en el número del espacio para elegirlo.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTipo('general')}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                  tipo === 'general'
                    ? 'border-gray-800 bg-gray-100 text-gray-900'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                General
              </button>
              {(asignado === 'carro' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('carro') && (
                <button
                  onClick={() => setTipo('carros')}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                    tipo === 'carros'
                      ? 'border-brand-c4 bg-brand-c3 text-brand-c4'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Carros
                </button>
              )}
              {(asignado === 'moto' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('moto') && (
                <button
                  onClick={() => setTipo('motos')}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                    tipo === 'motos'
                      ? 'border-brand-c5 bg-brand-c3 text-brand-c5'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Motos
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2 border flex-1 flex flex-col min-h-0 shadow-sm">
          <MapaInteractivo tipo={tipo} />
        </div>
      </div>
    </div>
  );
}
