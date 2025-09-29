# NextAuth Authentication System

Una aplicación web completa con sistema de autenticación robusto utilizando Next.js, NextAuth.js v5, Prisma ORM y PostgreSQL.

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

### Base de Datos
- 🗄️ PostgreSQL con Docker
- 📊 Prisma ORM con migraciones automáticas
- 🔄 Sistema de tokens con expiración (1 hora)
- 📝 Modelos de datos optimizados para autenticación

### Arquitectura
- 🏗️ Next.js 15 con App Router
- ⚡ Server Actions para manejo de formularios
- 🎨 Componentes UI reutilizables con validación
- 📋 Middleware de protección de rutas
- 📦 Gestión de dependencias optimizada

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: NextAuth.js v5, Server Actions
- **Base de Datos**: PostgreSQL, Prisma ORM
- **Validación**: Zod schemas, React Hook Form
- **Autenticación**: JWT, bcrypt
- **Desarrollo**: Docker, TypeScript

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
│   └── api/auth/          # Endpoints de autenticación
├── action/                # Server actions para formularios
├── components/ui/         # Componentes UI reutilizables
├── lib/                   # Utilidades (DB, email, validación)
├── prisma/                # Schema y migraciones de base de datos
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

## 📝 Documentación Adicional

- [CLAUDE.md](./CLAUDE.md) - Guía completa de desarrollo
- [Prisma Schema](./prisma/schema.prisma) - Modelo de base de datos
- [Auth Config](./auth.config.ts) - Configuración de NextAuth

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
