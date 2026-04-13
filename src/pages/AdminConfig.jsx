import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSorteo } from '../contexts/SorteoContext';
import Swal from 'sweetalert2';

export function AdminConfig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { config, toggleHabilitar, setFecha, getFecha, reiniciarBaseDeDatos, limpiarDatosLocales } = useSorteo();

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl p-6 mb-6 border">
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-sm text-gray-600">Fechas y habilitación de sorteos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Habilitar Carros</span>
            <button
              onClick={() => toggleHabilitar('carro', !config.habilitarCarros)}
              className={`px-3 py-2 rounded-lg font-semibold ${config.habilitarCarros ? 'bg-brand-c3 text-brand-c4' : 'bg-gray-100 text-gray-600'}`}
            >
              {config.habilitarCarros ? 'Activo' : 'Inactivo'}
            </button>
          </div>
          <label className="text-sm text-gray-600">Fecha y hora de inicio</label>
          <input
            type="datetime-local"
            value={(d => { const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` })(getFecha('carro'))}
            onChange={(e) => setFecha('carro', new Date(e.target.value).toISOString())}
            className="mt-2 w-full border-2 border-brand-c3 rounded-lg px-3 py-2"
          />
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Habilitar Motos</span>
            <button
              onClick={() => toggleHabilitar('moto', !config.habilitarMotos)}
              className={`px-3 py-2 rounded-lg font-semibold ${config.habilitarMotos ? 'bg-brand-c3 text-brand-c5' : 'bg-gray-100 text-gray-600'}`}
            >
              {config.habilitarMotos ? 'Activo' : 'Inactivo'}
            </button>
          </div>
          <label className="text-sm text-gray-600">Fecha y hora de inicio</label>
          <input
            type="datetime-local"
            value={(d => { const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` })(getFecha('moto'))}
            onChange={(e) => setFecha('moto', new Date(e.target.value).toISOString())}
            className="mt-2 w-full border-2 border-brand-c3 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 border">
        <h3 className="text-lg font-bold">Reiniciar base de datos</h3>
        <p className="text-sm text-gray-600 mt-1">Borra asignaciones, turnos, cierres y vuelve a cargar el mapa base.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              const r = await Swal.fire({
                icon: 'warning',
                title: 'Reiniciar base de datos',
                text: 'Esto borrará asignaciones, turnos y cierres.',
                showCancelButton: true,
                confirmButtonText: 'Reiniciar',
                cancelButtonText: 'Cancelar'
              });
              if (!r.isConfirmed) return;
              const ok = await reiniciarBaseDeDatos();
              if (!ok) {
                await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo reiniciar la base de datos.' });
                return;
              }
              await Swal.fire({ icon: 'success', title: 'Listo', text: 'Base de datos reiniciada.' });
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold shadow hover:bg-red-700 transition-colors"
          >
            Reiniciar ahora
          </button>
          <button
            onClick={async () => {
              await limpiarDatosLocales();
              await Swal.fire({ icon: 'success', title: 'Listo', text: 'Datos sincronizados desde la base de datos.' });
            }}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white font-bold shadow hover:bg-gray-900 transition-colors"
          >
            Borrar datos locales
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
