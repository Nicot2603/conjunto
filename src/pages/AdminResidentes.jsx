import { AdminLayout } from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSorteo } from '../contexts/SorteoContext';
import { useState } from 'react';
import Swal from 'sweetalert2';

export function AdminResidentes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { agregarResidente, eliminarResidente, obtenerResidentes, asignaciones, isSalaAbierta, isSorteoActivo } = useSorteo();
  const [apartamento, setApartamento] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('carro');
  const [prioridad, setPrioridad] = useState('ninguna');

  if (user?.rol !== 'admin') {
    navigate('/login-admin');
    return null;
  }

  const residentes = obtenerResidentes();
  const sorteoEnCurso = isSalaAbierta('carro') || isSalaAbierta('moto') || isSorteoActivo('carro') || isSorteoActivo('moto');

  const exportarPrioridadCSV = () => {
    const data = [
      ['Apartamento', 'Usuario', 'Tipo Vehiculo', 'Prioridad'],
      ...residentes
        .filter(r => r.prioridad && r.prioridad !== 'ninguna')
        .map(r => [r.apartamento, r.username, r.tipoVehiculo || 'ambos', r.prioridad])
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_residentes_prioridad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl p-6 mb-6 border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Residentes</h2>
          <p className="text-sm text-gray-600">Gestión de usuarios residentes</p>
        </div>
        <button 
          onClick={exportarPrioridadCSV}
          className="px-4 py-2 bg-brand-c5 text-white rounded-lg text-sm font-semibold hover:opacity-90"
        >
          Exportar Prioritarios (CSV)
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border mb-6">
        <h3 className="text-xl font-bold mb-4">Crear residente</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <input value={apartamento} onChange={(e) => setApartamento(e.target.value)} placeholder="Apartamento" className="border rounded-lg px-3 py-2" />
          <input value={nuevoUsuario} onChange={(e) => setNuevoUsuario(e.target.value)} placeholder="Usuario" className="border rounded-lg px-3 py-2" />
          <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Contraseña" className="border rounded-lg px-3 py-2" />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Vehículo</label>
            <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="carro">Carro</option>
              <option value="moto">Moto</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">Prioridad (No tuvo parqueadero anterior)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="prioridad" value="ninguna" checked={prioridad === 'ninguna'} onChange={(e) => setPrioridad(e.target.value)} />
              Ninguna
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="prioridad" value="carro" checked={prioridad === 'carro'} onChange={(e) => setPrioridad(e.target.value)} />
              Solo Carro
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="prioridad" value="moto" checked={prioridad === 'moto'} onChange={(e) => setPrioridad(e.target.value)} />
              Solo Moto
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="prioridad" value="ambos" checked={prioridad === 'ambos'} onChange={(e) => setPrioridad(e.target.value)} />
              Ambos
            </label>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => {
              const ok = agregarResidente({ apartamento, username: nuevoUsuario, password: nuevoPassword, tipoVehiculo, prioridad });
              if (ok) {
                setApartamento(''); setNuevoUsuario(''); setNuevoPassword(''); setTipoVehiculo('carro'); setPrioridad('ninguna');
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'No se pudo crear',
                  text: 'Faltan datos o el usuario ya existe'
                });
              }
            }}
            className="px-6 py-2 bg-brand-c4 text-white rounded-lg font-bold"
          >
            Agregar
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-6 border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">Apartamento</th>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Vehículo</th>
                <th className="py-2 pr-4">Prioridad</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {residentes.length === 0 ? (
                <tr><td className="py-3 text-gray-600" colSpan={5}>Sin residentes.</td></tr>
              ) : (
                residentes.map((r, i) => (
                  (() => {
                    const tieneAsignacion = (asignaciones || []).some(a => a.usuario === r.username);
                    const noSePuedeEliminar = sorteoEnCurso || tieneAsignacion;
                    return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{r.apartamento}</td>
                    <td className="py-3 pr-4">{r.username}</td>
                    <td className="py-3 pr-4 capitalize">{r.tipoVehiculo || 'ambos'}</td>
                    <td className="py-3 pr-4">
                      {(!r.prioridad || r.prioridad === 'ninguna' || r.prioridad === false) ? (
                        <span className="text-gray-400 text-xs">Normal</span>
                      ) : (
                        <span className="bg-brand-c5/20 text-brand-c5 px-2 py-1 rounded-md text-xs font-bold capitalize">
                          {r.prioridad === true ? 'Sí' : r.prioridad}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        disabled={noSePuedeEliminar}
                        onClick={async () => {
                          if (sorteoEnCurso) {
                            await Swal.fire({
                              icon: 'info',
                              title: 'No permitido',
                              text: 'No se pueden eliminar residentes cuando el sorteo ya está en curso o la sala está abierta.'
                            });
                            return;
                          }
                          if (tieneAsignacion) {
                            await Swal.fire({
                              icon: 'info',
                              title: 'No permitido',
                              text: 'No se puede eliminar un residente que ya tiene parqueadero asignado.'
                            });
                            return;
                          }
                          const resp = await Swal.fire({
                            icon: 'warning',
                            title: 'Eliminar residente',
                            text: `¿Seguro que quieres eliminar a ${r.username}?`,
                            showCancelButton: true,
                            confirmButtonText: 'Eliminar',
                            cancelButtonText: 'Cancelar'
                          });
                          if (!resp.isConfirmed) return;
                          const ok = await eliminarResidente(r.username);
                          if (!ok) {
                            await Swal.fire({
                              icon: 'error',
                              title: 'No se pudo eliminar',
                              text: 'Puede que el sorteo ya haya iniciado o el usuario tenga asignación.'
                            });
                            return;
                          }
                          await Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            text: 'Residente eliminado correctamente.'
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-black uppercase border ${
                          noSePuedeEliminar ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                        }`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                    );
                  })()
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
