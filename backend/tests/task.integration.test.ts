import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma from '../prisma/client';

// Mock the notification queue to prevent side effects
jest.mock('../src/queues/notificationQueue', () => ({
  notificationQueue: {
    add: jest.fn(),
    getJobs: jest.fn().mockResolvedValue([]),
  },
}));

describe('POST /tasks', () => {
  let token: string;
  let userId: number;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Tester',
        password: 'dummy', // only needed if validated on login
      },
    });

    userId = user.id;

    // Generate a JWT matching your middleware expectation (id, not userId)
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('creates a task when authenticated', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Cookie', [`auth_token=${token}`]) // send token in cookie
      .send({
        title: 'My Test Task',
        description: 'Created during integration test',
        dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1h
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('My Test Task');
  });
});
