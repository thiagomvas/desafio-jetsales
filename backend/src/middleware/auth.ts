import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface AuthRequest extends Request {
  userId?: number
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies['auth_token']

  if (!token) return res.status(401).json({ message: 'Token missing' })

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' })
    req.userId = decoded.id
    next()
  })
}
