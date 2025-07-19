import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());

app.use(express.json());
app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);


app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World!' });
});

export default app;
