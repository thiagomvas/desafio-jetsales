import prisma from "../../prisma/client";
import { Request, Response } from "express";
import { AuthRequest } from '../middleware/auth'
import redis from "../utils/redis";
import { logger } from "../utils/logger";

const TASKS_CACHE_KEY = "tasks_cache";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const cache = await redis.get(TASKS_CACHE_KEY);
    if (cache) {
      const tasks = JSON.parse(cache);
      logger.info("TaskController", "Returned tasks from cache");
      return res.json(tasks);
    }

    const tasks = await prisma.task.findMany();
    await redis.set(TASKS_CACHE_KEY, JSON.stringify(tasks), "EX", 60);
    logger.info("TaskController", "Returned tasks from DB and cached");
    return res.json(tasks);

  } catch (error) {
    logger.error("TaskController", "Error fetching tasks", error as Error);
    res.status(500).json({ error: "An error occurred while fetching tasks." });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const { title, description, dueDate } = req.body;
  const userId = req.userId;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        userId,
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Created new task with id ${newTask.id} and invalidated cache`);

    res.status(201).json(newTask);
  } catch (error) {
    logger.error("TaskController", "Error creating task", error as Error);
    res.status(500).json({ error: "An error occurred while creating the task." });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { title, description },
    });

    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Updated task id ${id} and invalidated cache`);

    res.json(updatedTask);
  } catch (error) {
    logger.error("TaskController", `Error updating task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while updating the task." });
  }
};

export const patchTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
      },
    });

    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Patched task id ${id} and invalidated cache`);

    res.json(updatedTask);
  } catch (error) {
    logger.error("TaskController", `Error patching task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while patching the task." });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({ where: { id: Number(id) } });

    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Deleted task id ${id} and invalidated cache`);

    res.status(204).send();
  } catch (error) {
    logger.error("TaskController", `Error deleting task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while deleting the task." });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json(task);
  } catch (error) {
    logger.error("TaskController", `Error fetching task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while fetching the task." });
  }
};
