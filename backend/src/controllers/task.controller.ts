import prisma from "../../prisma/client";
import { Request, Response } from "express";
import { AuthRequest } from '../middleware/auth'
import redis from "../utils/redis";
import { logger } from "../utils/logger";
import { notificationQueue } from "../queues/notificationQueue";
import { log } from "console";

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

export const getTasksForUser = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  try {
    const cache = await redis.get(`${TASKS_CACHE_KEY}_${userId}`);
    if (cache) {
      const tasks = JSON.parse(cache);
      logger.info("TaskController", `Returned tasks for user ${userId} from cache`);
      return res.json(tasks);
    }
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      orderBy: { dueDate: 'asc' },
    });
    await redis.set(`${TASKS_CACHE_KEY}_${userId}`, JSON.stringify(tasks), "EX", 60);
    logger.info("TaskController", `Returned tasks for user ${userId} from DB and cached`);
    return res.json(tasks);
  } catch (error) {
    logger.error("TaskController", `Error fetching tasks for user ${userId}`, error as Error);
    res.status(500).json({ error: "An error occurred while fetching tasks for the user." });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const { title, description, dueDate } = req.body;
  const userId = req.userId;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  if (typeof title !== 'string' || title.trim().length < 3 || title.length > 100) {
    return res.status(400).json({ error: "Title must be a string between 3 and 100 characters." });
  }

  if (typeof description !== 'string' || description.trim().length < 5 || description.length > 500) {
    return res.status(400).json({ error: "Description must be between 5 and 500 characters." });
  }

  if (dueDate) {
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return res.status(400).json({ error: "Invalid dueDate format." });
    }
    if (due.getTime() < Date.now()) {
      return res.status(400).json({ error: "dueDate must be a future date." });
    }
  }

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        userId,
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await redis.del(TASKS_CACHE_KEY);
    await redis.del(`${TASKS_CACHE_KEY}_${userId}`);

    if (newTask.dueDate) {
      const delay = newTask.dueDate.getTime() - Date.now() - REMIND_EARLIER_TIME;
      if (delay > 0) {
        await notificationQueue.add("task_reminder", {
          taskId: newTask.id,
          userId,
          dueDate: newTask.dueDate,
        }, { delay });
      }
    }

    return res.status(201).json(newTask);
  } catch (error) {
    logger.error("TaskController", "Error creating task", error as Error);
    return res.status(500).json({ error: "An error occurred while creating the task." });
  }
};


export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 100) {
      return res.status(400).json({ error: "Title must be a string between 3 and 100 characters." });
    }
  }
  
  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length < 5 || description.length > 500) {
      return res.status(400).json({ error: "Description must be between 5 and 500 characters." });
    }
  }
  
  if (dueDate !== undefined) {
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return res.status(400).json({ error: "Invalid dueDate format." });
    }
    if (due.getTime() < Date.now()) {
      return res.status(400).json({ error: "dueDate must be a future date." });
    }
  }
  

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { title, description, dueDate: dueDate ? new Date(dueDate) : undefined },
    });

    await redis.del(TASKS_CACHE_KEY);
    await redis.del(`${TASKS_CACHE_KEY}_${req.userId}`);
    logger.info("TaskController", `Updated task id ${id} and invalidated cache`);

    const existingJobs = await notificationQueue.getJobs(['delayed', 'waiting']);
    for (const job of existingJobs) {
      if (job.data.taskId === updatedTask.id) {
        await job.remove();
        logger.info("NotificationQueue", `Removed existing notification job for task id ${id}`);
      }
    }

    if (updatedTask.dueDate) {
      const delay = updatedTask.dueDate.getTime() - Date.now() - REMIND_EARLIER_TIME;
      if (delay > 0) {
        await notificationQueue.add('task_reminder', { taskId: updatedTask.id, userId: updatedTask.userId }, { delay });
        logger.info("NotificationQueue", `Added new notification job for task id ${id} with delay ${delay}ms`);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    logger.error("TaskController", `Error updating task id ${id}`, error as Error);
    res.status(500).json({ error: "An error occurred while updating the task." });
  }
};

export async function patchTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { title, description, dueDate, completed } = req.body;

  if (!req.userId) {
    logger.error("TaskController", "Missing userId in patchTask");
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 100) {
      return res.status(400).json({ error: "Title must be a string between 3 and 100 characters." });
    }
  }
  
  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length < 5 || description.length > 500) {
      return res.status(400).json({ error: "Description must be between 5 and 500 characters." });
    }
  }
  
  if (dueDate !== undefined) {
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) {
      return res.status(400).json({ error: "Invalid dueDate format." });
    }
    if (due.getTime() < Date.now()) {
      return res.status(400).json({ error: "dueDate must be a future date." });
    }
  }
  

  const updatedTask = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
      ...(completed !== undefined ? { completed } : {}),
    },
  });

  await redis.del(TASKS_CACHE_KEY);
  await redis.del(`${TASKS_CACHE_KEY}_${req.userId}`);

  const jobs = await notificationQueue.getDelayed();
  for (const job of jobs) {
    if (Number(job.data.taskId) === updatedTask.id) {
      await job.remove();
    }
  }

  if (updatedTask.dueDate) {
    const delay = updatedTask.dueDate.getTime() - Date.now() - REMIND_EARLIER_TIME;
    if (delay > 0) {
      await notificationQueue.add("task_reminder", {
        taskId: updatedTask.id,
        userId: updatedTask.userId,
      }, { delay });
    }
  }

  return res.json(updatedTask);
}


export const deleteTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({ where: { id: Number(id) } });

    await redis.del(TASKS_CACHE_KEY);
    await redis.del(`${TASKS_CACHE_KEY}_${req.userId}`);
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
