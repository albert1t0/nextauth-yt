const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Verificar si ya existe un usuario de prueba
    const existingUser = await prisma.user.findFirst({
      where: { email: 'user@example.com' }
    })

    if (existingUser) {
      console.log('Ya existe un usuario de prueba:', existingUser.email)
      return
    }

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('user1234', 10)

    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(), // Usuario pre-verificado para testing
        name: 'Usuario de Prueba'
      }
    })

    console.log('Usuario de prueba creado exitosamente:')
    console.log('Email:', user.email)
    console.log('Password: user1234')
    console.log('Rol:', user.role)

  } catch (error) {
    console.error('Error creando usuario de prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()