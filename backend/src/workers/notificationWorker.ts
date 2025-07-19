import { Worker } from 'bullmq'
import prisma from '../../prisma/client'
import redis from '../utils/redis'
import { logger } from '../utils/logger'
import { notificationQueue } from '../queues/notificationQueue'

export const notificationWorker = new Worker('notifications', async job => {
  if (job.name === 'task_reminder') {
    const { taskId, userId } = job.data

    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { User: true } })
    if (!task || !task.User) return


    // Logica de notificação
    console.log(`Notify user ${task.User.email} about task ${task.title} due at ${task.dueDate}`)
    const payload = JSON.stringify({
      userId,
      taskId,
      title: task.title,
      dueDate: task.dueDate,
    })
    console.log(`Publishing to Redis channel notification:`, payload);

    await redis.publish(`notification`, payload)
  }
}, {
  connection: redis,
})

notificationWorker.on('completed', job => {
    logger.info('NotificationWorker', `Job ${job.id} completed successfully.`)
})

notificationWorker.on('failed', (job, err) => {
    logger.error('NotificationWorker', `Job ${job?.id} failed with error: ${err.message}`)
})

notificationWorker.on('ready', () => {
    logger.info('NotificationWorker', 'Worker started and connected to Redis.')
  })
  
  setInterval(async () => {
    try {
      const delayedJobs = await notificationQueue.getDelayed()
      if (delayedJobs.length === 0) {
        logger.info('NotificationWorker', 'No scheduled (delayed) jobs at the moment.')
        return
      }
      logger.info('NotificationWorker', `Scheduled jobs count: ${delayedJobs.length}`)
      delayedJobs.forEach(job => {
        const dueDate = job.data.dueDate ? new Date(job.data.dueDate).toISOString() : 'unknown'
        logger.info('NotificationWorker', `Job ${job.id}: taskId=${job.data.taskId}, dueDate=${dueDate}, delay=${job.delay}ms`)
      })
    } catch (error) {
      logger.error('NotificationWorker', 'Error fetching delayed jobs', error as Error)
    }
  }, 10 * 1000) // every 60 seconds