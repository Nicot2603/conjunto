CREATE TABLE IF NOT EXISTS parqueaderos (
  numero VARCHAR(10) PRIMARY KEY,
  tipo ENUM('carro','moto') NOT NULL,
  capacidad INT NOT NULL,
  torre VARCHAR(50) NOT NULL,
  ubicacion VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS asignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  parqueadero VARCHAR(10) NOT NULL,
  tipo ENUM('carro','moto') NOT NULL,
  fecha DATETIME NOT NULL,
  periodo VARCHAR(50) NOT NULL,
  torre VARCHAR(50) NOT NULL,
  apartamento VARCHAR(20) NOT NULL,
  motivo VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS residentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apartamento VARCHAR(20) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  tipoVehiculo VARCHAR(10) NOT NULL,
  prioridad VARCHAR(20) NOT NULL DEFAULT 'ninguna',
  participo TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS config (
  k VARCHAR(50) PRIMARY KEY,
  v TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tipo_asignado (
  username VARCHAR(50) PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS turnos (
  tipo VARCHAR(10) PRIMARY KEY,
  lista TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS turno_index (
  tipo VARCHAR(10) PRIMARY KEY,
  idx INT NOT NULL
);

INSERT INTO parqueaderos (numero, tipo, capacidad, torre, ubicacion) VALUES
  ('1','carro',2,'Torre 5','Abajo de Torre 5'),
  ('2','carro',2,'Torre 5','Abajo de Torre 5'),
  ('3','carro',2,'Torre 5','Abajo de Torre 5'),
  ('4','carro',2,'Torre 5','Abajo de Torre 5'),
  ('5','carro',2,'Torre 5','Abajo de Torre 5'),
  ('6','carro',2,'Torre 5','Abajo de Torre 5'),
  ('7','carro',2,'Torre 5','Abajo de Torre 5'),
  ('8','carro',2,'Torre 5','Abajo de Torre 5'),
  ('9','carro',2,'Torre 5','Abajo de Torre 5'),
  ('10','carro',2,'Torre 5','Abajo de Torre 5'),
  ('01','carro',1,'Torre 8','Al lado de Torre 8'),
  ('02','carro',1,'Torre 8','Al lado de Torre 8'),
  ('03','carro',1,'Torre 8','Al lado de Torre 8'),
  ('04','carro',1,'Torre 8','Al lado de Torre 8'),
  ('05','carro',1,'Torre 8','Al lado de Torre 8'),
  ('06','carro',1,'Torre 8','Al lado de Torre 8'),
  ('07','carro',1,'Torre 8','Al lado de Torre 8'),
  ('08','carro',1,'Torre 8','Al lado de Torre 8'),
  ('09','carro',1,'Torre 8','Al lado de Torre 8'),
  ('12','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('13','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('14','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('15','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('16','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('17','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('18','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('19','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('20','carro',1,'Torre 6/7','Tramo vertical derecho'),
  ('26','carro',1,'Torres 3, 4','Tramo inferior'),
  ('27','carro',1,'Torres 3, 4','Tramo inferior'),
  ('28','carro',1,'Torres 3, 4','Tramo inferior'),
  ('29','carro',1,'Torres 3, 4','Tramo inferior'),
  ('30','carro',1,'Torres 3, 4','Tramo inferior'),
  ('31','carro',1,'Torres 3, 4','Tramo inferior'),
  ('32','carro',1,'Torres 3, 4','Tramo inferior'),
  ('33','carro',1,'Torres 3, 4','Tramo inferior'),
  ('34','carro',1,'Torres 1, 2','Tramo inferior'),
  ('35','carro',1,'Torres 1, 2','Tramo inferior'),
  ('36','carro',1,'Torres 1, 2','Tramo inferior'),
  ('37','carro',1,'Torres 1, 2','Tramo inferior'),
  ('38','carro',1,'Torres 1, 2','Tramo inferior'),
  ('M1','moto',1,'Torre 8','Abajo Torre 8'),
  ('M2','moto',1,'Torre 8','Abajo Torre 8'),
  ('M3','moto',1,'Torre 8','Abajo Torre 8'),
  ('M4','moto',1,'Torre 8','Abajo Torre 8'),
  ('M5','moto',1,'Torre 8','Abajo Torre 8'),
  ('M6','moto',1,'Torre 8','Abajo Torre 8'),
  ('M7','moto',1,'Torre 8','Abajo Torre 8'),
  ('M8','moto',1,'Torre 8','Abajo Torre 8'),
  ('M9','moto',1,'Torre 8','Abajo Torre 8'),
  ('M10','moto',1,'Torre 8','Abajo Torre 8'),
  ('11','moto',1,'Torre 5','Vertical'),
  ('M12','moto',1,'Vertical Moto','Tramo Moto'),
  ('M13','moto',1,'Vertical Moto','Tramo Moto'),
  ('M14','moto',1,'Vertical Moto','Tramo Moto'),
  ('M15','moto',1,'Vertical Moto','Tramo Moto'),
  ('M16','moto',1,'Vertical Moto','Tramo Moto'),
  ('M17','moto',1,'Vertical Moto','Tramo Moto'),
  ('M18','moto',1,'Vertical Moto','Tramo Moto'),
  ('M19','moto',1,'Vertical Moto','Tramo Moto'),
  ('M20','moto',1,'Vertical Moto','Tramo Moto'),
  ('M21','moto',1,'Vertical Moto','Horizontal'),
  ('M22','moto',1,'Vertical Moto','Horizontal'),
  ('M23','moto',1,'Arriba','Arriba Moto'),
  ('M24','moto',1,'Arriba','Arriba Moto'),
  ('M25','moto',1,'Arriba','Arriba Moto'),
  ('M26','moto',1,'Arriba','Arriba Moto')
ON DUPLICATE KEY UPDATE
  tipo=VALUES(tipo),
  capacidad=VALUES(capacidad),
  torre=VALUES(torre),
  ubicacion=VALUES(ubicacion);
