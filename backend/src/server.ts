import app from './app';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { notificationWorker } from './workers/notificationWorker';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server', `Server is running on port ${PORT}`);
});
