import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(name: string, email: string, password: string) {
  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
    throw new Error('Name must be between 3 and 100 characters.');
  }
  if (typeof email !== 'string' || !emailRegex.test(email)) {
    throw new Error('Invalid email format.');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists with this email.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      password: passwordHash,
    },
  });
}


export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) return null

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' })
  return { user, token }
}
