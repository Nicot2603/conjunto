import { createContext, useContext, useState, useEffect } from 'react';
import { apiEnabled, api } from '../utils/api';

const SorteoContext = createContext();

export function SorteoProvider({ children }) {
  const GRACE_MS = 10 * 60 * 1000;
  const defaultsConfig = (() => {
    const ahora = Date.now();
    return {
      fechaCarros: new Date(ahora + 15 * 24 * 60 * 60 * 1000).toISOString(),
      fechaMotos: new Date(ahora + 15 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      habilitarCarros: true,
      habilitarMotos: true,
      cerradoCarro: false,
      cerradoMoto: false,
      ultimoNoAsignadosCarro: [],
      ultimoNoAsignadosMoto: [],
    };
  })();

  const [parqueaderos, setParqueaderos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [config, setConfig] = useState(defaultsConfig);
  const [tipoAsignado, setTipoAsignado] = useState({});
  const [turnos, setTurnos] = useState({ carro: [], moto: [] });
  const [turnoIndex, setTurnoIndex] = useState({ carro: 0, moto: 0 });

  const syncFromApi = async () => {
    try {
      const snap = await api.getSnapshot();
      if (!snap) return;
      const { parqueaderos: p, asignaciones: a, residentes: r, config: cfg, tipoAsignado: tAsign, turnos: t, turnoIndex: tIdx } = snap;
      if (Array.isArray(p)) setParqueaderos(migrarParqueaderos(p));
      if (Array.isArray(a)) setAsignaciones(a);
      if (Array.isArray(r)) setResidentes(r);
      if (cfg && typeof cfg === 'object') setConfig({ ...defaultsConfig, ...cfg });
      if (tAsign && typeof tAsign === 'object') setTipoAsignado(tAsign);
      if (t && typeof t === 'object') setTurnos(t);
      if (tIdx && typeof tIdx === 'object') setTurnoIndex(tIdx);
      return snap;
    } catch {}
  };

  // Cargar siempre desde la base de datos (sin localStorage / IndexedDB)
  useEffect(() => {
    (async () => {
      await syncFromApi();
    })();
  }, []);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    const tick = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        await syncFromApi();
      } finally {
        inFlight = false;
      }
    };
    const id = setInterval(tick, 1500);
    tick();
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []);

  // Generar turnos automáticamente cuando se alcanza la fecha del sorteo si no hay turnos generados
  useEffect(() => {
    const id = setInterval(() => {
      const ahora = Date.now();
      ['carro', 'moto'].forEach(tipo => {
        if (!isHabilitado(tipo)) return;
        const cerrado = tipo === 'carro' ? config.cerradoCarro : config.cerradoMoto;
        if (cerrado) return;

        const fecha = getFecha(tipo).getTime();
        if (ahora < fecha) return; // Sala no abierta

        const t = turnos[tipo] || [];
        if (t.length > 0) return; // Ya inició

        // Contar presentes vs elegibles
        const elegibles = residentes.filter(r => {
          const asig = tipoAsignado[r.username];
          if (!asig) return false;
          if (tipo === 'carro') return asig === 'carro' || asig === 'carros' || asig === 'ambos';
          if (tipo === 'moto') return asig === 'moto' || asig === 'motos' || asig === 'ambos';
          return false;
        });
        
        const presentes = elegibles.filter(r => r.participo).length;
        const limite = fecha + GRACE_MS;
        
        if (ahora >= limite || (elegibles.length > 0 && presentes >= elegibles.length)) {
           if (residentes.length > 0) {
             iniciarTurnosInterno(tipo);
           }
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [config, residentes, turnos, tipoAsignado]);

  function inicializarParqueaderos() {
    const p = [];

    // --- CARROS ---
    // 1 a 9 (Compartidos, Abajo de Torre 5)
    for (let i = 1; i <= 9; i++) {
      p.push({
        numero: String(i),
        tipo: 'carro',
        capacidad: 2,
        ocupadoPor: [],
        torre: 'Torre 5',
        ubicacion: 'Abajo de Torre 5'
      });
    }
    p.push({
      numero: '10c',
      tipo: 'carro',
      capacidad: 2,
      ocupadoPor: [],
      torre: 'Torre 5',
      ubicacion: 'Abajo de Torre 5'
    });

    // 01 a 10 (Individuales, Al lado de Torre 8)
    for (let i = 1; i <= 10; i++) {
      p.push({
        numero: String(i).padStart(2, '0'), // Guardados como "01", "02" para diferenciarlos
        tipo: 'carro',
        capacidad: 1,
        ocupadoPor: [],
        torre: 'Torre 8',
        ubicacion: 'Al lado de Torre 8'
      });
    }

    // 12 a 20 (Vertical)
    for (let i = 12; i <= 20; i++) {
      p.push({
        numero: String(i),
        tipo: 'carro',
        capacidad: 1,
        ocupadoPor: [],
        torre: 'Torre 6/7',
        ubicacion: 'Tramo vertical derecho'
      });
    }

    // 26 a 38 (Inferior)
    const bottom = [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
    for (let i of bottom) {
      p.push({
        numero: String(i),
        tipo: 'carro',
        capacidad: 1,
        ocupadoPor: [],
        torre: obtenerTorre(i),
        ubicacion: 'Tramo inferior'
      });
    }

    // --- MOTOS ---
    // M1 a M10 (Abajo Torre 8)
    for (let i = 1; i <= 10; i++) {
      p.push({
        numero: `M${i}`,
        tipo: 'moto',
        capacidad: 1,
        ocupadoPor: [],
        torre: 'Torre 8',
        ubicacion: 'Abajo Torre 8'
      });
    }

    // Moto 11
    p.push({
      numero: '11',
      tipo: 'moto',
      capacidad: 1,
      ocupadoPor: [],
      torre: 'Torre 5',
      ubicacion: 'Vertical'
    });

    // M12 a M20 (Vertical Moto)
    for (let i = 12; i <= 20; i++) {
      p.push({
        numero: `M${i}`,
        tipo: 'moto',
        capacidad: 1,
        ocupadoPor: [],
        torre: 'Vertical Moto',
        ubicacion: 'Tramo Moto'
      });
    }
    
    // M21, M22
    p.push({numero: 'M21', tipo: 'moto', capacidad: 1, ocupadoPor: [], torre: 'Vertical Moto', ubicacion: 'Horizontal'});
    p.push({numero: 'M22', tipo: 'moto', capacidad: 1, ocupadoPor: [], torre: 'Vertical Moto', ubicacion: 'Horizontal'});

    // M23 a M26 (Arriba Moto)
    for (let i = 23; i <= 26; i++) {
      p.push({
        numero: `M${i}`,
        tipo: 'moto',
        capacidad: 1,
        ocupadoPor: [],
        torre: 'Arriba',
        ubicacion: 'Arriba Moto'
      });
    }

    return p;
  }
  function migrarParqueaderos(lista) {
    const base = inicializarParqueaderos();
    const remotos = Array.isArray(lista) ? lista : [];
    const remotoPorNumero = new Map(remotos.map((p) => [String(p.numero), p]));

    const normalizar = (p, fallback = {}) => {
      const ocupadoRaw = p?.ocupadoPor;
      const ocupadoPor = Array.isArray(ocupadoRaw)
        ? ocupadoRaw
        : (ocupadoRaw ? [ocupadoRaw] : []);

      return {
        ...fallback,
        ...p,
        numero: String(p?.numero ?? fallback.numero ?? ''),
        tipo: p?.tipo || fallback.tipo || '',
        capacidad: Number(p?.capacidad ?? fallback.capacidad ?? 1) || 1,
        ocupadoPor
      };
    };

    const mezclados = base.map((b) => {
      const remoto = remotoPorNumero.get(String(b.numero));
      return remoto ? normalizar(remoto, b) : b;
    });

    const existentes = new Set(mezclados.map((p) => String(p.numero)));
    const extras = remotos
      .filter((p) => !existentes.has(String(p.numero)))
      .map((p) => normalizar(p));

    return [...mezclados, ...extras];
  }

  function obtenerTorre(numero) {
    if (numero >= 34 && numero <= 38) return 'Torres 1, 2';
    if (numero >= 26 && numero <= 33) return 'Torres 3, 4';
    if (numero >= 1 && numero <= 10) return 'Torre 5';
    if (numero >= 12 && numero <= 20) return 'Torre 6/7';
    return 'Otro';
  }

  function obtenerUbicacion(numero) {
    if (numero >= 26 && numero <= 38) return 'Tramo inferior';
    if (numero >= 1 && numero <= 10) return 'Torre 5';
    if (numero >= 12 && numero <= 20) return 'Tramo vertical derecho';
    return 'Ver mapa';
  }

  const asignarParqueadero = async (numeroParqueadero, usuario) => {
    if (asignaciones.some(a => a.usuario === usuario.username)) return null;
    if (apiEnabled) {
      try {
        await api.asignarParqueadero(numeroParqueadero, usuario.username);
        const snap = await syncFromApi().catch(() => null);
        const found = snap?.asignaciones?.find(a => a.usuario === usuario.username);
        return found || { usuario: usuario.username, parqueadero: numeroParqueadero };
      } catch {
        // Siempre intentar re-sincronizar para evitar estados visuales inconsistentes.
        await syncFromApi().catch(() => {});
        return null;
      }
    }
    let asigno = false;
    const nuevosParqueaderos = parqueaderos.map(p => {
      if (p.numero === numeroParqueadero) {
        const capacidad = p.capacidad || 1;
        const ocupados = Array.isArray(p.ocupadoPor) ? p.ocupadoPor : (p.ocupadoPor ? [p.ocupadoPor] : []);
        if (ocupados.includes(usuario.username)) {
          return p;
        }
        if (ocupados.length < capacidad) {
          const nuevoOcupados = [...ocupados, usuario.username];
          asigno = true;
          return {
            ...p,
            ocupadoPor: nuevoOcupados,
            fechaAsignacion: new Date().toISOString()
          };
        }
      }
      return p;
    });
    if (!asigno) return null;

    const pInfo = parqueaderos.find(p => p.numero === numeroParqueadero);
    const residente = residentes.find(r => r.username === usuario.username);
    const nuevaAsignacion = {
      usuario: usuario.username,
      parqueadero: numeroParqueadero,
      tipo: pInfo?.tipo || null,
      fecha: new Date().toLocaleDateString('es-CO'),
      periodo: 'Feb 2026 - Abr 2026',
      torre: residente?.torre || pInfo?.torre || '-',
      apartamento: residente?.apartamento || '-',
      motivo: 'sorteo',
      tipoVehiculo: residente?.tipoVehiculo || pInfo?.tipo || '-'
    };

    setParqueaderos(nuevosParqueaderos);
    setAsignaciones([...asignaciones, nuevaAsignacion]);

    console.log('[asignarParqueadero] Nuevos parqueaderos después de asignación:', nuevosParqueaderos);

    // Avanzar al siguiente turno después de una asignación exitosa
    avanzarTurno(pInfo?.tipo);

    return nuevaAsignacion;
  };

  const obtenerParqueaderosDisponibles = (tipo) => {
    return parqueaderos.filter(p => {
      if (p.tipo !== tipo) return false;
      const capacidad = p.capacidad || 1;
      const ocupados = Array.isArray(p.ocupadoPor) ? p.ocupadoPor.length : (p.ocupadoPor ? 1 : 0);
      return ocupados < capacidad;
    });
  };

  const obtenerAsignacionUsuario = (username) => {
    return asignaciones.find(a => a.usuario === username);
  };
  const obtenerResidentes = () => residentes;
  const agregarResidente = ({ apartamento, username, password, tipoVehiculo, prioridad }) => {
    if (!username || !password || !apartamento) return false;
    const existe = residentes.some(r => r.username.toLowerCase() === username.toLowerCase());
    if (existe) return false;
    if (apiEnabled) api.addResidente({ apartamento, username, password, tipoVehiculo, prioridad }).catch(() => {});
    const nuevo = [...residentes, { apartamento, username, password, tipoVehiculo, prioridad }];
    setResidentes(nuevo);
    
    // Asignar el tipo por admin
    const nuevaAsignacion = { ...tipoAsignado, [username]: tipoVehiculo };
    setTipoAsignado(nuevaAsignacion);
    
    syncFromApi();
    return true;
  };

  const eliminarResidente = async (username) => {
    if (!apiEnabled) return false;
    try {
      await api.deleteResidente(username);
      await syncFromApi();
      return true;
    } catch {
      return false;
    }
  };
  const obtenerNoAsignados = (tipo) => {
    const participantes = residentes.filter(r => {
      // Solo contar a los que participaron (ingresaron a la sala de sorteo)
      if (!r.participo) return false;

      const t = getTipoAsignadoPorAdmin(r.username);
      if (!t) return false;
      if (tipo === 'carro') return t === 'carro' || t === 'carros' || t === 'ambos';
      if (tipo === 'moto') return t === 'moto' || t === 'motos' || t === 'ambos';
      return false;
    });
    const asignadosUsernames = asignaciones.map(a => a.usuario);
    return participantes.filter(r => !asignadosUsernames.includes(r.username));
  };

  const registrarAsistencia = (username) => {
    if (apiEnabled) {
      api.registrarAsistencia(username).then(() => syncFromApi()).catch(() => {});
      return;
    }
    setResidentes(prev => {
      const idx = prev.findIndex(r => r.username === username);
      if (idx === -1 || prev[idx].participo) return prev;
      const nuevo = [...prev];
      nuevo[idx] = { ...nuevo[idx], participo: true };
      return nuevo;
    });
  };

  const obtenerAsistencia = () => {
    return residentes.map(r => ({
      apartamento: r.apartamento,
      username: r.username,
      tipoVehiculo: r.tipoVehiculo,
      participo: !!r.participo
    }));
  };

  const toggleHabilitar = (tipo, valor) => {
    const nueva = {
      ...config,
      habilitarCarros: tipo === 'carro' ? valor : config.habilitarCarros,
      habilitarMotos: tipo === 'moto' ? valor : config.habilitarMotos,
    };
    setConfig(nueva);
    if (apiEnabled) api.setConfig(nueva).catch(() => {});
    syncFromApi();
  };

  const setFecha = (tipo, fechaISO) => {
    const nueva = {
      ...config,
      fechaCarros: tipo === 'carro' ? fechaISO : config.fechaCarros,
      fechaMotos: tipo === 'moto' ? fechaISO : config.fechaMotos,
      cerradoCarro: tipo === 'carro' ? false : config.cerradoCarro,
      cerradoMoto: tipo === 'moto' ? false : config.cerradoMoto,
    };
    setConfig(nueva);
    if (apiEnabled) api.setConfig(nueva).catch(() => {});
    syncFromApi();
  };

  const getFecha = (tipo) => tipo === 'carro' ? new Date(config.fechaCarros || Date.now()) : new Date(config.fechaMotos || Date.now());
  const getFechaApertura = (tipo) => new Date(getFecha(tipo).getTime() + GRACE_MS);

  const isHabilitado = (tipo) => tipo === 'carro' ? config.habilitarCarros : config.habilitarMotos;

  const isSalaAbierta = (tipo) => {
    const fecha = getFecha(tipo).getTime();
    const cerrado = tipo === 'carro' ? config.cerradoCarro : config.cerradoMoto;
    // Si ya inició (hay turnos), la sala sigue abierta
    const t = turnos[tipo] || [];
    return isHabilitado(tipo) && !cerrado && (Date.now() >= fecha || t.length > 0);
  };

  const isSorteoActivo = (tipo) => {
    const cerrado = tipo === 'carro' ? config.cerradoCarro : config.cerradoMoto;
    const t = turnos[tipo] || [];
    return isHabilitado(tipo) && !cerrado && t.length > 0;
  };

  const getCountdownTo = (objetivo) => {
    let diff = Math.max(0, objetivo - Date.now());
    const dias = Math.floor(diff / (24 * 60 * 60 * 1000));
    diff -= dias * 24 * 60 * 60 * 1000;
    const horas = Math.floor(diff / (60 * 60 * 1000));
    diff -= horas * 60 * 60 * 1000;
    const minutos = Math.floor(diff / (60 * 1000));
    diff -= minutos * 60 * 1000;
    const segundos = Math.floor(diff / 1000);
    return { dias, horas, minutos, segundos };
  };

  const getCountdown = (tipo) => getCountdownTo(getFechaApertura(tipo).getTime());
  const getCountdownEspera = (tipo) => getCountdownTo(getFecha(tipo).getTime());
  const setTipoAsignadoPorAdmin = (username, tipo) => {
    const nueva = { ...tipoAsignado, [username]: tipo };
    setTipoAsignado(nueva);
    if (apiEnabled) api.setTipoAsignado({ username, tipo }).catch(() => {});
    syncFromApi();
    return tipo;
  };
  const getTipoAsignadoPorAdmin = (username) => tipoAsignado[username] || null;
  const tieneAsignacion = (username, listaAsignaciones = asignaciones) => {
    if (!username) return false;
    return (listaAsignaciones || []).some(a => a.usuario === username);
  };
  const calcularTurnoDisponible = (tipo, lista = turnos[tipo] || [], idx = turnoIndex[tipo] || 0, listaAsignaciones = asignaciones) => {
    const start = Math.max(0, Number(idx) || 0);
    for (let i = start; i < lista.length; i++) {
      const candidato = lista[i];
      if (!tieneAsignacion(candidato, listaAsignaciones)) {
        return { turno: candidato, idx: i };
      }
    }
    return { turno: null, idx: lista.length };
  };

  const iniciarTurnosInterno = (tipo) => {
    // Filtramos manualmente los no asignados
    let participantes = residentes.filter(r => {
      // Excluir a "Pero" de los participantes
      if (r.username === 'Pero') return false;
      return true;
    });

    participantes = participantes.filter(r => {
      // Los que tienen prioridad no necesitan haber participado
      // La prioridad puede ser true (legacy) o un string ('carro', 'moto', 'ambos')
      const tienePrioridadEnEsteTipo = r.prioridad === true || 
                                      (tipo === 'carro' && (r.prioridad === 'carro' || r.prioridad === 'ambos')) ||
                                      (tipo === 'moto' && (r.prioridad === 'moto' || r.prioridad === 'ambos'));
      
      if (tienePrioridadEnEsteTipo) return true;
      // Solo contar a los que participaron (ingresaron a la sala de sorteo)
      if (!r.participo) return false;
      return true;
    });

    participantes = participantes.filter(r => {
      const t = tipoAsignado[r.username] || null;
      if (!t) return false;
      if (tipo === 'carro') return t === 'carro' || t === 'carros' || t === 'ambos';
      if (tipo === 'moto') return t === 'moto' || t === 'motos' || t === 'ambos';
      return false;
    });

    participantes = participantes.filter(r => !asignaciones.some(a => a.usuario === r.username));
    
    // Separar los que tienen prioridad (los que no tuvieron parqueadero antes)
    const prioridad = participantes.filter(r => {
      return r.prioridad === true || 
             (tipo === 'carro' && (r.prioridad === 'carro' || r.prioridad === 'ambos')) ||
             (tipo === 'moto' && (r.prioridad === 'moto' || r.prioridad === 'ambos'));
    });
    const regulares = participantes.filter(r => {
      return !r.prioridad || r.prioridad === 'ninguna' || r.prioridad === false || (
        (tipo === 'carro' && r.prioridad === 'moto') ||
        (tipo === 'moto' && r.prioridad === 'carro')
      );
    });
    
    // Mezclar (shuffle) aleatoriamente a los regulares
    for (let i = regulares.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [regulares[i], regulares[j]] = [regulares[j], regulares[i]];
    }

    // Unir las listas: Primero prioridad (pueden o no estar mezclados, los dejamos tal cual o también se pueden mezclar si son varios)
    // Luego los regulares que sí fueron sorteados
    const ordenados = [...prioridad, ...regulares];
    const nombres = ordenados.map(p => p.username);
    if (apiEnabled) {
      api.iniciarTurnos(tipo)
        .then(() => api.getSnapshot())
        .then((snap) => {
          if (!snap) return;
          if (snap.turnos && typeof snap.turnos === 'object') setTurnos(snap.turnos);
          if (snap.turnoIndex && typeof snap.turnoIndex === 'object') setTurnoIndex(snap.turnoIndex);
        })
        .catch(() => {});
    }
    
    const nuevoTurnos = { ...turnos, [tipo]: nombres };
    const nuevoIndex = { ...turnoIndex, [tipo]: 0 };
    setTurnos(nuevoTurnos);
    setTurnoIndex(nuevoIndex);
    syncFromApi();
    return nombres;
  };

  const iniciarTurnos = (tipo) => {
    return iniciarTurnosInterno(tipo);
  };
  const getTurnoActual = (tipo) => {
    const lista = turnos[tipo] || [];
    const idx = turnoIndex[tipo] || 0;
    if (!lista.length) return null;
    const next = calcularTurnoDisponible(tipo, lista, idx, asignaciones);
    return next.turno;
  };
  const avanzarTurno = async (tipo) => {
    if (apiEnabled) {
      try {
        const maxSaltos = Math.max((turnos[tipo] || []).length + 2, 3);
        for (let i = 0; i < maxSaltos; i++) {
          await api.avanzarTurno(tipo);
          const snap = await syncFromApi();
          const listaSnap = snap?.turnos?.[tipo] || turnos[tipo] || [];
          const idxSnap = snap?.turnoIndex?.[tipo] ?? turnoIndex[tipo] ?? 0;
          const asigSnap = Array.isArray(snap?.asignaciones) ? snap.asignaciones : asignaciones;
          const next = calcularTurnoDisponible(tipo, listaSnap, idxSnap, asigSnap);
          if (!next.turno) return null;
          if (next.idx === idxSnap) return next.turno;
        }
        return null;
      } catch {
        return null;
      }
    }

    const lista = turnos[tipo] || [];
    if (!lista.length) return null;
    const currentIndex = typeof turnoIndex[tipo] === 'number' ? turnoIndex[tipo] : 0;
    const siguiente = calcularTurnoDisponible(tipo, lista, currentIndex + 1, asignaciones);
    const nextIndex = Math.min(siguiente.idx, lista.length);
    const nuevoIndex = { ...turnoIndex, [tipo]: nextIndex };
    setTurnoIndex(nuevoIndex);
    return siguiente.turno;
  };

  const finalizarSorteo = (tipo) => {
    const elegibles = residentes.filter(r => {
      if (!r.participo) return false;
      const t = tipoAsignado[r.username] || null;
      if (!t) return false;
      if (tipo === 'carro') return t === 'carro' || t === 'carros' || t === 'ambos';
      if (tipo === 'moto') return t === 'moto' || t === 'motos' || t === 'ambos';
      return false;
    });
    const asignados = new Set(asignaciones.map(a => a.usuario));
    const noAsignados = elegibles.filter(r => !asignados.has(r.username));

    if (apiEnabled) {
      api.finalizarSorteo(tipo)
        .then(() => api.getSnapshot())
        .then((snap) => {
          if (!snap) return;
          if (Array.isArray(snap.parqueaderos)) setParqueaderos(migrarParqueaderos(snap.parqueaderos));
          if (Array.isArray(snap.asignaciones)) setAsignaciones(snap.asignaciones);
          if (Array.isArray(snap.residentes)) setResidentes(snap.residentes);
          if (snap.config && typeof snap.config === 'object') setConfig(prev => ({ ...prev, ...snap.config }));
          if (snap.tipoAsignado && typeof snap.tipoAsignado === 'object') setTipoAsignado(snap.tipoAsignado);
          if (snap.turnos && typeof snap.turnos === 'object') setTurnos(snap.turnos);
          if (snap.turnoIndex && typeof snap.turnoIndex === 'object') setTurnoIndex(snap.turnoIndex);
        })
        .catch(() => {});
      return noAsignados;
    }

    syncFromApi();
    return noAsignados;
  };

  const reiniciarBaseDeDatos = async () => {
    if (apiEnabled) {
      try {
        await api.resetDb();
        await syncFromApi();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const limpiarDatosLocales = async () => {
    await syncFromApi();
    return true;
  };

  return (
    <SorteoContext.Provider value={{
      parqueaderos,
      asignaciones,
      residentes,
      tipoAsignado,
      turnos,
      turnoIndex,
      asignarParqueadero,
      obtenerParqueaderosDisponibles,
      obtenerAsignacionUsuario,
      obtenerResidentes,
      agregarResidente,
      eliminarResidente,
      obtenerNoAsignados,
      registrarAsistencia,
      obtenerAsistencia,
      setTipoAsignadoPorAdmin,
      getTipoAsignadoPorAdmin,
      config,
      toggleHabilitar,
      setFecha,
      getFecha,
      getFechaApertura,
      isHabilitado,
      isSorteoActivo,
      isSalaAbierta,
      getCountdown,
      getCountdownEspera,
      iniciarTurnos,
      getTurnoActual,
      avanzarTurno,
      finalizarSorteo,
      reiniciarBaseDeDatos,
      limpiarDatosLocales
    }}>
      {children}
    </SorteoContext.Provider>
  );
}

export function useSorteo() {
  const context = useContext(SorteoContext);
  if (!context) {
    throw new Error('useSorteo debe usarse dentro de SorteoProvider');
  }
  return context;
}
