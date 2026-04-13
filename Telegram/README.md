# 🤖 Bot de Finanzas Personal - Telegram

Bot de Telegram para gestión automática de finanzas personales que procesa texto e imágenes usando IA y guarda los datos en Google Sheets.

## ✨ Características

- 📱 **Bot de Telegram**: Interfaz conversacional fácil de usar
- 🤖 **IA con Gemini**: Procesamiento inteligente de texto e imágenes
- 📊 **Google Sheets**: Almacenamiento automático en hojas de cálculo
- 📷 **Procesamiento de imágenes**: Extrae datos de comprobantes y facturas
- 💬 **Comandos interactivos**: `/start`, `/help`, `/stats`
- 🐳 **Docker**: Containerización para fácil despliegue en la nube
- 🔒 **Seguro**: Manejo seguro de tokens y credenciales

## 🚀 Instalación

### Prerrequisitos

1. **Bot de Telegram**:
   - Habla con [@BotFather](https://t.me/botfather) en Telegram
   - Crea un nuevo bot con `/newbot`
   - Guarda el token que te proporciona

2. **Google Gemini API**:
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una API key para Gemini

3. **Google Sheets API**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto y habilita la API de Google Sheets
   - Crea credenciales de cuenta de servicio
   - Descarga el archivo JSON de credenciales
   - Comparte tu hoja de Google Sheets con el email de la cuenta de servicio

4. **Google Drive API** (para guardar imágenes):
   - En el mismo proyecto de Google Cloud, habilita la API de Google Drive
   - Crea una carpeta en tu Google Drive para las imágenes
   - Comparte esa carpeta con el email de la cuenta de servicio (ej: `bot-finanzas@tu-proyecto.iam.gserviceaccount.com`)
   - Copia el ID de la carpeta desde la URL (la parte después de `/folders/`)

### Instalación Local

```bash
# Clonar repositorio
git clone <tu-repositorio>
cd bot-finanzas-telegram

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar bot
npm start
```

### Instalación con Docker

```bash
# Construir imagen
docker build -t bot-finanzas .

# Ejecutar con docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## ⚙️ Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_telegram_bot_token_aqui

# Google Gemini API
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Google Sheets
GOOGLE_SHEETS_ID=tu_sheet_id_aqui
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Google Drive (para guardar imágenes)
GOOGLE_DRIVE_FOLDER_ID=tu_folder_id_aqui
```

### Configuración de Google Sheets

Tu hoja debe tener estas columnas en la primera fila:

| A | B | C | D | E |
|---|---|---|---|---|
| Fecha | Monto | Descripción | Categoría | Imagen URL |

### Configuración de Google Drive

1. **Crear carpeta**: Crea una carpeta en tu Google Drive para almacenar las imágenes
2. **Compartir carpeta**: Haz clic derecho en la carpeta → "Compartir" → Agrega el email de tu cuenta de servicio como "Editor"
3. **Obtener ID**: Copia el ID de la carpeta desde la URL (ej: `https://drive.google.com/drive/folders/1ABC...XYZ` → el ID es `1ABC...XYZ`)
4. **Configurar variable**: Agrega `GOOGLE_DRIVE_FOLDER_ID=1ABC...XYZ` a tu archivo `.env`

> **Importante**: Las cuentas de servicio no tienen cuota de almacenamiento propia, por eso es necesario compartir una carpeta de tu Google Drive personal con la cuenta de servicio.

## 📱 Uso

### Comandos disponibles

- `/start` - Iniciar el bot y ver bienvenida
- `/help` - Mostrar ayuda y comandos
- `/stats` - Ver últimas 5 transacciones

### Enviar gastos

1. **Texto**: Envía un mensaje como "Compré café por $5"
2. **Imagen**: Envía foto de comprobante o factura
3. **Documento**: Envía imagen como archivo

El bot procesará automáticamente la información y la guardará en tu Google Sheets.

## 🏗️ Estructura del Proyecto

```
bot-finanzas-telegram/
├── services/
│   ├── telegram.js      # Servicio principal del bot
│   ├── gemini.js        # Integración con Gemini AI
│   └── sheets.js        # Integración con Google Sheets
├── server.js            # Punto de entrada principal
├── package.json         # Dependencias y scripts
├── Dockerfile           # Configuración Docker
├── docker-compose.yml   # Orquestación Docker
├── .env.example         # Plantilla de variables de entorno
└── README.md           # Este archivo
```

## 🐳 Despliegue en la Nube

### Con Docker

1. **Construir imagen**:
```bash
docker build -t tu-usuario/bot-finanzas .
```

2. **Subir a registry**:
```bash
docker push tu-usuario/bot-finanzas
```

3. **Desplegar en tu servicio favorito**:
   - Railway
   - Render
   - DigitalOcean
   - AWS ECS
   - Google Cloud Run

### Variables de entorno en producción

Asegúrate de configurar estas variables en tu servicio de nube:
- `TELEGRAM_BOT_TOKEN`
- `GEMINI_API_KEY`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (o usar credenciales como JSON string)

## 🔧 Scripts Disponibles

- `npm start` - Iniciar bot en producción
- `npm run dev` - Iniciar bot en desarrollo con auto-reload

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **ES Modules** - Módulos modernos de JavaScript
- **node-telegram-bot-api** - SDK para bots de Telegram
- **@google/generative-ai** - SDK de Gemini AI
- **googleapis** - SDK de Google APIs
- **Docker** - Containerización

## 🔒 Seguridad

- Todas las credenciales se manejan como variables de entorno
- El bot corre con usuario no-root en Docker
- Límites de recursos configurados
- Health checks implementados

## 🐛 Solución de Problemas

### Bot no responde
- Verifica que el token de Telegram sea correcto
- Revisa los logs: `docker-compose logs -f`

### Error de Gemini API
- Verifica que la API key sea válida
- Asegúrate de tener créditos en tu cuenta

### Error de Google Sheets
- Verifica que el archivo de credenciales sea correcto
- Asegúrate de que la hoja esté compartida con la cuenta de servicio
- Verifica que el ID de la hoja sea correcto

### Error de Google Drive (403 Forbidden)
- Verifica que hayas creado y compartido una carpeta con la cuenta de servicio
- El email de la cuenta de servicio debe tener permisos de "Editor" en la carpeta
- Verifica que el `GOOGLE_DRIVE_FOLDER_ID` sea correcto
- Las cuentas de servicio no pueden crear carpetas en su propio Drive, deben usar carpetas compartidas

## 📝 Logs

Los logs se guardan en el directorio `logs/` y están configurados para rotar automáticamente.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ve el archivo LICENSE para más detalles.

## 🙏 Agradecimientos

- Google por Gemini AI y Google Sheets API
- Telegram por su excelente Bot API
- La comunidad de Node.js

---

¡Disfruta gestionando tus finanzas con IA! 🚀💰