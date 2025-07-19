import prisma from '../../prisma/client';
import redis from '../utils/redis';
import { logger } from '../utils/logger';

const USERS_CACHE_KEY = 'users_cache';

export async function getAllUsers() {
  try {
    const cache = await redis.get(USERS_CACHE_KEY);
    if (cache) {
      logger.info('UserService', 'Returned users from cache');
      return JSON.parse(cache);
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });

    await redis.set(USERS_CACHE_KEY, JSON.stringify(users), 'EX', 60);
    logger.info('UserService', 'Returned users from DB and cached');

    return users;
  } catch (error) {
    logger.error('UserService', 'Error fetching users', error as Error);
    throw error;
  }
}

export async function getUserById(id: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    return user;
  } catch (error) {
    logger.error('UserService', `Error fetching user id ${id}`, error as Error);
    throw error;
  }
}

export async function updateUser(id: number, data: { name: string; email: string }) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true },
    });
    await redis.del(USERS_CACHE_KEY);
    logger.info('UserService', `Updated user id ${id} and invalidated cache`);
    return updatedUser;
  } catch (error) {
    logger.error('UserService', `Error updating user id ${id}`, error as Error);
    throw error;
  }
}

export async function patchUser(id: number, data: Partial<{ name: string; email: string }>) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true },
    });
    await redis.del(USERS_CACHE_KEY);
    logger.info('UserService', `Patched user id ${id} and invalidated cache`);
    return updatedUser;
  } catch (error) {
    logger.error('UserService', `Error patching user id ${id}`, error as Error);
    throw error;
  }
}

export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } });
    await redis.del(USERS_CACHE_KEY);
    logger.info('UserService', `Deleted user id ${id} and invalidated cache`);
  } catch (error) {
    logger.error('UserService', `Error deleting user id ${id}`, error as Error);
    throw error;
  }
}
