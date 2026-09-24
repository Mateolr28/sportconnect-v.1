# ⚽ SportConnect - Plataforma de Reclutamiento Deportivo

SportConnect es una plataforma web full-stack de alto rendimiento diseñada para la visibilización de talentos deportivos, el reclutamiento por parte de clubes/academias y la comunicación directa y en tiempo real entre deportistas y reclutadores.

Toda la arquitectura de persistencia, autenticación, almacenamiento multimedia y eventos en tiempo real está construida sobre **Supabase** (PostgreSQL, Supabase Auth, Supabase Storage y Supabase Realtime), complementada con un backend en **Node.js + Express** para lógica de servidor y un cliente web con **React + Vite + Tailwind CSS**.

---

## 🚀 1. Stack Tecnológico

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend:** Node.js, Express.js.
- **Backend-as-a-Service:** Supabase.
  - **Base de Datos:** PostgreSQL con extensiones `uuid-ossp` y `pgcrypto`.
  - **Autenticación:** Supabase Auth (Email y Contraseña, Row Level Security).
  - **Almacenamiento:** Supabase Storage (`sports-videos`, `avatars`).
  - **Tiempo Real:** Supabase Realtime (WebSockets para mensajería en vivo).
- **Cliente:** `@supabase/supabase-js`.

---

## 📁 2. Estructura Completa del Proyecto

```text
SportConnect/
├── .env.example                     # Variables de entorno públicas y privadas
├── index.html                       # HTML principal con SEO y tipografía
├── metadata.json                    # Metadatos del applet
├── package.json                     # Scripts y dependencias unificadas
├── tsconfig.json                    # Configuración TypeScript
├── vite.config.ts                   # Configuración Vite + Tailwind CSS
├── server.ts                        # Servidor unificado Express + Vite middlewares
│
├── server/                          # Backend Express
│   └── src/
│       ├── controllers/
│       │   ├── chatsController.ts   # Lógica de chats y mensajes
│       │   ├── postsController.ts   # CRUD de videos deportivos y likes
│       │   └── profilesController.ts# Perfiles de deportistas y scouts
│       ├── middleware/
│       │   └── authMiddleware.ts    # Verificación de JWT con Supabase Admin
│       ├── routes/
│       │   └── apiRoutes.ts         # Rutas de la API REST (/api/*)
│       ├── lib/
│       │   └── supabaseServer.ts    # Cliente Supabase con Service Role
│       └── app.ts                   # Configuración Express y CORS
│
├── src/                             # Frontend React
│   ├── components/
│   │   ├── AthleteProfileView.tsx   # Perfil de deportista con estadísticas y logros
│   │   ├── ChatList.tsx             # Lista lateral de conversaciones
│   │   ├── ChatWindow.tsx           # Ventana de mensajes en tiempo real
│   │   ├── CommentsModal.tsx        # Modal de comentarios
│   │   ├── EditProfileModal.tsx     # Edición de perfil y estadísticas
│   │   ├── FilterModal.tsx          # Filtros por deporte, edad, posición
│   │   ├── MessageBubble.tsx        # Burbuja de mensaje enviado/recibido
│   │   ├── RecruiterProfileView.tsx # Perfil de club / reclutador
│   │   ├── Sidebar.tsx              # Barra de navegación fija con logo SportConnect
│   │   ├── SupabaseInfoModal.tsx    # Guía interactiva de conexión
│   │   ├── VideoCard.tsx            # Tarjeta de video con likes, comentarios y contacto
│   │   └── VideoPlayer.tsx          # Reproductor de video interactivo con controles
│   ├── contexts/
│   │   └── AuthContext.tsx          # Proveedor global de autenticación Supabase
│   ├── lib/
│   │   ├── mockData.ts              # Datos iniciales para pruebas
│   │   └── supabase.ts              # Cliente Supabase del frontend (Anon Key)
│   ├── pages/
│   │   ├── FeedPage.tsx             # Inicio con publicaciones y búsqueda
│   │   ├── LoginPage.tsx            # Login con diseño azul oscuro y tarjeta
│   │   ├── MessagesPage.tsx         # Sistema de mensajería de dos columnas
│   │   ├── ProfilePage.tsx          # Perfil dinámico según rol
│   │   ├── RegisterPage.tsx         # Registro con selección Deportista / Reclutador
│   │   └── UploadPage.tsx           # Subida Drag & Drop con progreso y validaciones
│   ├── services/
│   │   └── supabaseService.ts       # Consultas a PostgreSQL, Storage y Realtime
│   ├── types/
│   │   └── index.ts                 # Definiciones TypeScript completas
│   ├── App.tsx                      # Componente raíz con enrutamiento
│   ├── index.css                    # Directivas de Tailwind CSS
│   └── main.tsx                     # Punto de entrada ReactDOM
│
└── supabase/
    ├── migrations/
    │   └── 0001_sportconnect_schema.sql # Esquema SQL, Triggers, RLS y Políticas
    ├── config.toml                  # Configuración Supabase CLI
    └── seed.sql                     # Datos de prueba iniciales
```

---

## 🔐 3. Variables de Entorno

Configura tu archivo `.env` tomando como base `.env.example`:

### Frontend (Públicas - comienzan con `VITE_`):
- `VITE_SUPABASE_URL`: URL del proyecto Supabase (ej. `https://xyzcompany.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Llave pública `anon` de Supabase. Es segura para el navegador ya que está restringida por las políticas Row Level Security (RLS).
- `VITE_API_URL`: URL base del backend Express (opcional si se ejecuta de forma unificada).

### Backend (Privadas - NUNCA exponer al cliente o navegador):
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_ANON_KEY`: Llave anónima para consultas estándar en el servidor.
- `SUPABASE_SERVICE_ROLE_KEY`: **¡Privada y Crítica!** Permite bypass de RLS para tareas de administración o triggers del servidor.
- `PORT`: Puerto de escucha del servidor (por defecto `3000`).

---

## 🗄️ 4. Configuración del Proyecto en Supabase

1. **Crear Proyecto:**
   - Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. **Ejecutar el Esquema SQL:**
   - Ve a la sección **SQL Editor** en el dashboard de Supabase.
   - Copia y ejecuta todo el contenido de `supabase/migrations/0001_sportconnect_schema.sql`.
   - Opcional: ejecuta `supabase/seed.sql` para cargar deportistas, clubes y videos de ejemplo.
3. **Verificar Buckets en Storage:**
   - El script SQL crea automáticamente los buckets `sports-videos` y `avatars` con acceso público de lectura y políticas de subida para usuarios autenticados.
4. **Habilitar Supabase Realtime:**
   - En el SQL Editor, el comando `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;` activa la sincronización en vivo de los mensajes sin recargar la página.

---

## 🛠️ 5. Instalación y Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo Desarrollo (Frontend + Backend unificado):**
   ```bash
   npm run dev
   ```
   La aplicación se iniciará en `http://localhost:3000`.

3. **Construir para Producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 🌟 6. Características Principales

- **Feed Dinámico:** Filtros por deporte, edad, posición y búsqueda en texto.
- **Reproductor de Video:** Reproducción fluida, pantalla completa, silenciamiento y etiquetas de posición deportiva.
- **Subida de Videos Deportivos:** Zona Drag & Drop con límite de 500 MB, formatos MP4/MOV/AVI, barra de progreso y consejos para destacar.
- **Mensajería Instantánea:** Chats en tiempo real mediante Supabase Realtime, ordenados por última actividad y con contador de no leídos.
- **Perfiles Especializados:**
  - *Deportistas:* Partidos, goles, asistencias, logros destacados y galería de videos propios.
  - *Reclutadores:* Deportistas contactados, contrataciones, scouts activos, requisitos de búsqueda y actividad reciente.
- **Seguridad Robusta:** Tablas protegidas con Row Level Security (RLS). Los usuarios solo pueden editar su propio contenido.
