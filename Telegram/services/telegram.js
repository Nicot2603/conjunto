import TelegramBot from 'node-telegram-bot-api';
import { GeminiService } from './gemini.js';
import { SheetsService } from './sheets.js';
import { DriveService } from './drive.js';

export class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = new TelegramBot(this.token, { polling: true });
    this.gemini = new GeminiService();
    this.sheets = new SheetsService();
    this.drive = new DriveService();

    this.setupHandlers();
  }

  setupHandlers() {
    // Comando de inicio
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '🤖 ¡Hola! Soy tu bot para procesar formularios de solicitud de parqueadero.\n\n' +
        '📝 Envíame un texto describiendo el formulario\n' +
        '📷 O envía una foto del formulario completado\n\n' +
        'Procesaré la información y la guardaré en tu hoja de Google Sheets automáticamente.'
      );
    });

    // Comando de ayuda
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '📋 *Comandos disponibles:*\n\n' +
        '/start - Iniciar el bot\n' +
        '/help - Mostrar esta ayuda\n' +
        '/stats - Ver estadísticas recientes\n' +
        '/informe - Resumen hoja maestra (IA)\n' +
        '/auth - Autorizar acceso a Google (Drive + Sheets)\n' +
        '/status - Ver estado de autorización\n\n' +
        '💡 *Cómo usar:*\n' +
        '• Envía texto: "Torre 1 Apto 101, Juan Pérez, correo@ejemplo.com"\n' +
        '• Envía foto: Sube imagen del formulario completado\n' +
        '• Envía PDF: Sube el formulario en formato PDF\n\n' +
        '🔐 *Importante:* Usa /auth antes de procesar formularios'
        , { parse_mode: 'Markdown' }
      );
    });

    // Comando de estadísticas
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const solicitudes = await this.sheets.obtenerTransacciones(5);
        if (solicitudes.length === 0) {
          this.bot.sendMessage(chatId, '📊 No hay solicitudes registradas aún.');
          return;
        }

        let mensaje = '📊 *Últimas 5 solicitudes de parqueadero:*\n\n';
        solicitudes.forEach((s, i) => {
          if (s.length >= 4) {
            mensaje += `${i + 1}. Torre ${s[0]} Apto ${s[1]} - ${s[3]}\n`;
          }
        });

        this.bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        this.bot.sendMessage(chatId, '❌ Error obteniendo estadísticas.');
      }
    });

    this.bot.onText(/\/informe/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        this.bot.sendMessage(chatId, '📊 Generando informe maestro...');
        const sync = await this.sheets.sincronizarFormsAMaestra();
        const batch = await this.sheets.ejecutarBatchIA(this.gemini, this.drive, Number(process.env.IA_BATCH_LIMIT || 10));
        const resumen = await this.sheets.obtenerResumenInforme();
        this.bot.sendMessage(
          chatId,
          `📋 *Informe Maestro*\n\n` +
          `👥 Total registros: ${resumen.total}\n` +
          `✅ Al día: ${resumen.alDia}\n` +
          `⚠️ Morosos/Vencidos: ${resumen.morososVencidos}\n` +
          `🕓 Pendientes IA: ${resumen.pendientes}\n\n` +
          `🔄 Nuevos desde Forms: ${sync.nuevas}\n` +
          `🤖 Procesados en este lote: ${batch.procesadas}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Error generando informe:', error);
        this.bot.sendMessage(chatId, '❌ Error generando informe maestro.');
      }
    });

    // Comando de autorización OAuth
    this.bot.onText(/\/auth/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const autenticado = await this.drive.verificarAutenticacion();
        if (autenticado) {
          this.bot.sendMessage(chatId,
            '✅ *Ya estás autenticado*\n\n' +
            'El bot ya tiene acceso a tu Google Drive.\n' +
            '¡Puedes enviar imágenes sin problemas!',
            { parse_mode: 'Markdown' }
          );
          return;
        }

        const authUrl = this.drive.obtenerUrlAutorizacion();
        this.bot.sendMessage(chatId,
          '🔐 *Autorización requerida*\n\n' +
          'Para subir imágenes a Google Drive, necesitas autorizar el acceso:\n\n' +
          `[🔗 Hacer clic aquí para autorizar](${authUrl})\n\n` +
          '📝 *Pasos:*\n' +
          '1. Haz clic en el enlace\n' +
          '2. Inicia sesión con tu cuenta de Google\n' +
          '3. Autoriza el acceso\n' +
          '4. Regresa aquí y envía una imagen\n\n' +
          '💡 Solo necesitas hacer esto una vez.',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Error generando URL de autorización:', error);
        this.bot.sendMessage(chatId, '❌ Error generando enlace de autorización.');
      }
    });

    // Comando de estado OAuth
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const driveAutenticado = await this.drive.verificarAutenticacion();
        const sheetsAutenticado = await this.sheets.verificarAutenticacion();
        const estadoTokens = this.drive.obtenerEstadoTokens();
        
        if (driveAutenticado && sheetsAutenticado && estadoTokens.existe) {
          this.bot.sendMessage(chatId,
            '✅ *Estado: Completamente Autenticado*\n\n' +
            '🔗 Google Drive: Conectado\n' +
            '📊 Google Sheets: Conectado\n' +
            '📷 Subida de imágenes: Activa\n' +
            '📝 Registro de solicitudes: Activo\n' +
            `🔄 Persistencia: ${estadoTokens.persistente ? 'Activa' : 'Limitada'}\n` +
            `📅 Autorizado: ${estadoTokens.fechaCreacion}\n\n` +
            '🎉 *¡Todo listo para usar!*\n' +
            'Envía texto o fotos para procesar formularios de parqueadero.',
            { parse_mode: 'Markdown' }
          );
        } else if (driveAutenticado && !sheetsAutenticado) {
          this.bot.sendMessage(chatId,
            '⚠️ *Estado: Parcialmente Autenticado*\n\n' +
            '✅ Google Drive: Conectado\n' +
            '❌ Google Sheets: No autenticado\n\n' +
            '📷 Puedes subir imágenes pero no se guardarán en la hoja\n' +
            '🔐 Usa /auth para autorizar completamente',
            { parse_mode: 'Markdown' }
          );
        } else {
          this.bot.sendMessage(chatId,
            '❌ *Estado: No Autenticado*\n\n' +
            '🔐 Se requiere autorización OAuth\n' +
            '📝 Usa /auth para obtener el enlace\n\n' +
            '💡 Necesitas autorizar para usar todas las funciones.',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        console.error('Error verificando estado OAuth:', error);
        this.bot.sendMessage(chatId, '❌ Error verificando estado de autorización.');
      }
    });

    // Manejar mensajes de texto
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.procesarTexto(msg);
      }
    });

    // Manejar fotos (con o sin texto)
    this.bot.on('photo', async (msg) => {
      await this.procesarFoto(msg);
    });

    // Manejar documentos (imágenes y PDFs enviadas como archivo)
    this.bot.on('document', async (msg) => {
      if (msg.document.mime_type && msg.document.mime_type.startsWith('image/')) {
        await this.procesarDocumento(msg);
      } else if (msg.document.mime_type && msg.document.mime_type === 'application/pdf') {
        await this.procesarPDF(msg);
      }
    });
  }

  async procesarTexto(msg) {
    const chatId = msg.chat.id;
    const texto = msg.text;

    try {
      this.bot.sendMessage(chatId, '🤖 Procesando texto...');

      const resultado = await this.gemini.procesarTexto(texto);

      // Verificar si hubo error en el procesamiento de Gemini
      if (resultado.error) {
        console.error('Error en Gemini procesando texto:', resultado.detalle);
        this.bot.sendMessage(chatId, '❌ Error procesando el texto con IA. Intenta de nuevo.');
        return;
      }

      // Verificar autenticación de Sheets antes de agregar solicitud
      const sheetsAutenticado = await this.sheets.verificarAutenticacion();
      if (!sheetsAutenticado) {
        this.bot.sendMessage(chatId,
          '❌ *No se pudo guardar en la hoja de cálculo*\n\n' +
          '🔐 Usa /auth para autorizar el acceso a Google Sheets\n' +
          '💡 Una vez autorizado, podrás procesar formularios normalmente.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await this.sheets.agregarTransaccion(resultado);

      this.bot.sendMessage(chatId,
        `✅ *Solicitud de parqueadero registrada:*\n\n` +
        `🏢 Torre: ${resultado.torre}\n` +
        `🏠 Apartamento: ${resultado.apartamento}\n` +
        `� Interesado: ${resultado.nombre_interesado}\n` +
        `� Correo: ${resultado.correo}\n` +
        `� Celular: ${resultado.celular}\n` +
        `📅 Fecha: ${resultado.fecha_solicitud}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error procesando texto:', error);
      this.bot.sendMessage(chatId, '❌ Error procesando el texto. Intenta de nuevo.');
    }
  }

  async procesarFoto(msg) {
    const chatId = msg.chat.id;
    let imageBuffer = null;

    try {
      this.bot.sendMessage(chatId, '📷 Procesando imagen...');

      // Obtener la foto de mayor calidad
      const foto = msg.photo[msg.photo.length - 1];
      const fileLink = await this.bot.getFileLink(foto.file_id);

      // Descargar imagen
      const response = await fetch(fileLink);
      const buffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(buffer);

      // Verificar configuración de Google Drive antes de procesar con IA
      if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
        throw new Error('CONFIGURACION_DRIVE_FALTANTE');
      }

      // Subir imagen a Google Drive PRIMERO (antes de consumir tokens de IA)
      const nombreArchivo = `comprobante_${Date.now()}_${foto.file_id}.jpg`;
      let driveFile;

      try {
        driveFile = await this.drive.subirImagen(imageBuffer, nombreArchivo, 'image/jpeg');
      } catch (driveError) {
        // Si falla Google Drive, no procesar con IA para evitar consumo de tokens
        console.error('❌ Error en Google Drive, evitando procesamiento con IA:', driveError.message);

        if (driveError.message.includes('OAUTH_NO_AUTENTICADO')) {
          this.bot.sendMessage(chatId,
            '🔐 *Autorización requerida*\n\n' +
            '❌ No tienes autorización para subir imágenes a Google Drive.\n\n' +
            '📝 *Pasos para autorizar:*\n' +
            '1. Usa el comando /auth\n' +
            '2. Haz clic en el enlace\n' +
            '3. Autoriza el acceso\n' +
            '4. Regresa y envía la imagen\n\n' +
            '💡 Mientras tanto, puedes enviar solo texto.',
            { parse_mode: 'Markdown' }
          );
        } else if (driveError.message.includes('403')) {
          this.bot.sendMessage(chatId,
            '❌ *Error de permisos*\n\n' +
            '🔧 No tienes permisos para subir archivos a esta carpeta.\n' +
            '📁 Verifica que tengas acceso de escritura a la carpeta configurada.\n\n' +
            '💡 Mientras tanto, puedes enviar solo texto sin imagen.',
            { parse_mode: 'Markdown' }
          );
        } else {
          this.bot.sendMessage(chatId,
            '❌ Error subiendo imagen a Google Drive. Verifica la configuración.'
          );
        }
        return; // Salir sin procesar con IA
      }

      // Solo si Google Drive funciona, procesar con IA
      const base64 = imageBuffer.toString('base64');
      const imagenBase64 = `data:image/jpeg;base64,${base64}`;

      // Obtener texto adicional si existe (caption)
      const textoAdicional = msg.caption || '';

      const resultado = await this.gemini.procesarImagen(imagenBase64, textoAdicional);

      // Verificar si hubo error en el procesamiento de Gemini
      if (resultado.error) {
        console.error('Error en Gemini procesando imagen:', resultado.detalle);
        this.bot.sendMessage(chatId,
          '⚠️ *Imagen subida correctamente*\n\n' +
          '📷 Tu imagen se guardó en Google Drive\n' +
          '🔗 [Ver comprobante](' + driveFile.url + ')\n\n' +
          '❌ *Error procesando con IA*\n' +
          '🤖 No se pudo extraer la información automáticamente',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Agregar URL de la imagen al resultado
      resultado.urlImagen = driveFile.url;

      // Verificar autenticación de Sheets antes de agregar solicitud
      const sheetsAutenticado = await this.sheets.verificarAutenticacion();
      if (!sheetsAutenticado) {
        this.bot.sendMessage(chatId,
          '⚠️ *Imagen subida correctamente*\n\n' +
          '📷 Tu imagen se guardó en Google Drive\n' +
          '🔗 [Ver formulario](' + driveFile.url + ')\n\n' +
          '❌ *No se pudo guardar en la hoja de cálculo*\n' +
          '🔐 Usa /auth para autorizar el acceso a Google Sheets',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await this.sheets.agregarTransaccionConImagen(resultado);

      // Detectar tipo de vehículo basado en los campos llenos
      let tipoVehiculo = 'No especificado';
      let detallesVehiculo = [];
      
      if (resultado.automovil_marca && resultado.automovil_marca !== 'No especificado') {
        tipoVehiculo = '🚗 Automóvil';
        detallesVehiculo.push(`Marca: ${resultado.automovil_marca}`);
        if (resultado.automovil_placa && resultado.automovil_placa !== 'No especificado') {
          detallesVehiculo.push(`Placa: ${resultado.automovil_placa}`);
        }
      } else if (resultado.moto_tipo && resultado.moto_tipo !== 'No especificado') {
        tipoVehiculo = '🏍️ Moto';
        if (resultado.moto_tipo && resultado.moto_tipo !== 'No especificado') {
          detallesVehiculo.push(`Tipo: ${resultado.moto_tipo}`);
        }
        if (resultado.moto_clase && resultado.moto_clase !== 'No especificado') {
          detallesVehiculo.push(`Clase: ${resultado.moto_clase}`);
        }
        if (resultado.moto_color && resultado.moto_color !== 'No especificado') {
          detallesVehiculo.push(`Color: ${resultado.moto_color}`);
        }
      }

      this.bot.sendMessage(chatId,
        `✅ *Formulario procesado:*\n\n` +
        `🏢 Torre: ${resultado.torre}\n` +
        `🏠 Apartamento: ${resultado.apartamento}\n` +
        `👤 Interesado: ${resultado.nombre_interesado}\n` +
        `📧 Correo: ${resultado.correo}\n` +
        `📱 Celular: ${resultado.celular}\n` +
        `📅 Fecha: ${resultado.fecha_solicitud}\n` +
        `🚗 Tipo de vehículo: ${tipoVehiculo}\n` +
        (detallesVehiculo.length > 0 ? `📋 Detalles: ${detallesVehiculo.join(', ')}\n` : '') +
        `🔗 [Ver formulario](${driveFile.url})`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('❌ Error procesando foto:', error);

      if (error.message === 'CONFIGURACION_DRIVE_FALTANTE') {
        this.bot.sendMessage(chatId,
          '❌ *Configuración incompleta*\n\n' +
          '🔧 Falta configurar GOOGLE_DRIVE_FOLDER_ID en las variables de entorno.\n' +
          '💡 Mientras tanto, puedes enviar solo texto sin imagen.',
          { parse_mode: 'Markdown' }
        );
      } else {
        this.bot.sendMessage(chatId,
          '❌ Error procesando la imagen. Intenta de nuevo o envía solo texto.'
        );
      }
    }
  }

  async procesarDocumento(msg) {
    const chatId = msg.chat.id;

    try {
      this.bot.sendMessage(chatId, '📄 Procesando documento...');

      const fileLink = await this.bot.getFileLink(msg.document.file_id);

      // Descargar imagen
      const response = await fetch(fileLink);
      const buffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);
      const base64 = imageBuffer.toString('base64');
      const imagenBase64 = `data:${msg.document.mime_type};base64,${base64}`;

      // Subir imagen a Google Drive
      const extension = msg.document.file_name ? msg.document.file_name.split('.').pop() : 'jpg';
      const nombreArchivo = `documento_${Date.now()}_${msg.document.file_id}.${extension}`;
      const driveFile = await this.drive.subirImagen(imageBuffer, nombreArchivo, msg.document.mime_type);

      // Obtener texto adicional si existe (caption)
      const textoAdicional = msg.caption || '';

      const resultado = await this.gemini.procesarImagen(imagenBase64, textoAdicional);

      // Verificar si hubo error en el procesamiento de Gemini
      if (resultado.error) {
        console.error('Error en Gemini procesando documento:', resultado.detalle);
        this.bot.sendMessage(chatId, '❌ Error procesando el documento con IA. Intenta de nuevo.');
        return;
      }

      // Agregar URL de la imagen al resultado
      resultado.urlImagen = driveFile.url;

      await this.sheets.agregarTransaccionConImagen(resultado);

      // Formatear monto en pesos colombianos
      const montoFormateado = this.formatearPesos(resultado.monto);

      this.bot.sendMessage(chatId,
        `✅ *Formulario procesado:*\n\n` +
        `🏢 Torre: ${resultado.torre}\n` +
        `🏠 Apartamento: ${resultado.apartamento}\n` +
        `👤 Interesado: ${resultado.nombre_interesado}\n` +
        `� Correo: ${resultado.correo}\n` +
        `� Celular: ${resultado.celular}\n` +
        `📅 Fecha: ${resultado.fecha_solicitud}\n` +
        `🔗 [Ver formulario](${driveFile.url})`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error procesando documento:', error);
      this.bot.sendMessage(chatId, '❌ Error procesando el documento. Intenta de nuevo.');
    }
  }

  async procesarPDF(msg) {
    const chatId = msg.chat.id;

    try {
      this.bot.sendMessage(chatId, '📄 Procesando PDF...');

      const fileLink = await this.bot.getFileLink(msg.document.file_id);

      // Descargar PDF
      const response = await fetch(fileLink);
      const buffer = await response.arrayBuffer();
      const pdfBuffer = Buffer.from(buffer);
      
      // Convertir PDF a base64
      const base64 = pdfBuffer.toString('base64');
      const pdfBase64 = `data:application/pdf;base64,${base64}`;

      // Subir PDF a Google Drive
      const extension = 'pdf';
      const nombreArchivo = `formulario_${Date.now()}_${msg.document.file_id}.${extension}`;
      const driveFile = await this.drive.subirImagen(pdfBuffer, nombreArchivo, 'application/pdf');

      // Obtener texto adicional si existe (caption)
      const textoAdicional = msg.caption || '';

      const resultado = await this.gemini.procesarPDF(pdfBase64, textoAdicional);

      // Verificar si hubo error en el procesamiento de Gemini
      if (resultado.error) {
        console.error('Error en Gemini procesando PDF:', resultado.detalle);
        this.bot.sendMessage(chatId,
          '⚠️ *PDF subido correctamente*\n\n' +
          '📄 Tu PDF se guardó en Google Drive\n' +
          '🔗 [Ver formulario](' + driveFile.url + ')\n\n' +
          '❌ *Error procesando con IA*\n' +
          '🤖 No se pudo extraer la información automáticamente',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Agregar URL del PDF al resultado
      resultado.urlImagen = driveFile.url;

      // Verificar autenticación de Sheets antes de agregar solicitud
      const sheetsAutenticado = await this.sheets.verificarAutenticacion();
      if (!sheetsAutenticado) {
        this.bot.sendMessage(chatId,
          '⚠️ *PDF subido correctamente*\n\n' +
          '📄 Tu PDF se guardó en Google Drive\n' +
          '🔗 [Ver formulario](' + driveFile.url + ')\n\n' +
          '❌ *No se pudo guardar en la hoja de cálculo*\n' +
          '🔐 Usa /auth para autorizar el acceso a Google Sheets',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      await this.sheets.agregarTransaccionConImagen(resultado);

      // Detectar tipo de vehículo basado en los campos llenos
      let tipoVehiculo = 'No especificado';
      let detallesVehiculo = [];
      
      if (resultado.automovil_marca && resultado.automovil_marca !== 'No especificado') {
        tipoVehiculo = '🚗 Automóvil';
        detallesVehiculo.push(`Marca: ${resultado.automovil_marca}`);
        if (resultado.automovil_placa && resultado.automovil_placa !== 'No especificado') {
          detallesVehiculo.push(`Placa: ${resultado.automovil_placa}`);
        }
      } else if (resultado.moto_tipo && resultado.moto_tipo !== 'No especificado') {
        tipoVehiculo = '🏍️ Moto';
        if (resultado.moto_tipo && resultado.moto_tipo !== 'No especificado') {
          detallesVehiculo.push(`Tipo: ${resultado.moto_tipo}`);
        }
        if (resultado.moto_clase && resultado.moto_clase !== 'No especificado') {
          detallesVehiculo.push(`Clase: ${resultado.moto_clase}`);
        }
        if (resultado.moto_color && resultado.moto_color !== 'No especificado') {
          detallesVehiculo.push(`Color: ${resultado.moto_color}`);
        }
      }

      this.bot.sendMessage(chatId,
        `✅ *Formulario PDF procesado:*\n\n` +
        `🏢 Torre: ${resultado.torre}\n` +
        `🏠 Apartamento: ${resultado.apartamento}\n` +
        `👤 Interesado: ${resultado.nombre_interesado}\n` +
        `📧 Correo: ${resultado.correo}\n` +
        `📱 Celular: ${resultado.celular}\n` +
        `📅 Fecha: ${resultado.fecha_solicitud}\n` +
        `🚗 Tipo de vehículo: ${tipoVehiculo}\n` +
        (detallesVehiculo.length > 0 ? `📋 Detalles: ${detallesVehiculo.join(', ')}\n` : '') +
        `🔗 [Ver formulario](${driveFile.url})`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error procesando PDF:', error);
      this.bot.sendMessage(chatId, '❌ Error procesando el PDF. Intenta de nuevo.');
    }
  }

  start() {
    console.log('🤖 Bot de Telegram iniciado');
  }

  formatearPesos(monto) {
    // Convertir a número si es string
    const numero = typeof monto === 'string' ? parseFloat(monto) : monto;

    // Formatear con separadores de miles
    return `$${numero.toLocaleString('es-CO')} COP`;
  }

  stop() {
    this.bot.stopPolling();
    console.log('🛑 Bot de Telegram detenido');
  }
}