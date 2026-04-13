import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export class SheetsService {
  constructor() {
    // Configurar OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    this.formsSheetName = process.env.GOOGLE_SHEETS_FORMS_SHEET_NAME || 'Respuestas de formulario 1';
    this.masterSheetName = process.env.GOOGLE_SHEETS_MASTER_SHEET_NAME || 'Procesamiento';
    this.tokensPath = path.join(process.cwd(), 'tokens.json');
    
    // Cargar tokens si existen
    this.cargarTokens();
  }
  
  cargarTokens() {
    try {
      if (fs.existsSync(this.tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
        if (tokens && (tokens.access_token || tokens.refresh_token)) {
          this.oauth2Client.setCredentials(tokens);
          console.log('✅ Tokens OAuth cargados para Google Sheets');
        } else {
          console.log('⚠️  Tokens OAuth inválidos para Google Sheets');
        }
      } else {
        console.log('🔐 No se encontraron tokens OAuth para Google Sheets');
      }
    } catch (error) {
      console.error('❌ Error cargando tokens para Google Sheets:', error.message);
    }
  }
  
  async verificarAutenticacion() {
    try {
      // Intentar hacer una llamada simple para verificar autenticación
      await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      return true;
    } catch (error) {
      if (error.code === 401) {
        console.log('🔄 Token expirado para Sheets, necesita renovación manual');
        return false;
      }
      console.error('❌ Error verificando autenticación de Sheets:', error.message);
      return false;
    }
  }

  async agregarTransaccion(datos) {
    try {
      const normalizarMarca = (valor) => {
        if (typeof valor !== 'string') return '';
        const v = valor.trim().toLowerCase();
        return v === 'x' || v === 'sí' || v === 'si' || v === 'true' || v === '1' ? 'X' : '';
      };

      const automovil = normalizarMarca(datos.automovil);
      const moto = normalizarMarca(datos.moto);
      const automovilMarca = automovil ? (datos.automovil_marca || 'No especificado') : '';
      const automovilPlaca = automovil ? (datos.automovil_placa || 'No especificado') : '';
      const motoTipoClase = moto
        ? [datos.moto_tipo, datos.moto_clase].filter((v) => v && v !== 'No especificado').join(' ') || 'No especificado'
        : '';
      const motoColor = moto ? (datos.moto_color || 'No especificado') : '';

      const valores = [
        [
          datos.torre || 'No especificado',
          datos.apartamento || 'No especificado',
          datos.fecha_solicitud || new Date().toISOString().split('T')[0],
          datos.nombre_interesado || 'No especificado',
          datos.correo || 'No especificado',
          datos.telefono_fijo || 'No especificado',
          datos.celular || 'No especificado',
          datos.nombre_propietario || 'No especificado',
          datos.vehiculo_a_nombre || 'No especificado',
          automovil,
          automovilMarca,
          automovilPlaca,
          moto,
          motoTipoClase,
          motoColor
        ]
      ];

      const resultado = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.formsSheetName, 'A:O'),
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: valores
        }
      });

      console.log('Solicitud de parqueadero agregada:', resultado.data);
      return resultado.data;
    } catch (error) {
      console.error('Error agregando solicitud de parqueadero:', error);
      throw error;
    }
  }

  async agregarTransaccionConImagen(datos) {
    try {
      const normalizarMarca = (valor) => {
        if (typeof valor !== 'string') return '';
        const v = valor.trim().toLowerCase();
        return v === 'x' || v === 'sí' || v === 'si' || v === 'true' || v === '1' ? 'X' : '';
      };

      const automovil = normalizarMarca(datos.automovil);
      const moto = normalizarMarca(datos.moto);
      const automovilMarca = automovil ? (datos.automovil_marca || 'No especificado') : '';
      const automovilPlaca = automovil ? (datos.automovil_placa || 'No especificado') : '';
      const motoTipoClase = moto
        ? [datos.moto_tipo, datos.moto_clase].filter((v) => v && v !== 'No especificado').join(' ') || 'No especificado'
        : '';
      const motoColor = moto ? (datos.moto_color || 'No especificado') : '';

      const valores = [
        [
          datos.torre || 'No especificado',
          datos.apartamento || 'No especificado',
          datos.fecha_solicitud || new Date().toISOString().split('T')[0],
          datos.nombre_interesado || 'No especificado',
          datos.correo || 'No especificado',
          datos.telefono_fijo || 'No especificado',
          datos.celular || 'No especificado',
          datos.nombre_propietario || 'No especificado',
          datos.vehiculo_a_nombre || 'No especificado',
          automovil,
          automovilMarca,
          automovilPlaca,
          moto,
          motoTipoClase,
          motoColor,
          datos.urlImagen || ''
        ]
      ];

      const resultado = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.formsSheetName, 'A:P'),
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: valores
        }
      });

      console.log('Solicitud de parqueadero con imagen agregada:', resultado.data);
      return resultado.data;
    } catch (error) {
      console.error('Error agregando solicitud de parqueadero con imagen:', error);
      throw error;
    }
  }

  rangoHoja(nombreHoja, columnas = 'A:ZZ') {
    const hoja = String(nombreHoja || '').replace(/'/g, "''");
    return `'${hoja}'!${columnas}`;
  }

  normalizarCampo(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  obtenerPorAlias(obj, aliases = [], fallback = 'No especificado') {
    for (const alias of aliases) {
      const key = this.normalizarCampo(alias);
      const val = obj[key];
      if (val !== undefined && String(val).trim() !== '') return String(val).trim();
    }
    return fallback;
  }

  esPlacaProbable(valor) {
    const txt = String(valor || '').replace(/\s+/g, '').toUpperCase();
    return /^[A-Z]{3}\d{3}$/.test(txt) || /^[A-Z]{3}\d{2}[A-Z]?$/.test(txt);
  }

  cabeceraMaestra() {
    return [
      'Correo', 'Torre/Apto', 'Teléfono', 'Propietario/Arr.', 'Autorización y contrato',
      'Tipo automóvil', 'Marca carro', 'Placa carro', 'Color carro',
      'Resumen Datos', 'Link Drive',
      'IA_Cedula', 'IA_Vehiculo', 'IA_SOAT', 'IA_Pagos', 'IA_Observaciones', 'Ultima_Revision', 'SYNC_KEY'
    ];
  }

  extraerUrls(valor) {
    if (!valor) return [];
    return String(valor).match(/https?:\/\/[^\s,]+/g) || [];
  }

  obtenerFechaBogota() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  async asegurarHojaMaestra() {
    const cabecera = this.cabeceraMaestra();
    const actual = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.rangoHoja(this.masterSheetName, 'A1:R1')
    });
    const filaActual = (actual.data.values && actual.data.values[0]) || [];
    const coincide = filaActual.length === cabecera.length && filaActual.every((v, i) => v === cabecera[i]);
    if (!coincide) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.masterSheetName, 'A1:R1'),
        valueInputOption: 'RAW',
        resource: { values: [cabecera] }
      });
    }
  }

  async sincronizarFormsAMaestra() {
    await this.asegurarHojaMaestra();
    const forms = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.rangoHoja(this.formsSheetName, 'A:ZZ')
    });
    const master = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.rangoHoja(this.masterSheetName, 'A:R')
    });

    const formsRows = forms.data.values || [];
    const masterRows = master.data.values || [];
    if (formsRows.length < 2) return { nuevas: 0, totalForms: 0 };

    const headers = formsRows[0].map((h) => this.normalizarCampo(h));
    const existentes = new Set(masterRows.slice(1).map((r) => r[17]).filter(Boolean));
    const nuevas = [];

    for (const row of formsRows.slice(1)) {
      const obj = Object.fromEntries(headers.map((h, i) => [h, row[i] || '']));

      const correo = this.obtenerPorAlias(obj, ['correo', 'correo electronico', 'email', 'e mail']);
      const torre = this.obtenerPorAlias(obj, ['torre']);
      const apto = this.obtenerPorAlias(obj, ['apartamento', 'apto']);
      const torreApto = `${torre}/${apto}`;
      const telefono = this.obtenerPorAlias(obj, ['telefono', 'celular', 'telefono fijo']);
      const propietario = this.obtenerPorAlias(obj, ['es usted', 'propietario arr', 'propietario', 'arrendatario']);
      const autorizacion = this.obtenerPorAlias(obj, ['autorizacion y contrato'], 'No especificado');
      const tipoVehiculo = this.obtenerPorAlias(obj, ['tipo automovil', 'tipo vehiculo'], 'No especificado');

      let marca = this.obtenerPorAlias(obj, ['marca carro', 'marca'], 'No especificado');
      let placa = this.obtenerPorAlias(obj, ['placa carro', 'placa'], 'No especificado');
      let color = this.obtenerPorAlias(obj, ['color carro', 'color'], 'No especificado');

      if (this.esPlacaProbable(marca) && !this.esPlacaProbable(placa)) {
        const temp = marca;
        marca = placa;
        placa = temp;
      }

      color = String(color).replace(/[.]+$/g, '').trim() || 'No especificado';

      const links = Object.values(obj).flatMap((v) => this.extraerUrls(v));
      const expedienteLink = links[0] || '';
      const syncKey = `${correo}|${placa}|${torreApto}`.toLowerCase();

      if (existentes.has(syncKey)) continue;

      const resumenDatos = [
        `Propietario/Arr: ${propietario}`,
        `Autorización: ${autorizacion}`,
        `Tipo: ${tipoVehiculo}`,
        `Marca: ${marca}`,
        `Placa: ${placa}`,
        `Color: ${color}`
      ].join(' | ');

      nuevas.push([
        correo, torreApto, telefono, propietario, autorizacion,
        tipoVehiculo, marca, placa, color,
        resumenDatos, expedienteLink,
        '', '', '', '', '', '', syncKey
      ]);
      existentes.add(syncKey);
    }

    if (nuevas.length > 0) {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.masterSheetName, 'A:R'),
        valueInputOption: 'USER_ENTERED',
        resource: { values: nuevas }
      });
    }

    return { nuevas: nuevas.length, totalForms: formsRows.length - 1 };
  }

  async ejecutarBatchIA(gemini, drive, limite = 10) {
    const data = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.rangoHoja(this.masterSheetName, 'A:R')
    });
    const rows = (data.data.values || []).slice(1);
    const fechaBogota = this.obtenerFechaBogota();
    const pendientes = rows
      .map((row, idx) => ({ row, rowIndex: idx + 2 }))
      .filter(({ row }) => !row[16] && row[10])
      .slice(0, limite);

    let procesadas = 0;
    for (const { row, rowIndex } of pendientes) {
      const expedienteLink = row[10];

      let resultado;
      if (!expedienteLink) {
        resultado = {
          cedula_ok: false,
          vehiculo_match: false,
          soat_vigente: false,
          pagos_al_dia: false,
          observaciones: 'No se encontró link del expediente PDF'
        };
      } else {
        const expediente = await drive.obtenerExpedientePdf(expedienteLink);
        if (!expediente.ok) {
          resultado = {
            cedula_ok: false,
            vehiculo_match: false,
            soat_vigente: false,
            pagos_al_dia: false,
            observaciones: expediente.error
          };
        } else {
          resultado = await gemini.auditarDocumentosFila({
            fechaBogota,
            propietarioArr: row[3] || 'No especificado',
            placa: row[7] || 'No especificado',
            marca: row[6] || 'No especificado',
            color: row[8] || 'No especificado',
            archivoExpediente: expediente.archivo
          });
        }
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.masterSheetName, `L${rowIndex}:Q${rowIndex}`),
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            resultado.cedula_ok ? '✅' : '❌',
            resultado.vehiculo_match ? '✅' : '❌',
            resultado.soat_vigente ? 'Vigente' : 'Vencido',
            resultado.pagos_al_dia ? 'Al día' : 'Pendiente/Incompleto',
            resultado.observaciones || '',
            fechaBogota
          ]]
        }
      });

      procesadas += 1;
    }

    return { procesadas, pendientes: pendientes.length };
  }

  async obtenerResumenInforme() {
    const data = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.rangoHoja(this.masterSheetName, 'A:R')
    });

    const rows = (data.data.values || []).slice(1).filter((r) => r.some(Boolean));
    const total = rows.length;
    const alDia = rows.filter((r) => r[13] === 'Vigente' && r[14] === 'Al día').length;
    const morososVencidos = rows.filter((r) => r[11] === '❌' || r[12] === '❌' || r[13] === 'Vencido' || (r[14] && r[14] !== 'Al día')).length;
    const pendientes = rows.filter((r) => !r[11] && !r[12] && !r[13] && !r[14]).length;

    return { total, alDia, morososVencidos, pendientes };
  }

  async obtenerTransacciones(limite = 10) {
    try {
      const resultado = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.rangoHoja(this.formsSheetName, 'A:E')
      });

      const filas = resultado.data.values || [];
      return filas.slice(-limite);
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      throw error;
    }
  }
}
