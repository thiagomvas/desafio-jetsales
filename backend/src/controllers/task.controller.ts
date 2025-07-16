import prisma from "../../prisma/client";
import { Request, Response } from "express";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching tasks." });
  }
};

export const createTask = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
      },
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while creating the task." });
  }
};

export const updateTask = async (req: Request, res: Response) => {
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
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating the task." });
  }
};

export const patchTask = async (req: Request, res: Response) => {
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
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while patching the task." });
    }
}

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
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
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching the task." });
    }
}
