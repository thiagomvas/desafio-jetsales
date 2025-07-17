import { Router } from 'express'
import { registerUser, authenticateUser } from '../services/auth.service'

const authRoutes = Router()

authRoutes.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })

    const existing = await authenticateUser(email, password)
    if (existing) return res.status(400).json({ message: 'User already exists' })

    const user = await registerUser(name, email, password)
    res.status(201).json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' })

    const auth = await authenticateUser(email, password)
    if (!auth) return res.status(401).json({ message: 'Invalid credentials' })

    res.json({ token: auth.token, user: { id: auth.user.id, email: auth.user.email, name: auth.user.name } })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default authRoutes
