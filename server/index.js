import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
const db = await initDb();

app.get('/api/health', (req, res) => res.json({ ok: true }));

function buildSeedParqueaderos() {
  const values = [];
  for (let i = 1; i <= 9; i++) values.push([String(i), 'carro', 2, 'Torre 5', 'Abajo de Torre 5']);
  values.push(['10c', 'carro', 2, 'Torre 5', 'Abajo de Torre 5']);
  for (let i = 1; i <= 10; i++) values.push([String(i).padStart(2, '0'), 'carro', 1, 'Torre 8', 'Al lado de Torre 8']);
  for (let i = 12; i <= 20; i++) values.push([String(i), 'carro', 1, 'Torre 6/7', 'Tramo vertical derecho']);
  for (const n of [26,27,28,29,30,31,32,33,34,35,36,37,38]) {
    const torre = (n >= 34 && n <= 38) ? 'Torres 1, 2' : (n >= 26 && n <= 33) ? 'Torres 3, 4' : 'Otro';
    values.push([String(n), 'carro', 1, torre, 'Tramo inferior']);
  }
  for (let i = 1; i <= 10; i++) values.push([`M${i}`, 'moto', 1, 'Torre 8', 'Abajo Torre 8']);
  values.push(['11', 'moto', 1, 'Torre 5', 'Vertical']);
  for (let i = 12; i <= 20; i++) values.push([`M${i}`, 'moto', 1, 'Vertical Moto', 'Tramo Moto']);
  values.push(['M21', 'moto', 1, 'Vertical Moto', 'Horizontal']);
  values.push(['M22', 'moto', 1, 'Vertical Moto', 'Horizontal']);
  for (let i = 23; i <= 26; i++) values.push([`M${i}`, 'moto', 1, 'Arriba', 'Arriba Moto']);
  return values;
}

async function seedParqueaderosIfEmpty() {
  const values = buildSeedParqueaderos();
  await db.exec('BEGIN');
  try {
    const stmt = await db.prepare('INSERT OR IGNORE INTO parqueaderos(numero,tipo,capacidad,torre,ubicacion) VALUES (?,?,?,?,?)');
    try {
      for (const v of values) await stmt.run(v);
    } finally {
      await stmt.finalize();
    }
    await db.exec('COMMIT');
  } catch (e) {
    await db.exec('ROLLBACK');
    throw e;
  }
}

function normalizePrioridadOnFinalize(prev, tipo, shouldAdd) {
  const p = (prev || 'ninguna');
  if (shouldAdd) {
    if (p === 'ambos') return 'ambos';
    if (p === 'ninguna') return tipo;
    if (p === tipo) return tipo;
    return 'ambos';
  }

  if (p === 'ambos') return tipo === 'carro' ? 'moto' : 'carro';
  if (p === tipo) return 'ninguna';
  return p;
}

async function getConfigValue(key) {
  const row = await db.get('SELECT v FROM config WHERE k=?', [key]);
  if (!row) return undefined;
  try {
    return JSON.parse(row.v);
  } catch {
    return undefined;
  }
}

async function isSorteoBloqueadoParaCambios() {
  const habilitarCarros = (await getConfigValue('habilitarCarros')) ?? true;
  const habilitarMotos = (await getConfigValue('habilitarMotos')) ?? true;
  const cerradoCarro = (await getConfigValue('cerradoCarro')) ?? false;
  const cerradoMoto = (await getConfigValue('cerradoMoto')) ?? false;
  const fechaCarros = await getConfigValue('fechaCarros');
  const fechaMotos = await getConfigValue('fechaMotos');

  const ahora = Date.now();
  const salaCarro = habilitarCarros && !cerradoCarro && fechaCarros && ahora >= new Date(fechaCarros).getTime();
  const salaMoto = habilitarMotos && !cerradoMoto && fechaMotos && ahora >= new Date(fechaMotos).getTime();

  const turnoCarro = await db.get("SELECT 1 x FROM turnos WHERE tipo='carro' AND lista IS NOT NULL AND lista <> '[]' LIMIT 1");
  const turnoMoto = await db.get("SELECT 1 x FROM turnos WHERE tipo='moto' AND lista IS NOT NULL AND lista <> '[]' LIMIT 1");

  return !!(salaCarro || salaMoto || turnoCarro || turnoMoto);
}

async function logAsignacionEvento({ usuario, parqueadero, resultado, detalle = null }) {
  try {
    await db.run(
      'INSERT INTO asignacion_eventos(usuario,parqueadero,resultado,detalle,fecha) VALUES (?,?,?,?,?)',
      [String(usuario || '-'), String(parqueadero || '-'), String(resultado || 'desconocido'), detalle, new Date().toISOString()]
    );
  } catch {}
}

app.post('/api/login/usuario', async (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).end();
  const row = await db.get(
    'SELECT username, tipoVehiculo, prioridad FROM residentes WHERE LOWER(username)=LOWER(?) AND password=? LIMIT 1',
    [usuario, password]
  );
  if (!row) return res.status(401).end();
  res.json(row);
});

app.post('/api/login/admin', async (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).end();
  const row = await db.get('SELECT 1 x FROM admins WHERE username=? AND password=? LIMIT 1', [usuario, password]);
  if (!row) return res.status(401).end();
  res.status(204).end();
});

app.post('/api/admin/reset', async (req, res) => {
  try {
    await db.exec('BEGIN IMMEDIATE');
    await db.run('DELETE FROM asignaciones');
    await db.run('DELETE FROM asignacion_eventos');
    await db.run('DELETE FROM turnos');
    await db.run('DELETE FROM turno_index');
    await db.run('DELETE FROM config');
    await db.run('DELETE FROM parqueaderos');
    await db.run("UPDATE residentes SET participo=0, prioridad='ninguna'");

    const cfgDefaults = [
      ['habilitarCarros', JSON.stringify(true)],
      ['habilitarMotos', JSON.stringify(true)],
      ['cerradoCarro', JSON.stringify(false)],
      ['cerradoMoto', JSON.stringify(false)]
    ];
    for (const [k, v] of cfgDefaults) {
      await db.run('INSERT OR REPLACE INTO config(k,v) VALUES (?,?)', [k, v]);
    }

    const values = buildSeedParqueaderos();
    const stmt = await db.prepare('INSERT INTO parqueaderos(numero,tipo,capacidad,torre,ubicacion) VALUES (?,?,?,?,?)');
    try {
      for (const v of values) await stmt.run(v);
    } finally {
      await stmt.finalize();
    }
    await db.exec('COMMIT');
    res.status(204).end();
  } catch (e) {
    await db.exec('ROLLBACK');
    res.status(500).end();
  }
});

app.post('/api/seed/parqueaderos', async (req, res) => {
  try {
    await seedParqueaderosIfEmpty();
    res.status(201).end();
  } catch {
    res.status(500).end();
  }
});

app.get('/api/snapshot', async (req, res) => {
  try {
    await seedParqueaderosIfEmpty();
    const parqueaderosBase = await db.all('SELECT * FROM parqueaderos');
    const asignaciones = await db.all('SELECT * FROM asignaciones ORDER BY id ASC');
    const residentes = await db.all('SELECT * FROM residentes ORDER BY id ASC');
    const configRows = await db.all('SELECT k, v FROM config');
    const tipoRows = await db.all('SELECT username, tipo FROM tipo_asignado');
    const turnos = await db.all('SELECT tipo, lista FROM turnos');
    const turnoIndex = await db.all('SELECT tipo, idx FROM turno_index');
    const cfg = {};
    for (const r of configRows) cfg[r.k] = JSON.parse(r.v);
    const tipoAsignado = {};
    for (const r of tipoRows) tipoAsignado[r.username] = r.tipo;
    const t = {};
    for (const r of turnos) t[r.tipo] = JSON.parse(r.lista || '[]');
    const tIdx = {};
    for (const r of turnoIndex) tIdx[r.tipo] = r.idx;
    const ocupadosByNumero = new Map();
    for (const a of asignaciones) {
      const list = ocupadosByNumero.get(a.parqueadero) || [];
      list.push(a.usuario);
      ocupadosByNumero.set(a.parqueadero, list);
    }
    const parqueaderos = parqueaderosBase.map(p => ({
      ...p,
      ocupadoPor: ocupadosByNumero.get(p.numero) || []
    }));
    res.json({ parqueaderos, asignaciones, residentes, config: cfg, tipoAsignado, turnos: t, turnoIndex: tIdx });
  } catch {
    res.status(500).end();
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    const q = 'INSERT OR REPLACE INTO config(k,v) VALUES (?,?)';
    for (const [k, v] of entries) {
      await db.run(q, [k, JSON.stringify(v)]);
    }
    res.status(204).end();
  } catch {
    res.status(500).end();
  }
});

app.put('/api/tipo-asignado', async (req, res) => {
  const { username, tipo } = req.body || {};
  if (!username || !tipo) return res.status(400).end();
  try {
    await db.run('INSERT OR REPLACE INTO tipo_asignado(username,tipo) VALUES (?,?)', [username, tipo]);
    res.status(204).end();
  } catch {
    res.status(500).end();
  }
});

app.post('/api/residentes', async (req, res) => {
  const { apartamento, username, password, tipoVehiculo, prioridad } = req.body || {};
  if (!apartamento || !username || !password) return res.status(400).end();
  try {
    const prioridadValor = (typeof prioridad === 'string') ? prioridad : (prioridad ? 'ambos' : 'ninguna');
    
    await db.run(
      'INSERT INTO residentes(apartamento,username,password,tipoVehiculo,prioridad) VALUES (?,?,?,?,?)',
      [apartamento, username, password, tipoVehiculo || '', prioridadValor]
    );
    if (tipoVehiculo) {
      await db.run('INSERT OR REPLACE INTO tipo_asignado(username,tipo) VALUES (?,?)', [username, tipoVehiculo]);
    }
    res.status(201).end();
  } catch {
    res.status(409).end();
  }
});

app.delete('/api/residentes/:username', async (req, res) => {
  const username = req.params.username;
  if (!username) return res.status(400).end();
  try {
    const bloqueado = await isSorteoBloqueadoParaCambios();
    if (bloqueado) return res.status(423).json({ error: 'sorteo_en_curso' });

    const hasAsignacion = await db.get('SELECT 1 x FROM asignaciones WHERE usuario=? LIMIT 1', [username]);
    if (hasAsignacion) return res.status(409).json({ error: 'tiene_asignacion' });

    await db.exec('BEGIN');
    try {
      await db.run('DELETE FROM tipo_asignado WHERE username=?', [username]);
      const r = await db.run('DELETE FROM residentes WHERE username=?', [username]);
      await db.exec('COMMIT');
      if ((r?.changes || 0) === 0) return res.status(404).end();
      res.status(204).end();
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }
  } catch {
    res.status(500).end();
  }
});

app.post('/api/residentes/:username/asistencia', async (req, res) => {
  const username = req.params.username;
  if (!username) return res.status(400).end();
  try {
    await db.run('UPDATE residentes SET participo=1 WHERE username=?', [username]);
    res.status(204).end();
  } catch {
    res.status(500).end();
  }
});

app.post('/api/parqueaderos/:numero/assign', async (req, res) => {
  const numero = req.params.numero;
  const { usuario } = req.body || {};
  if (!numero || !usuario) return res.status(400).end();
  try {
    await db.exec('BEGIN IMMEDIATE');

    const userHasAny = await db.get('SELECT 1 x FROM asignaciones WHERE usuario=? LIMIT 1', [usuario]);
    if (userHasAny) {
      await db.exec('ROLLBACK');
      await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'rechazada', detalle: 'user_has_parking' });
      return res.status(409).json({ error: 'user_has_parking' });
    }

    const p = await db.get('SELECT * FROM parqueaderos WHERE numero=?', [numero]);
    if (!p) {
      await db.exec('ROLLBACK');
      await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'rechazada', detalle: 'parking_not_found' });
      return res.status(404).end();
    }
    const exists = await db.get('SELECT 1 x FROM asignaciones WHERE parqueadero=? AND usuario=? LIMIT 1', [numero, usuario]);
    if (exists) {
      await db.exec('ROLLBACK');
      await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'rechazada', detalle: 'already_assigned_same_slot' });
      return res.status(409).json({ error: 'already' });
    }
    const capacidad = p.capacidad || 1;
    const oc = await db.get('SELECT COUNT(*) c FROM asignaciones WHERE parqueadero=?', [numero]);
    const ocupados = oc?.c || 0;
    if (ocupados >= capacidad) {
      await db.exec('ROLLBACK');
      await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'rechazada', detalle: 'full' });
      return res.status(409).json({ error: 'full' });
    }
    const resRow = await db.get('SELECT apartamento FROM residentes WHERE username=?', [usuario]);
    const apartamento = resRow?.apartamento || '-';
    await db.run(
      'INSERT INTO asignaciones(usuario,parqueadero,tipo,fecha,periodo,torre,apartamento,motivo) VALUES (?,?,?,?,?,?,?,?)',
      [usuario, numero, p.tipo, new Date().toISOString(), 'Feb 2026 - Abr 2026', p.torre, apartamento, 'sorteo']
    );
    await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'asignada', detalle: null });
    await db.exec('COMMIT');
    res.status(201).end();
  } catch (e) {
    try { await db.exec('ROLLBACK'); } catch {}
    if (String(e?.message || '').includes('UNIQUE constraint failed: asignaciones.usuario')) {
      await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'rechazada', detalle: 'user_has_parking_unique' });
      return res.status(409).json({ error: 'user_has_parking' });
    }
    await logAsignacionEvento({ usuario, parqueadero: numero, resultado: 'error', detalle: String(e?.message || 'unknown_error').slice(0, 200) });
    res.status(500).end();
  }
});

app.post('/api/turnos/:tipo/init', async (req, res) => {
  const tipo = req.params.tipo;
  try {
    const rows = await db.all('SELECT username, prioridad, participo FROM residentes');
    const tipoRows = await db.all('SELECT username, tipo FROM tipo_asignado');
    const tipoAsignado = {};
    for (const r of tipoRows) tipoAsignado[r.username] = r.tipo;
    const asigRows = await db.all('SELECT DISTINCT usuario FROM asignaciones');
    const yaAsignados = new Set(asigRows.map(r => r.usuario));
    
    const candidatos = rows.filter(r => {
      // Excluir a "Pero" si existe en la base de datos
      if (r.username === 'Pero') return false;
      
      const tienePrioridadEnEsteTipo =
        r.prioridad === 'ambos' ||
        (tipo === 'carro' && r.prioridad === 'carro') ||
        (tipo === 'moto' && r.prioridad === 'moto');
                                      
      if (tienePrioridadEnEsteTipo) return true;
      if (!r.participo) return false;
      if (yaAsignados.has(r.username)) return false;
      
      const ta = tipoAsignado[r.username] || null;
      if (!ta) return false;
      if (tipo === 'carro') return ta === 'carro' || ta === 'carros' || ta === 'ambos';
      if (tipo === 'moto') return ta === 'moto' || ta === 'motos' || ta === 'ambos';
      return false;
    });

    const pri = candidatos.filter(r => {
      return r.prioridad === 'ambos' || (tipo === 'carro' && r.prioridad === 'carro') || (tipo === 'moto' && r.prioridad === 'moto');
    });
    
    const reg = candidatos.filter(r => {
      const isPri = r.prioridad === 'ambos' || (tipo === 'carro' && r.prioridad === 'carro') || (tipo === 'moto' && r.prioridad === 'moto');
      return !isPri;
    });

    for (let i = reg.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reg[i], reg[j]] = [reg[j], reg[i]];
    }
    const lista = [...pri, ...reg].map(r => r.username);
    await db.run('INSERT OR REPLACE INTO turnos(tipo,lista) VALUES (?,?)', [tipo, JSON.stringify(lista)]);
    await db.run('INSERT OR REPLACE INTO turno_index(tipo,idx) VALUES (?,?)', [tipo, 0]);
    res.status(201).end();
  } catch {
    res.status(500).end();
  }
});

app.post('/api/turnos/:tipo/advance', async (req, res) => {
  const tipo = req.params.tipo;
  try {
    const tRow = await db.get('SELECT lista FROM turnos WHERE tipo=?', [tipo]);
    const lista = tRow?.lista ? JSON.parse(tRow.lista) : [];
    const row = await db.get('SELECT idx FROM turno_index WHERE tipo=?', [tipo]);
    const current = row?.idx ?? 0;
    const next = lista.length ? Math.min(current + 1, lista.length) : 0;
    await db.run('INSERT OR REPLACE INTO turno_index(tipo,idx) VALUES (?,?)', [tipo, next]);
    res.json({ turnoActual: lista[next] || null, idx: next });
  } catch {
    res.status(500).end();
  }
});

app.post('/api/sorteo/:tipo/finalizar', async (req, res) => {
  const tipo = req.params.tipo;
  if (tipo !== 'carro' && tipo !== 'moto') return res.status(400).end();
  try {
    const rows = await db.all('SELECT username, apartamento, tipoVehiculo, prioridad, participo FROM residentes');
    const tipoRows = await db.all('SELECT username, tipo FROM tipo_asignado');
    const tipoAsignado = {};
    for (const r of tipoRows) tipoAsignado[r.username] = r.tipo;
    const asigRows = await db.all('SELECT DISTINCT usuario FROM asignaciones');
    const asignados = new Set(asigRows.map(r => r.usuario));

    const elegibles = rows.filter(r => {
      if (!r.participo) return false;
      const ta = tipoAsignado[r.username] || null;
      if (!ta) return false;
      if (tipo === 'carro') return ta === 'carro' || ta === 'carros' || ta === 'ambos';
      if (tipo === 'moto') return ta === 'moto' || ta === 'motos' || ta === 'ambos';
      return false;
    });
    const noAsignados = elegibles.filter(r => !asignados.has(r.username));

    await db.exec('BEGIN');
    try {
      for (const r of elegibles) {
        const shouldAdd = noAsignados.some(n => n.username === r.username);
        const newPrioridad = normalizePrioridadOnFinalize(r.prioridad, tipo, shouldAdd);
        await db.run('UPDATE residentes SET prioridad=? WHERE username=?', [newPrioridad, r.username]);
      }

      await db.run('UPDATE residentes SET participo=0 WHERE participo=1');

      const cerradoKey = tipo === 'carro' ? 'cerradoCarro' : 'cerradoMoto';
      const ultimoKey = tipo === 'carro' ? 'ultimoNoAsignadosCarro' : 'ultimoNoAsignadosMoto';
      await db.run('INSERT OR REPLACE INTO config(k,v) VALUES (?,?)', [cerradoKey, JSON.stringify(true)]);
      await db.run('INSERT OR REPLACE INTO config(k,v) VALUES (?,?)', [ultimoKey, JSON.stringify(noAsignados)]);
      await db.run('INSERT OR REPLACE INTO turnos(tipo,lista) VALUES (?,?)', [tipo, JSON.stringify([])]);
      await db.run('INSERT OR REPLACE INTO turno_index(tipo,idx) VALUES (?,?)', [tipo, 0]);
      await db.exec('COMMIT');
    } catch (e) {
      await db.exec('ROLLBACK');
      throw e;
    }

    res.json({ noAsignados });
  } catch {
    res.status(500).end();
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {});
