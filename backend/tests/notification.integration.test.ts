import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../prisma/client';
import { notificationQueue } from '../src/queues/notificationQueue';

jest.mock('../src/queues/notificationQueue', () => ({
  notificationQueue: {
    add: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
  },
}));

describe('POST /tasks with notification scheduling', () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'notify@test.com',
        name: 'Notify Tester',
        password: 'dummy',
      },
    });

    userId = user.id;
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('should schedule a notification job for dueDate tasks', async () => {
    const dueDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    const res = await request(app)
      .post('/tasks')
      .set('Cookie', [`auth_token=${token}`])
      .send({
        title: 'Task with notification',
        description: 'Test task with due date',
        dueDate,
      });

    expect(res.status).toBe(201);
    expect(notificationQueue.add).toHaveBeenCalled();

    const [jobName, jobData, jobOpts] = (notificationQueue.add as jest.Mock).mock.calls[0];

    expect(jobName).toBe('task_reminder');
    expect(jobData).toMatchObject({
      userId,
      taskId: expect.any(Number),
      dueDate: expect.any(Date),
    });

    // delay should be roughly dueDate - now - 5 minutes (REMIND_EARLIER_TIME)
    const delay = jobOpts.delay;
    const expectedDelay = new Date(dueDate).getTime() - Date.now() - 5 * 60 * 1000;
    expect(Math.abs(delay - expectedDelay)).toBeLessThan(1000); // allow 1s margin
  });
});
