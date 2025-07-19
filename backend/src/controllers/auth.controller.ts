import { Request, Response } from 'express';
import { registerUser, authenticateUser } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { getUserById } from '../services/user.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await authenticateUser(email, password);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = await registerUser(name, email, password);
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const auth = await authenticateUser(email, password);
    if (!auth) return res.status(401).json({ message: 'Invalid credentials' });

    res.cookie('auth_token', auth.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ user: { id: auth.user.id, email: auth.user.email, name: auth.user.name } });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
