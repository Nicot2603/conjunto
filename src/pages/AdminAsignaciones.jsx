import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSorteo } from '../contexts/SorteoContext';

export function AdminAsignaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { asignaciones, residentes } = useSorteo();

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const exportarAsignacionesCSV = () => {
    const data = [
      ['Usuario', 'Apartamento', 'Parqueadero', 'Tipo', 'Torre/Ubicacion', 'Fecha Asignacion'],
      ...asignaciones.map(a => {
        const res = residentes.find(r => r.username === a.usuario);
        const apto = res ? res.apartamento : a.apartamento;
        return [a.usuario, apto, a.parqueadero, a.tipo, a.torre, a.fecha];
      })
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_asignaciones_parqueadero.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl p-6 mb-6 border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Asignaciones</h2>
          <p className="text-sm text-gray-600">Historial de parqueaderos asignados</p>
        </div>
        <button 
          onClick={exportarAsignacionesCSV}
          className="px-4 py-2 bg-brand-c4 text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Exportar a Excel (CSV)
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 pr-4">Usuario</th>
                <th className="py-3 pr-4">Apartamento</th>
                <th className="py-3 pr-4">Parqueadero</th>
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Torre/Ubicación</th>
                <th className="py-3">Fecha Asignación</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-600" colSpan={6}>No hay asignaciones registradas.</td>
                </tr>
              ) : (
                [...asignaciones].reverse().map((a, i) => {
                  const res = residentes.find(r => r.username === a.usuario);
                  const apto = res ? res.apartamento : a.apartamento;
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{a.usuario}</td>
                      <td className="py-3 pr-4">{apto}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-gray-100 px-2 py-1 rounded font-bold">{a.parqueadero}</span>
                      </td>
                      <td className="py-3 pr-4 capitalize">{a.tipo}</td>
                      <td className="py-3 pr-4">{a.torre}</td>
                      <td className="py-3 text-gray-500">{a.fecha}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
