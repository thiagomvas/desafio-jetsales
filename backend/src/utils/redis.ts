import Redis from 'ioredis'
import { logger } from './logger'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // Disable automatic retries
})

redis.on('connect', () => {
    logger.info('Redis', 'Connected to Redis server')
  })
  

export default redis
