import { config } from 'dotenv';
import { TelegramService } from './services/telegram.js';
import { OAuthServer } from './oauth-server.js';

config();

// Verificar variables de entorno requeridas
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está configurado');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY no está configurado');
  process.exit(1);
}

if (!process.env.GOOGLE_SHEETS_ID) {
  console.error('❌ Error: GOOGLE_SHEETS_ID no está configurado');
  process.exit(1);
}

// Verificar variables OAuth
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('❌ Error: GOOGLE_CLIENT_ID no está configurado');
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_SECRET no está configurado');
  process.exit(1);
}

if (!process.env.GOOGLE_REDIRECT_URI) {
  console.error('❌ Error: GOOGLE_REDIRECT_URI no está configurado');
  process.exit(1);
}

// Inicializar servicios
const telegramBot = new TelegramService();
const oauthServer = new OAuthServer();

// Verificar estado de tokens al inicio
const estadoTokens = telegramBot.drive.obtenerEstadoTokens();
if (estadoTokens.existe && estadoTokens.persistente) {
  console.log('🎉 Tokens OAuth encontrados - Autenticación persistente activa');
  console.log(`📅 Autorizado desde: ${estadoTokens.fechaCreacion}`);
  console.log('💾 No necesitas autorizar nuevamente hasta reiniciar el servidor');
} else if (estadoTokens.existe && !estadoTokens.persistente) {
  console.log('⚠️  Tokens OAuth encontrados pero sin refresh_token');
  console.log('🔄 Es posible que necesites autorizar nuevamente pronto');
} else {
  console.log('🔐 No se encontraron tokens OAuth - Autorización inicial requerida');
}

// Iniciar servidor OAuth
oauthServer.start();

// Manejar señales de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando bot...');
  telegramBot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando bot...');
  telegramBot.stop();
  process.exit(0);
});

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  telegramBot.stop();
  process.exit(1);
});

console.log('🚀 Bot de sorteo de parqueadero iniciado');
console.log('📱 El bot está listo para procesar formularios');

// Mantener el proceso vivo
setInterval(() => {
  // Heartbeat cada 30 segundos
}, 30000);