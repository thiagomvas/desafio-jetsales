import { Router } from "express";
import { getTasks, updateTask, createTask, deleteTask, patchTask } from "../controllers/task.controller";

const taskRoutes = Router();

taskRoutes.get("/", getTasks);
taskRoutes.post("/", createTask);
taskRoutes.put("/:id", updateTask);
taskRoutes.delete("/:id", deleteTask);
taskRoutes.patch("/:id", patchTask);

export default taskRoutes;
