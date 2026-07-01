# InnovaTube

InnovaTube es una aplicación web full-stack premium para la búsqueda de videos de YouTube, gestión de favoritos y autenticación de usuarios.

La aplicación utiliza un diseño responsivo "mobile-first" y está estructurada con las siguientes tecnologías:
- **Frontend:** Angular 18+ (arquitectura standalone, sin NgModules) y Angular Material.
- **Backend:** Node.js, Express.js y MongoDB (con Mongoose).
- **Seguridad:** Autenticación JWT, contraseñas hasheadas con bcrypt, rate limiting, Helmet, CORS restringido y validaciones con `express-validator`.
- **Contenedores:** Docker y Docker Compose.

---

## Estructura del Proyecto

```text
innovatube/
├── backend/            # API Service (Node/Express)
│   ├── src/            # Código fuente backend
│   ├── Dockerfile      # Dockerfile para Node.js
│   └── .env.example    # Plantilla de variables de entorno
├── frontend/           # Aplicación de cliente (Angular 18)
│   ├── src/            # Código fuente frontend (standalone components)
│   ├── Dockerfile      # Dockerfile multi-stage (Build & Nginx)
│   └── nginx.conf      # Configuración de Nginx con Reverse Proxy y SPA fallback
├── docker-compose.yml  # Orquestador local de servicios (mongo + backend + frontend)
└── README.md           # Guía de documentación (esta)
```

---

## Configuración de Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` basándote en `backend/.env.example`.

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto en el que corre el servidor backend | `5000` |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`) | `development` |
| `MONGO_URI` | Cadena de conexión para MongoDB | `mongodb://localhost:27017/innovatube` |
| `JWT_SECRET` | Llave secreta para firmar tokens JWT | *Debe ser compleja* |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token JWT | `30d` |
| `CLIENT_URL` | URL del cliente frontend (utilizado para CORS) | `http://localhost:4200` |
| `RECAPTCHA_SECRET_KEY` | Clave secreta de Google reCAPTCHA v2 | *Clave de prueba provista por defecto* |
| `YOUTUBE_API_KEY` | Clave de API de Google Developer Console (YouTube Data API v3) | *Opcional en desarrollo (activa mock fallback)* |
| `SMTP_HOST` | Host para el servidor SMTP (recuperación de contraseña) | `smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto para el servidor SMTP | `2525` |
| `SMTP_USER` | Usuario del servidor SMTP | *Vacio* |
| `SMTP_PASS` | Contraseña del servidor SMTP | *Vacio* |

> [!NOTE]
> Por defecto, si no configuras `YOUTUBE_API_KEY`, el backend detectará que falta y responderá con **datos de videos simulados (mock data)**. De igual manera, si no configuras credenciales SMTP, el servidor imprimirá el enlace de restablecimiento de contraseña directamente en los logs de la consola del backend para facilitar las pruebas.

---

## Ejecución Local (Desarrollo)

### Requisitos Previos
- Node.js (v20 o superior)
- MongoDB instalado y corriendo localmente (puerto `27017`)

### Paso 1: Configurar y levantar el Backend
1. Navega al directorio `backend/`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` a `.env` y edita los valores necesarios:
   ```bash
   cp .env.example .env
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El backend estará disponible en `http://localhost:5000`.

### Paso 2: Configurar y levantar el Frontend
1. Abre otra terminal y navega al directorio `frontend/`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor local de Angular:
   ```bash
   npm start
   ```
   La aplicación estará disponible en `http://localhost:4200`.

---

## Ejecución con Docker Compose

Docker Compose configurará todo el entorno (MongoDB, backend de Node, y frontend de Angular servido por Nginx en el puerto 80) sin necesidad de instalar dependencias locales de base de datos.

1. Asegúrate de tener **Docker Desktop** iniciado.
2. Abre una terminal en la raíz del proyecto.
3. Ejecuta el siguiente comando para construir y levantar todos los servicios:
   ```bash
   docker compose up --build -d
   ```
4. Una vez levantados los servicios:
   - Accede a la aplicación web en: `http://localhost` (puerto `80`).
   - El backend estará disponible internamente y las llamadas API serán proxy-adas de `http://localhost/api` a `http://localhost:5000/api` automáticamente por Nginx.
   - MongoDB persistirá sus datos localmente en un volumen llamado `mongo-data`.

Para detener la ejecución de contenedores:
```bash
docker compose down
```

---

## Despliegue en Render

Puedes desplegar ambos servicios de manera gratuita en Render configurándolos por separado.

### 1. Despliegue del Backend (Web Service)
1. Crea un nuevo servicio en Render seleccionando **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configura los siguientes detalles:
   - **Name:** `innovatube-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En la pestaña **Environment**, agrega las variables de entorno detalladas en la tabla de arriba. Asegúrate de configurar un servicio MongoDB externo (como MongoDB Atlas) e introducir su URL en `MONGO_URI`.
5. Una vez desplegado, copia la URL del backend provista por Render (ej. `https://innovatube-backend.onrender.com`).

### 2. Despliegue del Frontend (Static Site)
Como compilamos el frontend de Angular a HTML/CSS/JS estáticos, se puede desplegar como un sitio estático gratuito en Render.
1. Crea un nuevo servicio en Render seleccionando **Static Site**.
2. Conecta tu repositorio de GitHub.
3. Configura los siguientes detalles:
   - **Name:** `innovatube-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist/frontend/browser`
4. **Configura la Redirección SPA (Esencial para Angular):**
   Angular maneja las rutas del lado del cliente. Si recargas una página interna (ej. `/favorites`), Render intentará buscar ese archivo y dará un error 404.
   - En el panel de Render, navega a la sección **Redirects/Rewrites**.
   - Agrega una nueva regla:
     - **Source:** `/*`
     - **Action:** `Rewrite`
     - **Destination:** `/index.html`
5. En la sección **Environment**, puedes configurar `CLIENT_URL` en el backend para apuntar a la URL de este Static Site para cumplir con las políticas de seguridad CORS.
