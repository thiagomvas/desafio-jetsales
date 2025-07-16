import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import taskRoutes from './routes/task.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/tasks', taskRoutes);


app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World!' });
});

export default app;
