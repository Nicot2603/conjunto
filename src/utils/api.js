const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : '';

export const apiEnabled = true;

async function req(path, options = {}) {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  });
  if (!r.ok) throw new Error('api');
  if (r.status === 204) return null;
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  getSnapshot: () => req('/api/snapshot'),
  loginUser: (payload) => req('/api/login/usuario', { method: 'POST', body: JSON.stringify(payload) }),
  loginAdmin: (payload) => req('/api/login/admin', { method: 'POST', body: JSON.stringify(payload) }),
  setConfig: (cfg) => req('/api/config', { method: 'PUT', body: JSON.stringify(cfg) }),
  setTipoAsignado: (payload) => req('/api/tipo-asignado', { method: 'PUT', body: JSON.stringify(payload) }),
  addResidente: (payload) => req('/api/residentes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteResidente: (username) => req(`/api/residentes/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  registrarAsistencia: (username) => req(`/api/residentes/${encodeURIComponent(username)}/asistencia`, { method: 'POST' }),
  iniciarTurnos: (tipo) => req(`/api/turnos/${tipo}/init`, { method: 'POST' }),
  avanzarTurno: (tipo) => req(`/api/turnos/${tipo}/advance`, { method: 'POST' }),
  asignarParqueadero: (numero, usuario) => req(`/api/parqueaderos/${encodeURIComponent(numero)}/assign`, { method: 'POST', body: JSON.stringify({ usuario }) }),
  seedParqueaderos: () => req('/api/seed/parqueaderos', { method: 'POST' }),
  finalizarSorteo: (tipo) => req(`/api/sorteo/${tipo}/finalizar`, { method: 'POST' }),
  resetDb: () => req('/api/admin/reset', { method: 'POST' }),
};
