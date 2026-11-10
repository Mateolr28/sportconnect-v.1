# ⚽ SportConnect - Plataforma de Reclutamiento Deportivo

SportConnect es una plataforma web full-stack de alto rendimiento diseñada para la visibilización de talentos deportivos, el reclutamiento por parte de clubes/academias y la comunicación directa y en tiempo real entre deportistas y reclutadores.

Toda la arquitectura de persistencia, autenticación, almacenamiento multimedia y eventos en tiempo real está construida sobre **Supabase** (PostgreSQL, Supabase Auth, Supabase Storage y Supabase Realtime). El cliente web usa **React + Vite + Tailwind CSS** y un servidor **Node.js + Express** mínimo que solo sirve la aplicación.

---

## 🚀 1. Stack Tecnológico

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React icons.
- **Servidor web:** Node.js + Express (solo sirve el cliente; sin API propia).
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
├── server.ts                        # Servidor Express que sirve el cliente (Vite en desarrollo)
│
├── vercel.json                      # Reescritura de rutas para que /perfil/:id cargue la app
│
├── src/                             # Frontend React
│   ├── components/                  # Tarjetas, modales, chat, perfiles, seguidores, prospectos
│   ├── contexts/
│   │   └── AuthContext.tsx          # Sesión, registro, recuperación de contraseña y perfil propio
│   ├── data/
│   │   ├── locationOptions.ts       # Países, regiones y ciudades (se carga solo en registro y edición)
│   │   └── sports.ts                # Catálogo de deportes
│   ├── lib/
│   │   ├── passwordPolicy.ts        # Reglas de contraseña
│   │   ├── postFilters.ts           # Filtros del feed
│   │   ├── router.ts                # Rutas de la app sobre la History API
│   │   ├── supabase.ts              # Cliente Supabase del frontend (Anon Key)
│   │   └── __tests__/               # Tests unitarios
│   ├── pages/
│   │   ├── FeedPage.tsx             # Inicio (siguiendo) y Talentos (todas), con paginación
│   │   ├── SearchPage.tsx           # Descubrir deportistas
│   │   ├── ProspectsPage.tsx        # Prospectos del reclutador
│   │   ├── ProfilePage.tsx          # Perfil dinámico según rol
│   │   ├── UploadPage.tsx           # Publicar foto o video
│   │   ├── MessagesPage.tsx         # Mensajería de dos columnas
│   │   ├── LoginPage.tsx / RegisterPage.tsx
│   │   └── ForgotPasswordPage.tsx / ResetPasswordPage.tsx
│   ├── services/                    # Acceso a datos por dominio
│   │   ├── supabaseService.ts       # Fachada que reúne los servicios
│   │   ├── profileService.ts, postsService.ts, chatService.ts, storageService.ts
│   │   ├── followService.ts, historyService.ts, prospectsService.ts
│   │   └── __tests__/               # Tests con Supabase simulado
│   ├── types/
│   │   └── index.ts                 # Definiciones TypeScript
│   ├── App.tsx                      # Componente raíz y navegación
│   ├── index.css                    # Directivas de Tailwind CSS
│   └── main.tsx                     # Punto de entrada ReactDOM
│
└── supabase/
    ├── migrations/                  # 0001 a 0013, se ejecutan en orden
    ├── templates/                   # Plantillas de correo (confirmación y recuperación)
    ├── config.toml                  # Configuración Supabase CLI
    └── seed.sql                     # Datos de prueba iniciales
```

---

## 🔐 3. Variables de Entorno

Configura tu archivo `.env` tomando como base `.env.example`:

### Frontend (Públicas - comienzan con `VITE_`):
- `VITE_SUPABASE_URL`: URL del proyecto Supabase (ej. `https://xyzcompany.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Llave pública `anon` de Supabase. Es segura para el navegador ya que está restringida por las políticas Row Level Security (RLS).

> **Importante:** la URL y la clave deben pertenecer al mismo proyecto Supabase activo. Si el navegador muestra `ERR_NAME_NOT_RESOLVED` al llamar a `/auth/v1/token`, el dominio configurado ya no resuelve (por ejemplo, el proyecto fue eliminado o la URL es antigua). Actualiza `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de **Project Settings > API** y reinicia el servidor de desarrollo para que Vite vuelva a cargar `.env`.

### Servidor:
- `PORT`: Puerto de escucha del servidor (por defecto `3000`).

> La aplicación no usa `SUPABASE_SERVICE_ROLE_KEY`: todo el acceso a datos pasa por la clave `anon` y las políticas RLS. No la pongas en `.env`.

---

## 🗄️ 4. Configuración del Proyecto en Supabase

1. **Crear Proyecto:**
   - Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. **Ejecutar el Esquema SQL:**
   - Ve a la sección **SQL Editor** en el dashboard de Supabase.
   - Ejecuta **en orden** todos los archivos de `supabase/migrations/`, de `0001_sportconnect_schema.sql` a `0013_protect_profile_columns.sql`. Cada uno parte del estado que deja el anterior.
   - Si la base de datos ya existía, ejecuta solo las migraciones que aún no hayas aplicado.
   - Opcional: ejecuta `supabase/seed.sql` para cargar cuatro usuarios autenticables, deportistas, clubes, videos, comentarios y chats de ejemplo.
   - Las cuentas de prueba usan la contraseña `Test1234!`:
     - `carlos.martinez@sportconnect.dev` (deportista)
     - `ana.rodriguez@sportconnect.dev` (deportista)
     - `scout.fcb@sportconnect.dev` (reclutador)
     - `scout.rm@sportconnect.dev` (reclutador)
   - Ejecuta el seed después de las migraciones, desde **SQL Editor**. Es idempotente y puede ejecutarse de nuevo para restaurar los datos.
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

2. **Ejecutar en modo Desarrollo (Vite servido por Express):**
   ```bash
   npm run dev
   ```
   La aplicación se iniciará en `http://localhost:3000`.

3. **Comprobaciones:**
   ```bash
   npm run lint
   npm test
   ```

4. **Construir para Producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 🌟 6. Características Principales

- **Feed Dinámico:** Filtros por deporte, edad, posición y búsqueda en texto, con carga por páginas.
- **Enlaces compartibles:** Cada sección tiene su URL y cada perfil la suya (`/perfil/:id`).
- **Seguidores, historial deportivo y prospectos:** Seguir perfiles, línea de tiempo de equipos y torneos, y seguimiento de deportistas de interés para reclutadores.
- **Reproductor de Video:** Reproducción fluida, pantalla completa, silenciamiento y etiquetas de posición deportiva.
- **Subida de Videos Deportivos:** Zona Drag & Drop con límite de 500 MB, formatos MP4/MOV/AVI, barra de progreso y consejos para destacar.
- **Mensajería Instantánea:** Chats en tiempo real mediante Supabase Realtime, ordenados por última actividad y con contador de no leídos.
- **Perfiles Especializados:**
  - *Deportistas:* Partidos, goles, asistencias, logros destacados y galería de videos propios.
  - *Reclutadores:* Deportistas contactados, contrataciones, scouts activos, requisitos de búsqueda y actividad reciente.
- **Seguridad Robusta:** Tablas protegidas con Row Level Security (RLS). Los usuarios solo pueden editar su propio contenido.
