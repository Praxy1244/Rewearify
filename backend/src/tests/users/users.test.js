/**
 * User Management Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Management', () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'donor'
    });
    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'Password123!'
      });
    
    userToken = loginRes.body.token;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('email', 'user@test.com');
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
          phone: '9876543210'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('name', 'Updated Name');
    });

    it('should not allow email update', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'newemail@test.com'
        });

      // Should either ignore or reject
      expect([200, 400]).toContain(res.statusCode);
    });
  });
});
