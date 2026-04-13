import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDb() {
  const filename = process.env.SQLITE_FILE || './parqueaderos.sqlite';
  const db = await open({
    filename,
    driver: sqlite3.Database
  });

  await db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;

    CREATE TABLE IF NOT EXISTS parqueaderos (
      numero TEXT PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('carro','moto')),
      capacidad INTEGER NOT NULL,
      torre TEXT NOT NULL,
      ubicacion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS asignaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL,
      parqueadero TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('carro','moto')),
      fecha TEXT NOT NULL,
      periodo TEXT NOT NULL,
      torre TEXT NOT NULL,
      apartamento TEXT NOT NULL,
      motivo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS residentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apartamento TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      tipoVehiculo TEXT NOT NULL,
      prioridad TEXT NOT NULL DEFAULT 'ninguna',
      participo INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS config (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tipo_asignado (
      username TEXT PRIMARY KEY,
      tipo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS turnos (
      tipo TEXT PRIMARY KEY,
      lista TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS turno_index (
      tipo TEXT PRIMARY KEY,
      idx INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS asignacion_eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL,
      parqueadero TEXT NOT NULL,
      resultado TEXT NOT NULL,
      detalle TEXT,
      fecha TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_asignaciones_usuario ON asignaciones(usuario);
    CREATE INDEX IF NOT EXISTS idx_asignaciones_parqueadero ON asignaciones(parqueadero);
  `);

  const adminCount = await db.get('SELECT COUNT(*) c FROM admins');
  if ((adminCount?.c || 0) === 0) {
    await db.run('INSERT INTO admins(username,password) VALUES (?,?)', ['AdminPA', 'Password2025']);
  }

  const cfgDefaults = [
    ['habilitarCarros', JSON.stringify(true)],
    ['habilitarMotos', JSON.stringify(true)],
    ['cerradoCarro', JSON.stringify(false)],
    ['cerradoMoto', JSON.stringify(false)]
  ];
  for (const [k, v] of cfgDefaults) {
    await db.run('INSERT OR IGNORE INTO config(k,v) VALUES (?,?)', [k, v]);
  }

  // Migracion de numeracion: el compartido "10" pasa a "10c", y se crea "10" normal.
  const has10c = await db.get("SELECT 1 x FROM parqueaderos WHERE numero='10c' AND tipo='carro' LIMIT 1");
  if (!has10c) {
    const oldShared10 = await db.get("SELECT 1 x FROM parqueaderos WHERE numero='10' AND tipo='carro' AND capacidad > 1 LIMIT 1");
    if (oldShared10) {
      await db.exec('BEGIN');
      try {
        await db.run("UPDATE parqueaderos SET numero='10c' WHERE numero='10' AND tipo='carro' AND capacidad > 1");
        await db.run("UPDATE asignaciones SET parqueadero='10c' WHERE parqueadero='10' AND tipo='carro'");
        await db.run(
          "INSERT OR IGNORE INTO parqueaderos(numero,tipo,capacidad,torre,ubicacion) VALUES ('10','carro',1,'Torre 8','Al lado de Torre 8')"
        );
        await db.exec('COMMIT');
      } catch {
        await db.exec('ROLLBACK');
      }
    }
  }

  return db;
}
