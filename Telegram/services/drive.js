import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export class DriveService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    this.tokensPath = path.join(process.cwd(), 'tokens.json');
    
    // Cargar tokens si existen
    this.cargarTokens();
  }
  
  cargarTokens() {
    try {
      if (fs.existsSync(this.tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
        
        // Verificar que los tokens tienen la estructura correcta
        if (tokens && (tokens.access_token || tokens.refresh_token)) {
          this.oauth2Client.setCredentials(tokens);
          console.log('✅ Tokens OAuth cargados exitosamente');
          console.log('🔐 Autenticación persistente activa - no necesitas autorizar nuevamente');
        } else {
          console.log('⚠️ Tokens OAuth inválidos. Se requiere autorización inicial.');
        }
      } else {
        console.log('⚠️ No se encontraron tokens OAuth. Se requiere autorización inicial.');
      }
    } catch (error) {
      console.error('❌ Error cargando tokens OAuth:', error.message);
      console.log('⚠️ Se requiere autorización inicial.');
    }
  }
  
  guardarTokens(tokens) {
    try {
      fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
      console.log('✅ Tokens OAuth guardados exitosamente');
    } catch (error) {
      console.error('❌ Error guardando tokens OAuth:', error.message);
    }
  }
  
  obtenerUrlAutorizacion() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive'
      ],
      prompt: 'consent', // Fuerza el consentimiento para obtener refresh_token
      include_granted_scopes: true
    });
    console.log('🔗 URL de autorización generada para autenticación persistente');
    return authUrl;
  }
  
  async intercambiarCodigo(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Agregar timestamp para tracking
      tokens.created_at = new Date().toISOString();
      
      this.oauth2Client.setCredentials(tokens);
      this.guardarTokens(tokens);
      
      console.log('🎉 Autenticación OAuth completada - tokens persistentes guardados');
      console.log('💾 La autenticación se mantendrá activa hasta que reinicies el servidor');
      
      return tokens;
    } catch (error) {
      console.error('❌ Error intercambiando código por tokens:', error.message);
      throw error;
    }
  }
  
  async renovarTokens() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Mantener el refresh_token si no viene en la respuesta
      const tokensActuales = this.oauth2Client.credentials;
      if (!credentials.refresh_token && tokensActuales.refresh_token) {
        credentials.refresh_token = tokensActuales.refresh_token;
      }
      
      this.oauth2Client.setCredentials(credentials);
      this.guardarTokens(credentials);
      console.log('✅ Tokens renovados exitosamente - autenticación persistente mantenida');
      return credentials;
    } catch (error) {
      console.error('❌ Error renovando tokens:', error.message);
      console.log('⚠️ Se requiere nueva autorización. Usa /auth para obtener el enlace.');
      throw error;
    }
  }
  
  async verificarAutenticacion() {
    try {
      // Intentar hacer una llamada simple para verificar autenticación
      await this.drive.about.get({ fields: 'user' });
      return true;
    } catch (error) {
      if (error.code === 401) {
        console.log('🔄 Token expirado, intentando renovar automáticamente...');
        try {
          await this.renovarTokens();
          console.log('✅ Autenticación renovada automáticamente - persistencia mantenida');
          return true;
        } catch (refreshError) {
          console.error('❌ Error renovando tokens:', refreshError.message);
          return false;
        }
      }
      console.error('❌ Error verificando autenticación:', error.message);
      return false;
    }
  }
  
  obtenerEstadoTokens() {
    try {
      if (fs.existsSync(this.tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
        const tieneRefreshToken = !!tokens.refresh_token;
        const tieneAccessToken = !!tokens.access_token;
        const fechaCreacion = tokens.created_at ? new Date(tokens.created_at).toLocaleString() : 'Desconocida';
        
        return {
          existe: true,
          tieneRefreshToken,
          tieneAccessToken,
          fechaCreacion,
          persistente: tieneRefreshToken
        };
      }
      return { existe: false };
    } catch (error) {
      return { existe: false, error: error.message };
    }
  }

  async subirImagen(buffer, nombreArchivo, mimeType = 'image/jpeg') {
    let tempPath = null;
    
    try {
      // Verificar que tenemos folder ID configurado
      if (!this.folderId) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID no está configurado en las variables de entorno');
      }
      
      // Verificar autenticación OAuth
      const autenticado = await this.verificarAutenticacion();
      if (!autenticado) {
        throw new Error('OAUTH_NO_AUTENTICADO: Se requiere autorización OAuth. Usa /auth para obtener el enlace de autorización.');
      }
      
      // Crear archivo temporal
      tempPath = path.join(process.cwd(), 'uploads', nombreArchivo);
      
      // Asegurar que el directorio existe
      const uploadsDir = path.dirname(tempPath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Escribir buffer a archivo temporal
      fs.writeFileSync(tempPath, buffer);
      
      const fileMetadata = {
        name: nombreArchivo,
        parents: [this.folderId]
      };
      
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(tempPath)
      };
      
      // Subir archivo a Google Drive
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink',
        supportsAllDrives: true // Importante para shared drives
      });
      
      // Hacer el archivo público
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        },
        supportsAllDrives: true // Importante para shared drives
      });
      
      // Generar URL de vista directa
      const fileId = response.data.id;
      const directViewUrl = `https://drive.google.com/uc?id=${fileId}`;
      
      console.log('✅ Imagen subida a Drive:', {
        id: fileId,
        name: response.data.name,
        url: directViewUrl
      });
      
      return {
        id: fileId,
        name: response.data.name,
        url: directViewUrl,
        webViewLink: response.data.webViewLink
      };
      
    } catch (error) {
      console.error('❌ Error subiendo imagen a Drive:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      // Proporcionar mensaje de error más específico
      if (error.code === 403) {
        const errorMsg = 'Error 403: No tienes permisos para subir archivos a esta carpeta de Google Drive. ' +
                        'Verifica que tengas acceso de escritura a la carpeta configurada.';
        throw new Error(errorMsg);
      }
      
      if (error.message && error.message.includes('OAUTH_NO_AUTENTICADO')) {
        throw error; // Re-lanzar error de OAuth sin modificar
      }
      
      throw error;
    } finally {
      // Siempre limpiar archivo temporal, incluso si hay error
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
          console.log('🧹 Archivo temporal eliminado:', tempPath);
        } catch (cleanupError) {
          console.warn('⚠️ No se pudo eliminar archivo temporal:', tempPath, cleanupError.message);
        }
      }
    }
  }

  extraerDriveId(link) {
    const str = String(link || '').trim();
    const folder = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folder?.[1]) return { id: folder[1], tipo: 'folder' };
    const file = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (file?.[1]) return { id: file[1], tipo: 'file' };
    return null;
  }

  async listarArchivosCarpeta(folderId) {
    const resp = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,createdTime)',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    });
    return resp.data.files || [];
  }

  async descargarArchivoBase64(fileId) {
    const resp = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(resp.data).toString('base64');
  }

  async obtenerExpedientePdf(link) {
    const ref = this.extraerDriveId(link);
    if (!ref) {
      return { ok: false, error: 'Link de expediente inválido' };
    }

    if (ref.tipo === 'folder') {
      const files = await this.listarArchivosCarpeta(ref.id);
      const pdf = files.find((f) => f.mimeType === 'application/pdf');
      if (!pdf) {
        return { ok: false, error: 'La carpeta no contiene PDF (obligatorio)' };
      }
      const data = await this.descargarArchivoBase64(pdf.id);
      return { ok: true, archivo: { mimeType: 'application/pdf', data, nombre: pdf.name } };
    }

    const info = await this.drive.files.get({
      fileId: ref.id,
      fields: 'id,name,mimeType',
      supportsAllDrives: true
    });

    if (info.data.mimeType !== 'application/pdf') {
      return { ok: false, error: 'El expediente debe ser un PDF' };
    }

    const data = await this.descargarArchivoBase64(ref.id);
    return { ok: true, archivo: { mimeType: 'application/pdf', data, nombre: info.data.name } };
  }

  async eliminarImagen(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      console.log('Imagen eliminada de Drive:', fileId);
      return true;
    } catch (error) {
      console.error('Error eliminando imagen de Drive:', error);
      throw error;
    }
  }

  async obtenerInformacionArchivo(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,webViewLink,webContentLink,size,createdTime'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información del archivo:', error);
      throw error;
    }
  }
}