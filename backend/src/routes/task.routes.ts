import { Router } from "express";
import {
  getTasks,
  updateTask,
  createTask,
  deleteTask,
  patchTask
} from "../controllers/task.controller";
import { authenticateToken } from "../middleware/auth";

const taskRoutes = Router();

taskRoutes.get("/", getTasks);
taskRoutes.post("/", authenticateToken, createTask);
taskRoutes.put("/:id", authenticateToken, updateTask);
taskRoutes.delete("/:id", authenticateToken, deleteTask);
taskRoutes.patch("/:id", authenticateToken, patchTask);

export default taskRoutes;
