/**
 * Login Tests
 * Tests for user authentication functionality
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create test user before each test
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'donor',
      isEmailVerified: true
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toEqual(401);
  });

  it('should reject empty credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toEqual(400);
  });

  it('should return user role in response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.body.user).toHaveProperty('role', 'donor');
  });
});
