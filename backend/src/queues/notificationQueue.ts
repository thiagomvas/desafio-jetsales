// src/queues/notificationQueue.ts
import { Queue } from 'bullmq'
import redis from '../utils/redis'

export const notificationQueue = new Queue('notifications', {
  connection: redis,
})
