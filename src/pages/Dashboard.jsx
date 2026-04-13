import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useSorteo } from '../contexts/SorteoContext';

export function Dashboard() {
  const { user } = useAuth();
  const { obtenerAsignacionUsuario, getTipoAsignadoPorAdmin } = useSorteo();
  const asignacion = obtenerAsignacionUsuario(user?.username);
  const tipoAsignado = user ? getTipoAsignadoPorAdmin(user.username) : null;

  return (
    <div className="min-h-screen app-bg">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border">
            <h2 className="text-2xl font-bold mb-4">Mi estado en el sorteo</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-gray-600">Tipo configurado</p>
                <p className="text-xl font-bold uppercase text-brand-c4">{tipoAsignado ?? 'Sin asignación'}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-gray-600">Usuario</p>
                <p className="text-xl font-bold text-brand-c2">{user?.username}</p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900">
              Prototipo: aquí se mostraría tu turno y la selección realizada durante el sorteo en vivo.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border">
            <h3 className="text-xl font-bold mb-4">Fechas del sorteo</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>• Carros: 25 Feb 2026 – 10:00 AM</li>
              <li>• Motos: 25 Feb 2026 – 3:00 PM</li>
            </ul>

            <div className="mt-6">
              <div className="text-brand-c4 font-semibold">Resultado</div>
              <div className="mt-2 p-4 rounded-lg border">
                {asignacion ? (
                  <div className="text-sm">
                    <p className="font-bold">Parqueadero: {asignacion.parqueadero}</p>
                    <p>Torre: {asignacion.torre}</p>
                    <p>Periodo: {asignacion.periodo}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Aún no tienes un parqueadero asignado en este prototipo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
