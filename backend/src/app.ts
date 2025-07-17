import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);


app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World!' });
});

export default app;
