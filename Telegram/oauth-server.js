import express from 'express';
import { DriveService } from './services/drive.js';

class OAuthServer {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.driveService = new DriveService();
    this.setupRoutes();
  }

  setupRoutes() {
    // Ruta para iniciar el proceso de autorización
    this.app.get('/auth', (req, res) => {
      try {
        const authUrl = this.driveService.obtenerUrlAutorizacion();
        res.redirect(authUrl);
      } catch (error) {
        console.error('Error generando URL de autorización:', error);
        res.status(500).send('Error generando URL de autorización');
      }
    });

    // Callback de Google OAuth
    this.app.get('/auth/google/callback', async (req, res) => {
      try {
        const { code, error } = req.query;
        
        if (error) {
          console.error('Error en callback OAuth:', error);
          res.status(400).send(`Error de autorización: ${error}`);
          return;
        }

        if (!code) {
          res.status(400).send('Código de autorización no recibido');
          return;
        }

        // Intercambiar código por tokens
        const tokens = await this.driveService.intercambiarCodigo(code);
        
        console.log('✅ Autorización OAuth completada exitosamente');
        
        res.send(`
          <html>
            <head>
              <title>Autorización Completada</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .success { color: #4CAF50; }
                .container { max-width: 500px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="success">✅ Autorización Completada</h1>
                <p>El bot ahora tiene acceso a tu Google Drive.</p>
                <p>Puedes cerrar esta ventana y regresar a Telegram.</p>
                <p><strong>¡Ya puedes enviar imágenes al bot!</strong></p>
              </div>
            </body>
          </html>
        `);
        
      } catch (error) {
        console.error('Error en callback OAuth:', error);
        res.status(500).send(`Error procesando autorización: ${error.message}`);
      }
    });

    // Ruta de estado
    this.app.get('/status', async (req, res) => {
      try {
        const autenticado = await this.driveService.verificarAutenticacion();
        res.json({
          authenticated: autenticado,
          message: autenticado ? 'OAuth configurado correctamente' : 'Se requiere autorización'
        });
      } catch (error) {
        res.status(500).json({
          authenticated: false,
          error: error.message
        });
      }
    });

    // Ruta raíz
    this.app.get('/', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Bot de Finanzas - OAuth</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .container { max-width: 500px; margin: 0 auto; }
              a { color: #4CAF50; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤖 Bot de Finanzas</h1>
              <p>Servidor OAuth para autorización con Google Drive</p>
              <p><a href="/auth">🔐 Autorizar acceso a Google Drive</a></p>
              <p><a href="/status">📊 Ver estado de autorización</a></p>
            </div>
          </body>
        </html>
      `);
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 Servidor OAuth ejecutándose en http://localhost:${this.port}`);
      console.log(`🔐 URL de autorización: http://localhost:${this.port}/auth`);
    });
  }
}

export { OAuthServer };