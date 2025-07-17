import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export async function registerUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.create({
    data: { name, email, password: passwordHash },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) return null

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
  return { user, token }
}
