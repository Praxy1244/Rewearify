/**
 * Admin Routes Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('Admin Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Create regular user
    await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'donor'
    });

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.token;

    // Login as regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'Password123!'
      });
    userToken = userLogin.body.token;
  });

  describe('GET /api/admin/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should reject non-admin access', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get system statistics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalDonations');
    });
  });
});
