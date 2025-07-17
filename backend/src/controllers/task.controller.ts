import prisma from "../../prisma/client";
import { Request, Response } from "express";
import { AuthRequest } from '../middleware/auth'
import redis from "../utils/redis";
import { logger } from "../utils/logger";
import { notificationQueue } from "../queues/notificationQueue";

const TASKS_CACHE_KEY = "tasks_cache";
const REMIND_EARLIER_TIME = 5 * 60 * 1000; // 5 minutos em milisegundos

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

    if(newTask.dueDate) {
      await notificationQueue.add("task_reminder", {
        taskId: newTask.id,
        userId: userId,
        dueDate: newTask.dueDate,
      }, {
        delay: new Date(newTask.dueDate).getTime() - Date.now() - REMIND_EARLIER_TIME,
      })
    }

    res.status(201).json(newTask);
  } catch (error) {
    logger.error("TaskController", "Error creating task", error as Error);
    res.status(500).json({ error: "An error occurred while creating the task." });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { title, description, dueDate: dueDate ? new Date(dueDate) : undefined },
    });

    // Remove cache
    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Updated task id ${id} and invalidated cache`);

    // Remove job antigo da fila se existir
    const existingJobs = await notificationQueue.getJobs(['delayed', 'waiting']);
    for (const job of existingJobs) {
      if (job.data.taskId === updatedTask.id) {
        await job.remove();
        logger.info("NotificationQueue", `Removed existing notification job for task id ${id}`);
      }
    }

    // Adiciona novo job se dueDate válido
    if (updatedTask.dueDate) {
      const delay = updatedTask.dueDate.getTime() - Date.now() - REMIND_EARLIER_TIME;
      if (delay > 0) {
        await notificationQueue.add('taskReminder', { taskId: updatedTask.id, userId: updatedTask.userId }, { delay });
        logger.info("NotificationQueue", `Added new notification job for task id ${id} with delay ${delay}ms`);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    logger.error("TaskController", `Error updating task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while updating the task." });
  }
};

export const patchTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });

    await redis.del(TASKS_CACHE_KEY);
    logger.info("TaskController", `Patched task id ${id} and invalidated cache`);

    // Remove job antigo da fila se existir
    const existingJobs = await notificationQueue.getJobs(['delayed', 'waiting']);
    for (const job of existingJobs) {
      if (job.data.taskId === updatedTask.id) {
        await job.remove();
        logger.info("NotificationQueue", `Removed existing notification job for task id ${id}`);
      }
    }

    // Adiciona novo job se dueDate válido
    if (updatedTask.dueDate) {
      const delay = updatedTask.dueDate.getTime() - Date.now() - REMIND_EARLIER_TIME;
      if (delay > 0) {
        await notificationQueue.add('taskReminder', { taskId: updatedTask.id, userId: updatedTask.userId }, { delay });
        logger.info("NotificationQueue", `Added new notification job for task id ${id} with delay ${delay}ms`);
      }
    }

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

    // Remove job antigo da fila se existir
    const existingJobs = await notificationQueue.getJobs(['delayed', 'waiting']);
    for (const job of existingJobs) {
      if (job.data.taskId === Number(id)) {
        await job.remove();
        logger.info("NotificationQueue", `Removed notification job for deleted task id ${id}`);
      }
    }

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
