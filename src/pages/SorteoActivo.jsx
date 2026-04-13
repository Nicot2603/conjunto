import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Header } from '../components/Header';
import { useSorteo } from '../contexts/SorteoContext';
import { useAuth } from '../contexts/AuthContext';
import { MapaInteractivo } from '../components/MapaInteractivo';

export function SorteoActivo() {
  const navigate = useNavigate();
  const { obtenerParqueaderosDisponibles, isHabilitado, isSorteoActivo, isSalaAbierta, getTipoAsignadoPorAdmin, iniciarTurnos, getTurnoActual, avanzarTurno, asignarParqueadero, asignaciones, turnos, turnoIndex, getCountdown, getCountdownEspera, getFecha, residentes, registrarAsistencia, finalizarSorteo, config, parqueaderos } = useSorteo();
  const { user } = useAuth();
  const asignado = user?.rol === 'usuario' ? getTipoAsignadoPorAdmin(user?.username) : 'ambos';

  const puedeCarro = (asignado === 'carro' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('carro');
  const puedeMoto = (asignado === 'moto' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('moto');
  const pickDefaultTipo = () => {
    if (puedeCarro && isSorteoActivo('carro')) return 'carros';
    if (puedeMoto && isSorteoActivo('moto')) return 'motos';
    if (puedeCarro && isSalaAbierta('carro')) return 'carros';
    if (puedeMoto && isSalaAbierta('moto')) return 'motos';
    if (puedeCarro) return 'carros';
    if (puedeMoto) return 'motos';
    return isHabilitado('carro') ? 'carros' : 'motos';
  };

  const [tipo, setTipo] = useState(() => pickDefaultTipo());
  const internosTipo = tipo === 'carros' ? 'carro' : 'moto';

  const activos = isSorteoActivo(internosTipo);
  const salaAbierta = isSalaAbierta(internosTipo);
  const cerrado = internosTipo === 'carro' ? !!config.cerradoCarro : !!config.cerradoMoto;
  const turnoActual = getTurnoActual(internosTipo);
  const listaTurnos = turnos[internosTipo] || [];
  const indiceTurno = turnoIndex[internosTipo] || 0;

  useEffect(() => {
    if (tipo === 'carros' && !isHabilitado('carro') && isHabilitado('moto')) setTipo('motos');
    if (tipo === 'motos' && !isHabilitado('moto') && isHabilitado('carro')) setTipo('carros');
  }, [tipo, config]);

  const espaciosTipo = parqueaderos.filter(p => p.tipo === internosTipo);
  const totalEspacios = espaciosTipo.length;
  const totalCupos = espaciosTipo.reduce((acc, p) => acc + (p.capacidad || 1), 0);
  const compartidos = espaciosTipo.filter(p => (p.capacidad || 1) > 1).length;
  
  // Si la sala está abierta pero el sorteo no ha iniciado (no hay turnos),
  // debemos mostrar la cuenta regresiva de 10 minutos (getCountdown).
  // Si el sorteo ya inició, seguimos mostrando esa misma cuenta regresiva de 10 minutos.
  // Solo mostramos getCountdownEspera cuando la sala ni siquiera ha abierto.
  const getCurrentCountdown = () => {
    if (activos || salaAbierta) return getCountdown(internosTipo);
    return getCountdownEspera(internosTipo);
  };

  const [countdown, setCountdown] = useState(getCurrentCountdown());

  const residenteActual = residentes.find(r => r.username === user?.username);
  // Nueva lógica de prioridad: puede ser boolean (legacy) o string ('carro', 'moto', 'ambos', 'ninguna')
  const esPrioridad = residenteActual && (
    residenteActual.prioridad === true || 
    residenteActual.prioridad === 'ambos' || 
    (internosTipo === 'carro' && residenteActual.prioridad === 'carro') ||
    (internosTipo === 'moto' && residenteActual.prioridad === 'moto')
  );

  const cierreDisparadoRef = useRef(false);
  const asignadosSet = new Set((asignaciones || []).map(a => a.usuario));
  const usuarioYaTieneParqueadero = !!(user?.username && asignadosSet.has(user.username));

  const elegibles = residentes.filter(r => {
    const asig = getTipoAsignadoPorAdmin(r.username) || r.tipoVehiculo || null;
    if (!asig) return false;
    if (internosTipo === 'carro') return asig === 'carro' || asig === 'carros' || asig === 'ambos';
    return asig === 'moto' || asig === 'motos' || asig === 'ambos';
  });
  const presentes = elegibles.filter(r => r.participo).length;
  const totalElegibles = elegibles.length;

  const hayPrioridadPendiente = residentes.some(r => {
    if (!r.participo) return false;
    if (!r.prioridad || r.prioridad === 'ninguna') return false;
    if (asignadosSet.has(r.username)) return false;
    
    // Verificar si tiene prioridad específicamente para este tipo
    const tienePrioridadTipo = r.prioridad === true || 
                               r.prioridad === 'ambos' || 
                               (internosTipo === 'carro' && r.prioridad === 'carro') ||
                               (internosTipo === 'moto' && r.prioridad === 'moto');
    if (!tienePrioridadTipo) return false;

    const t = getTipoAsignadoPorAdmin(r.username) || r.tipoVehiculo || null;
    if (!t) return false;
    if (internosTipo === 'carro') return t === 'carro' || t === 'carros' || t === 'ambos';
    return t === 'moto' || t === 'motos' || t === 'ambos';
  });

  useEffect(() => {
    // Registrar asistencia al sorteo si es usuario y la sala está abierta
    if (salaAbierta && user?.rol === 'usuario' && user?.username) {
      registrarAsistencia(user.username);
    }
  }, [user, salaAbierta]);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCurrentCountdown()), 1000);
    return () => clearInterval(id);
  }, [internosTipo, activos, salaAbierta, getCountdown, getCountdownEspera]);

  useEffect(() => {
    if (cierreDisparadoRef.current) return;
    if (!activos) return;
    const sinTurnos = turnoActual == null;
    const sinCupos = obtenerParqueaderosDisponibles(internosTipo).length === 0;
    const sinRegulares = listaTurnos.length === 0;
    const listoParaCerrar = !hayPrioridadPendiente && (sinTurnos || sinRegulares || sinCupos);
    if (listoParaCerrar) {
      cierreDisparadoRef.current = true;
      finalizarSorteo(internosTipo);
    }
  }, [activos, listaTurnos.length, turnoActual, internosTipo, obtenerParqueaderosDisponibles, finalizarSorteo, hayPrioridadPendiente]);

  const handleSelectSpace = async (s) => {
    if (usuarioYaTieneParqueadero) {
      await Swal.fire({
        icon: 'info',
        title: 'Ya tienes parqueadero asignado',
        text: 'No puedes seleccionar un nuevo espacio porque ya cuentas con una asignacion.'
      });
      return;
    }

    // Si el sorteo no está activo y el usuario no es prioridad, no puede hacer nada.
    if (!activos && !esPrioridad && user?.rol !== 'admin') {
      await Swal.fire({
        icon: 'info',
        title: 'Aún no inicia',
        text: 'El sorteo aún no ha iniciado.'
      });
      return;
    }

    // Verificar si puede: es admin, o es prioridad (siempre puede si el sorteo inició), o es su turno exactamente.
    const esSuTurno = turnoActual && user?.username === turnoActual;
    const puede = user?.rol === 'admin' || (esPrioridad && activos) || (!hayPrioridadPendiente && esSuTurno);
    
    if (!puede) {
      if (hayPrioridadPendiente) {
        await Swal.fire({
          icon: 'info',
          title: 'Prioridad',
          text: 'Primero deben elegir los residentes con prioridad.'
        });
        return;
      }
      if (activos && turnoActual && !esSuTurno) {
        await Swal.fire({
          icon: 'info',
          title: 'Espera tu turno',
          text: 'Aún no es tu turno. Por favor espera a que te llamen.'
        });
      } else if (!turnoActual) {
        await Swal.fire({
          icon: 'info',
          title: 'Sin turnos',
          text: 'El administrador aún no ha iniciado los turnos.'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'No permitido',
          text: 'No tienes permisos para asignar en este momento.'
        });
      }
      return;
    }
    
    // El actor es el admin asignando al turno actual, o el usuario mismo
    const actor = (user?.rol === 'admin' && turnoActual) ? { username: turnoActual } : { username: user?.username };
    
    const r = await Swal.fire({
      icon: 'question',
      title: 'Confirmar asignación',
      text: `¿Confirmas la asignación del espacio ${s.numero} a ${actor.username}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });
    if (!r.isConfirmed) return;

    const asignacion = await asignarParqueadero(s.numero, actor);
    if (!asignacion) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo asignar',
        text: 'El usuario ya tiene parqueadero o el cupo ya se llenó.'
      });
      return;
    }

    if (actor.username === turnoActual) {
      await avanzarTurno(internosTipo);
    }
  };

  const tieneAsignaciones = asignaciones.some(a => a.tipo === internosTipo);

  return (
    <div className="h-screen w-screen overflow-hidden app-bg flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-3 flex-1 flex flex-col min-h-0 w-full">
        {/* Encabezado Modular y Navegable */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-2xl p-4 mb-4 border shadow-sm shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              title="Volver al inicio"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Sorteo en curso</h2>
              <p className="text-[11px] text-gray-500 font-medium">Selecciona tu espacio haciendo clic en el número.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border w-full sm:w-auto">
            {(asignado === 'carro' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('carro') && (
              <button
                onClick={() => setTipo('carros')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'carros' ? 'bg-brand-c4 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-white'
                }`}
              >
                CARROS
              </button>
            )}
            {(asignado === 'moto' || asignado === 'ambos' || user?.rol === 'admin') && isHabilitado('moto') && (
              <button
                onClick={() => setTipo('motos')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  tipo === 'motos' ? 'bg-brand-c5 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-white'
                }`}
              >
                MOTOS
              </button>
            )}
          </div>
        </div>

        {/* Alertas de Estado */}
        <div className="shrink-0">
          {!salaAbierta && !cerrado && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold mb-4 flex items-center gap-3 animate-pulse">
              <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
              EL SORTEO PARA {internosTipo.toUpperCase()} INICIARÁ EN BREVE.
            </div>
          )}
          {/* Sala de espera: la hora de inicio ya pasó, pero el administrador no ha iniciado los turnos */}
          {salaAbierta && !activos && !cerrado && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-blue-900 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
                <span className="font-black uppercase tracking-tight text-sm">Sala de Espera Activa</span>
              </div>
              <p className="text-xs font-bold leading-relaxed">
                El sorteo iniciará automáticamente cuando ingresen todos los participantes registrados 
                (<span className="text-blue-600">{presentes}/{totalElegibles}</span>) o al cumplirse el tiempo de espera de 10 minutos. 
                Por favor, mantente en esta pantalla.
              </p>
            </div>
          )}
          {/* Solo mostrar "finalizado" si hubo asignaciones */}
          {!activos && cerrado && tieneAsignaciones && (
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-xs font-bold mb-4">
              EL SORTEO PARA {internosTipo.toUpperCase()} HA FINALIZADO.
            </div>
          )}
          {esPrioridad && activos && (
            <div className="p-3 bg-brand-c4/10 border border-brand-c4 text-brand-c4 rounded-xl text-xs font-black mb-4 flex items-center gap-3 animate-bounce">
              ⭐ ¡TIENES PRIORIDAD! PUEDES ELEGIR TU ESPACIO SIN ESPERAR TURNO.
            </div>
          )}
        </div>

        {/* Panel de Control y Mapa */}
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            {/* Estado y Tiempo */}
            <div className="bg-white rounded-2xl p-4 border shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Estado Actual</div>
                <div className="text-sm font-bold text-brand-c2 mt-1">
                  {activos ? 'SORTEO ACTIVO' : (salaAbierta ? 'EN ESPERA' : 'PRÓXIMAMENTE')}
                </div>
              </div>
              
              {!cerrado && (
                <div className="flex flex-col items-end">
                  <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">
                    {activos ? 'Turno termina en' : (salaAbierta ? 'Sorteo inicia en' : 'Inicia en')}
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(countdown).map(([k, v]) => (
                      <div key={k} className="bg-brand-c3 px-2 py-1 rounded-md border border-brand-c4/20">
                        <span className="text-sm font-black text-brand-c4 font-mono">
                          {String(v).padStart(2, '0')}{k === 'minutos' ? ':' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Turno Actual */}
            <div className="bg-white rounded-2xl p-4 border shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Turno de</div>
                <div className="text-lg font-black text-brand-c4 mt-1">
                  {turnoActual || '---'}
                </div>
              </div>
            </div>
          </div>

          {/* Mapa Interactiva */}
          {(salaAbierta || activos || cerrado) && (
            <div className="bg-white rounded-2xl border shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">
                    PLANO DE {internosTipo === 'carro' ? 'CARROS' : 'MOTOS'}
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[9px] font-black">
                    ESPACIOS: {totalEspacios}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[9px] font-black">
                    CUPOS: {totalCupos}
                  </span>
                  {internosTipo === 'carro' && (
                    <span className="px-2 py-0.5 bg-brand-c4/10 text-brand-c4 rounded-full text-[9px] font-black border border-brand-c4/20">
                      COMPARTIDOS (1-10): {compartidos}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">
                  Usa el mouse para navegar
                </div>
              </div>
              
              <div className="flex-1 min-h-0 relative">
                <MapaInteractivo 
                  tipo={tipo} 
                  turnoActual={turnoActual} 
                  onSelect={
                    (user?.rol === 'admin') ||
                    (!usuarioYaTieneParqueadero && esPrioridad && activos) ||
                    (!hayPrioridadPendiente && activos && turnoActual === user?.username)
                      ? handleSelectSpace 
                      : undefined
                  } 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
