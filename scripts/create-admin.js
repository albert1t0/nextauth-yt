const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      console.log('Ya existe un usuario admin:', existingAdmin.email)
      return
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(), // Admin pre-verificado
        name: 'Administrador'
      }
    })

    console.log('Usuario admin creado exitosamente:')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    console.log('Rol:', admin.role)
    
  } catch (error) {
    console.error('Error creando admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()