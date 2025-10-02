# NextAuth Authentication System

Una aplicación web completa con sistema de autenticación robusto utilizando Next.js, NextAuth.js v5, Prisma ORM y PostgreSQL. Desarrollada utilizando nuevas prácticas apoyado por agentes y modelos de IA, como Claude, GLM, Copilot y GPT.

## 🎯 Objetivo del Proyecto

Este proyecto demuestra una implementación completa de un sistema de autenticación moderno con las siguientes características:

- **Autenticación Segura**: JWT sessions con credentials provider (email/contraseña)
- **Verificación de Email**: Sistema de verificación por correo electrónico requerido para el acceso
- **Gestión de Usuarios**: Registro, login, logout y recuperación de contraseña
- **Control de Acceso Basado en Roles**: Sistema de roles (USER/ADMIN) con middleware de protección
- **Base de Datos Robusta**: Esquema de PostgreSQL con Prisma ORM
- **Validación Completa**: Validación de formularios con Zod y manejo de errores
- **Interfaz de Usuario Moderna**: Componentes de UI reutilizables con validación en tiempo real

## 🚀 Características Principales

### Sistema de Autenticación
- 🔐 NextAuth.js v5 con JWT sessions
- 📧 Verificación de email obligatoria antes del login
- 🔑 Sistema de recuperación de contraseña con tokens seguros
- 🛡️ Role-based access control (USER/ADMIN)
- 🔒 Contraseñas hasheadas con bcrypt
- 🔐 Autenticación de Dos Factores (TOTP) con códigos de respaldo
- ⚙️ Configuración global de parámetros TOTP para administradores

### Base de Datos
- 🗄️ PostgreSQL con Docker
- 📊 Prisma ORM con migraciones automáticas
- 🔄 Sistema de tokens con expiración (1 hora)
- 📝 Modelos de datos optimizados para autenticación
- ⚙️ Configuración global de sistema con patrón singleton
- 🔐 Almacenamiento seguro de secretos TOTP encriptados

### Arquitectura
- 🏗️ Next.js 15 con App Router
- ⚡ Server Actions para manejo de formularios
- 🎨 Componentes UI reutilizables con validación
- 📋 Middleware de protección de rutas
- 📦 Gestión de dependencias optimizada
- 🔧 Sistema de configuración dinámica para TOTP
- 🧪 Suite completa de pruebas unitarias e integración

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: NextAuth.js v5, Server Actions
- **Base de Datos**: PostgreSQL, Prisma ORM
- **Validación**: Zod schemas, React Hook Form
- **Autenticación**: JWT, bcrypt, otplib (TOTP)
- **Desarrollo**: Docker, TypeScript, Jest
- **UI Components**: shadcn/ui, Lucide React
- **Testing**: Jest, node-mocks-http

## 📦 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- Docker y Docker Compose
- npm o yarn

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd nextauth-yt
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Configurar las siguientes variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/nextauth"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Iniciar base de datos**
   ```bash
   docker-compose up -d
   ```

4. **Instalar dependencias y generar Prisma**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

Acceder a [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📂 Estructura del Proyecto

```
├── app/                    # Rutas de Next.js App Router
│   ├── (auth)/            # Páginas públicas (login, registro)
│   ├── (protected)/       # Rutas protegidas (requieren autenticación)
│   │   ├── admin/         # Panel de administración
│   │   │   ├── settings/  # Configuración del sistema
│   │   │   └── users/     # Gestión de usuarios
│   │   └── 2fa/           # Autenticación de dos factores
│   └── api/               # Endpoints API
│       ├── auth/          # API de autenticación
│       └── admin/         # API de administración
├── action/                # Server actions para formularios
├── components/ui/         # Componentes UI reutilizables
├── lib/                   # Utilidades (DB, email, validación, TOTP)
├── prisma/                # Schema y migraciones de base de datos
├── __tests__/             # Suite de pruebas
│   ├── unit/              # Pruebas unitarias
│   └── integration/       # Pruebas de integración
└── public/               # Archivos estáticos
```

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Build para producción
npm run start                  # Servidor de producción
npm run lint                   # Ejecutar ESLint

# Base de Datos
npx prisma generate           # Generar cliente Prisma
npx prisma db push           # Aplicar cambios al schema
npx prisma studio            # Abrir Prisma Studio
npx prisma migrate dev       # Crear migraciones

# Pruebas
npm test                     # Ejecutar suite de pruebas
npm run test:watch          # Modo watch para desarrollo
npm run test:coverage       # Generar reporte de cobertura

# Docker
docker-compose up -d         # Iniciar PostgreSQL
docker-compose down          # Detener contenedores
```

## 🔄 Flujo de Autenticación

### Registro de Usuario
1. Validación de formulario con Zod
2. Hash de contraseña con bcrypt
3. Creación de usuario en base de datos
4. Envío de email de verificación
5. Requerir verificación antes del login

### Login de Usuario
1. Validación de credenciales
2. Verificación de email confirmado
3. Creación de JWT session con role
4. Inyección de datos de usuario en el cliente

### Protección de Rutas
- Middleware para rutas públicas/privadas
- Rutas de admin requieren rol ADMIN
- Redirección automática para usuarios no autorizados

### Autenticación de Dos Factores (TOTP)

- Configuración TOTP con códigos QR
- Generación de códigos de respaldo
- Verificación de tokens con ventana de tiempo configurable
- Panel de administración para configuración global de parámetros TOTP:
  - Nombre del issuer (ej: "Mi App")
  - Número de dígitos (6 u 8)
  - Período de validez (30-1800 segundos)
- Almacenamiento seguro de secretos con encriptación

## 📝 Documentación Adicional

- [CLAUDE.md](./CLAUDE.md) - Guía completa de desarrollo
- [Prisma Schema](./prisma/schema.prisma) - Modelo de base de datos
- [Auth Config](./auth.config.ts) - Configuración de NextAuth
- [TOTP Library](./lib/totp.ts) - Implementación de TOTP
- [Zod Schemas](./lib/zod.ts) - Esquemas de validación

## 🧪 Testing

El proyecto incluye una suite completa de pruebas que cubren todos los aspectos del sistema:

### Pruebas Unitarias

- Validación de esquemas Zod
- Utilidades de TOTP (generación de secretos, verificación de tokens)
- Funciones de encriptación y manejo de datos

### Pruebas de Integración

- Endpoints API de autenticación
- Endpoints de administración
- Funcionalidad TOTP completa
- Manejo de errores y casos límite

### Ejecutar Pruebas

```bash
# Todas las pruebas
npm test

# Modo watch para desarrollo
npm run test:watch

# Cobertura de pruebas
npm run test:coverage
```

## 🔒 Características de Seguridad

- JWT sessions con expiración configurable
- Contraseñas hasheadas con bcrypt
- Tokens seguros con expiración (1 hora)
- Verificación de email obligatoria
- Role-based access control
- Autenticación de dos factores con TOTP
- Encriptación de secretos TOTP
- Validación completa de formularios
- Protección contra ataques comunes (CSRF, XSS)
- Middleware de protección de rutas

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Configurar base de datos PostgreSQL
4. Desplegar automáticamente

### Docker
```bash
# Build para producción
docker build -t nextauth-app .

# Ejecutar contenedor
docker run -p 3000:3000 nextauth-app
```

## 🤝 Contribuir

1. Hacer fork del repositorio
2. Crear rama feature (`git checkout -b feature/auth-improvement`)
3. Commit de cambios (`git commit -m 'Add auth improvement'`)
4. Push a la rama (`git push origin feature/auth-improvement`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es para fines educativos y de demostración.

---

**Desarrollado con Next.js 15 y NextAuth.js v5**
