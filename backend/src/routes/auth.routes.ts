import { Router } from 'express'
import { registerUser, authenticateUser } from '../services/auth.service'
import { authenticateToken } from '../middleware/auth'
import { getUserById } from '../services/user.service'
import { getMe, login, register } from '../controllers/auth.controller'

const authRoutes = Router()

authRoutes.post('/register', register)
authRoutes.post('/login', login)
authRoutes.get('/me', authenticateToken, getMe)

export default authRoutes

