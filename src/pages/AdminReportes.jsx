import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSorteo } from '../contexts/SorteoContext';

export function AdminReportes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { asignaciones, obtenerAsistencia, residentes, getTipoAsignadoPorAdmin } = useSorteo();

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const asistencia = obtenerAsistencia();
  const downloadExcel = (rows, filename) => {
    // Usar CSV para mayor compatibilidad y evitar errores de formato en Excel
    const csvContent = rows
      .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.xls', '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarAsignacionesExcel = () => {
    const rows = [
      ['Tipo', 'Torre', 'Apartamento', 'Parqueadero', 'Estado'],
      ...asignaciones.map(a => [
        a.tipoVehiculo || a.tipo || '-',
        a.torre || '-',
        a.apartamento || '-',
        a.parqueadero,
        'Asignado'
      ]),
    ];
    downloadExcel(rows, 'reporte_asignaciones.csv');
  };

  const exportarAsistenciaExcel = () => {
    const rows = [
      ['Apartamento', 'Usuario', 'Vehículo', '¿Participó?'],
      ...asistencia.map(a => [
        a.apartamento,
        a.username,
        a.tipoVehiculo,
        a.participo ? 'Sí' : 'No'
      ])
    ];
    downloadExcel(rows, 'reporte_asistencia.csv');
  };

  const exportarNoAsignadosExcel = () => {
    const asignados = new Set((asignaciones || []).map(a => a.usuario));
    const participaron = (residentes || []).filter(r => r.participo && !asignados.has(r.username));

    const carros = participaron.filter(r => {
      const t = getTipoAsignadoPorAdmin(r.username) || r.tipoVehiculo || null;
      if (!t) return false;
      return t === 'carro' || t === 'carros' || t === 'ambos';
    });
    const motos = participaron.filter(r => {
      const t = getTipoAsignadoPorAdmin(r.username) || r.tipoVehiculo || null;
      if (!t) return false;
      return t === 'moto' || t === 'motos' || t === 'ambos';
    });

    const rows = [
      ['Tipo', 'Torre', 'Apartamento', 'Estado'],
      ...carros.map(r => ['Carro', r.torre ?? '-', r.apartamento ?? '-', 'No asignado']),
      ...motos.map(r => ['Moto', r.torre ?? '-', r.apartamento ?? '-', 'No asignado']),
    ];

    downloadExcel(rows, 'no_asignados_sorteo_actual.csv');
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl p-6 mb-6 border">
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="text-sm text-gray-600">Asignaciones y asistencia al sorteo</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={exportarAsignacionesExcel}
            className="px-4 py-2 rounded-lg bg-brand-c2 text-white font-bold shadow hover:opacity-90 transition-colors"
          >
            Exportar Asignaciones
          </button>
          <button
            onClick={exportarAsistenciaExcel}
            className="px-4 py-2 rounded-lg bg-brand-c5 text-white font-bold shadow hover:opacity-90 transition-colors"
          >
            Exportar Asistencia
          </button>
          <button
            onClick={exportarNoAsignadosExcel}
            className="px-4 py-2 rounded-lg bg-brand-c4 text-white font-bold shadow hover:opacity-90 transition-colors"
          >
            Exportar No Asignados (Próxima Prioridad)
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl p-6 border">
          <h3 className="text-xl font-bold mb-4">Reporte del sorteo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Apartamento</th>
                  <th className="py-2 pr-4">Torre</th>
                  <th className="py-2 pr-4">Parqueadero</th>
                  <th className="py-2 pr-4">Tipo Automóvil</th>
                  <th className="py-2 pr-4">Periodo</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.length === 0 ? (
                  <tr>
                    <td className="py-3 text-gray-600" colSpan={7}>Sin asignaciones.</td>
                  </tr>
                ) : (
                  asignaciones.map((a, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{a.usuario}</td>
                      <td className="py-2 pr-4">{a.apartamento || '-'}</td>
                      <td className="py-2 pr-4">{a.torre || '-'}</td>
                      <td className="py-2 pr-4 font-bold">{a.parqueadero}</td>
                      <td className="py-2 pr-4">{a.tipoVehiculo || a.tipo || '-'}</td>
                      <td className="py-2 pr-4">{a.periodo}</td>
                      <td className="py-2">{a.fecha}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border">
          <h3 className="text-xl font-bold mb-4">Reporte de Asistencia al Sorteo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Apartamento</th>
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Vehículo</th>
                  <th className="py-2">¿Participó?</th>
                </tr>
              </thead>
              <tbody>
                {asistencia.length === 0 ? (
                  <tr>
                    <td className="py-3 text-gray-600" colSpan={4}>No hay residentes registrados.</td>
                  </tr>
                ) : (
                  asistencia.map((a, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{a.apartamento}</td>
                      <td className="py-2 pr-4">{a.username}</td>
                      <td className="py-2 pr-4 capitalize">{a.tipoVehiculo}</td>
                      <td className="py-2">
                        {a.participo ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold text-xs">Sí</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-semibold text-xs">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
