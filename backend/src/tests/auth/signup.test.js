/**
 * Signup Tests
 * Tests for user registration functionality
 */

const request = require('supertest');
const app = require('../../server'); // Adjust to your server entry point
const User = require('../../models/User'); // Adjust path

describe('POST /api/auth/signup', () => {
  it('should register a new donor successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'John Donor',
        email: 'donor@example.com',
        password: 'Password123!',
        role: 'donor',
        phone: '1234567890'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'donor@example.com');
  });

  it('should register a new NGO successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Help NGO',
        email: 'ngo@example.com',
        password: 'Password123!',
        role: 'recipient',
        phone: '9876543210',
        organizationType: 'NGO'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'Password123!',
        role: 'donor'
      });

    // Try to create duplicate
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'Password123!',
        role: 'donor'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'Password123!',
        role: 'donor'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Weak Password',
        email: 'weak@example.com',
        password: '123',
        role: 'donor'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Incomplete User'
      });

    expect(res.statusCode).toEqual(400);
  });
});
