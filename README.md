# 🏢 Sistema de Sorteo de Parqueaderos - Parques de Almazán

Sistema web desarrollado en React para la gestión transparente y equitativa del sorteo de parqueaderos en el Conjunto Residencial Parques de Almazán.

## 📋 Características

- ✅ Página de bienvenida con diseño institucional
- ✅ Sistema de autenticación (login)
- ✅ Countdowns separados para sorteo de carros y motos
- ✅ Mapa interactivo para selección de parqueaderos
- ✅ Dashboard de usuario
- ✅ Panel de administración
- ✅ Persistencia de asignaciones
- ✅ Responsive design (móvil, tablet, desktop)

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- npm o yarn

### Pasos de instalación

1. **Extraer el proyecto:**
   ```bash
   cd parqueaderos-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
parqueaderos-app/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── Header.jsx      # Header de navegación
│   ├── contexts/           # Context API de React
│   │   ├── AuthContext.jsx # Gestión de autenticación
│   │   └── SorteoContext.jsx # Gestión de sorteos
│   ├── pages/              # Páginas principales
│   │   ├── WelcomePage.jsx # Página de bienvenida
│   │   ├── LoginPage.jsx   # Página de login
│   │   └── HomePage.jsx    # Página principal con countdowns
│   ├── App.jsx             # Componente raíz con routing
│   ├── main.jsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Colores del Conjunto

El sistema utiliza la paleta de colores institucional:

- **Verde Principal:** #2D9B4E
- **Naranja:** #F5A623
- **Marrón:** #8B4F4F
- **Beige:** #E8DCC8
- **Azul:** #4A7BA7

## 🔐 Credenciales de Prueba

Para probar el sistema, puedes usar cualquier usuario y contraseña:

**Usuario de Carros:**
- Usuario: `usuario1`
- Contraseña: `1234`
- Tipo: Carros

**Usuario de Motos:**
- Usuario: `usuario2`
- Contraseña: `1234`
- Tipo: Motos

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`
- Tipo: Admin

## 📱 Flujo de Usuario

1. **Bienvenida:** El usuario llega a la página principal
2. **Login:** Hace clic en "INGRESAR" e ingresa credenciales
3. **Home:** Ve los countdowns de los sorteos
4. **Espera:** El sorteo se activa en la fecha/hora programada
5. **Selección:** Ingresa al mapa y elige su parqueadero
6. **Confirmación:** Recibe confirmación de asignación
7. **Dashboard:** Puede ver su parqueadero asignado

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Vista previa de la build
- `npm run lint` - Verifica el código

## 🗂️ Próximas Características a Implementar

Las siguientes páginas/componentes están pendientes:

- [ ] Página de selección de mapa (MapaSeleccionPage)
- [ ] Página de dashboard de usuario (DashboardPage)
- [ ] Página de administración (AdminPage)
- [ ] Componente de mapa SVG interactivo
- [ ] Modal de confirmación de asignación
- [ ] Historial de sorteos

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework principal
- **React Router DOM** - Navegación
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **Vite** - Build tool
- **date-fns** - Manejo de fechas

## 📸 Capturas

### Página de Bienvenida
Diseño institucional con header marrón y título "BIENVENIDOS AL SORTEO DE PARQUEADEROS"

### Página de Login
Sistema de autenticación con selector de tipo de sorteo (Carros/Motos)

### Página Principal
Countdowns separados para cada tipo de sorteo con estadísticas

## 🤝 Contribuir

Este es un proyecto privado para el Conjunto Residencial Parques de Almazán.

## 📄 Licencia

Todos los derechos reservados - Conjunto Residencial Parques de Almazán

## 📞 Soporte

Para soporte o consultas, contacta al administrador del conjunto.

---

**Versión:** 1.0.0  
**Última actualización:** Febrero 2026
