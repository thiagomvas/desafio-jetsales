import prisma from '../../prisma/client';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import redis from '../utils/redis';
import { logger } from '../utils/logger';

const USERS_CACHE_KEY = 'users_cache';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getUsers = async (req: Request, res: Response) => {
  try {
    const cache = await redis.get(USERS_CACHE_KEY);
    if (cache) {
      const users = JSON.parse(cache);
      logger.info('UserController', 'Returned users from cache');
      return res.json(users);
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });

    await redis.set(USERS_CACHE_KEY, JSON.stringify(users), 'EX', 60);
    logger.info('UserController', 'Returned users from DB and cached');
    res.json(users);
  } catch (error) {
    logger.error('UserController', 'Error fetching users', error as Error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    logger.error('UserController', `Error fetching user id ${id}`, error as Error);
    res.status(500).json({ error: 'An error occurred while fetching the user.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (typeof name !== 'string' || name.trim().length < 3 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 3 and 100 characters.' });
  }

  if (typeof email !== 'string' || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
      select: { id: true, name: true, email: true },
    });

    await redis.del(USERS_CACHE_KEY);
    logger.info('UserController', `Updated user id ${id} and invalidated cache`);

    res.json(updatedUser);
  } catch (error) {
    logger.error('UserController', `Error updating user id ${id}`, error as Error);
    res.status(500).json({ error: 'An error occurred while updating the user.' });
  }
};

export const patchUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 3 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be between 3 and 100 characters.' });
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email.trim() } : {}),
      },
      select: { id: true, name: true, email: true },
    });

    await redis.del(USERS_CACHE_KEY);
    logger.info('UserController', `Patched user id ${id} and invalidated cache`);

    res.json(updatedUser);
  } catch (error) {
    logger.error('UserController', `Error patching user id ${id}`, error as Error);
    res.status(500).json({ error: 'An error occurred while patching the user.' });
  }
};


export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    await redis.del(USERS_CACHE_KEY);
    logger.info('UserController', `Deleted user id ${id} and invalidated cache`);

    res.status(204).send();
  } catch (error) {
    logger.error('UserController', `Error deleting user id ${id}`, error as Error);
    res.status(500).json({ error: 'An error occurred while deleting the user.' });
  }
};
