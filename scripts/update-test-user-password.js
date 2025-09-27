const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateTestUserPassword() {
  try {
    // Buscar el usuario de prueba
    const testUser = await prisma.user.findFirst({
      where: { email: 'user@example.com' }
    })

    if (!testUser) {
      console.log('No se encontró el usuario de prueba')
      return
    }

    // Actualizar contraseña a user1234 (8 caracteres)
    const hashedPassword = await bcrypt.hash('user1234', 10)

    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        password: hashedPassword
      }
    })

    console.log('Contraseña de usuario de prueba actualizada exitosamente:')
    console.log('Email:', updatedUser.email)
    console.log('Nueva contraseña: user1234')
    console.log('Rol:', updatedUser.role)

  } catch (error) {
    console.error('Error actualizando contraseña:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTestUserPassword()