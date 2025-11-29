/**
 * Password Reset Tests
 * Tests for password reset functionality
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('Password Reset Flow', () => {
  let testUser;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('OldPassword123!', 10);
    testUser = await User.create({
      name: 'Reset User',
      email: 'reset@example.com',
      password: hashedPassword,
      role: 'donor'
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });

    it('should not reveal if email does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      // Should return 200 to prevent email enumeration
      expect(res.statusCode).toEqual(200);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email'
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // First, generate a reset token (you may need to adjust this based on your implementation)
      const resetToken = 'valid_reset_token_here'; // Mock or generate real token
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject expired token', async () => {
      const expiredToken = 'expired_token_here';
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          newPassword: 'NewPassword123!'
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should reject weak new password', async () => {
      const resetToken = 'valid_token_here';
      
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123'
        });

      expect(res.statusCode).toEqual(400);
    });
  });
});
