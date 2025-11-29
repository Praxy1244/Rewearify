/**
 * Analytics Endpoints Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Donation = require('../../models/Donation');
const bcrypt = require('bcryptjs');

describe('Analytics Endpoints', () => {
  let userToken;
  let userId;
  let adminToken;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Create regular user
    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: hashedPassword,
      role: 'donor'
    });
    userId = user._id;

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Login as user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'Password123!'
      });
    userToken = userLogin.body.token;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.token;

    // Create sample donations
    await Donation.create([
      {
        donor: userId,
        category: 'Clothes',
        quantity: 10,
        status: 'approved'
      },
      {
        donor: userId,
        category: 'Shoes',
        quantity: 5,
        status: 'completed'
      },
      {
        donor: userId,
        category: 'Clothes',
        quantity: 15,
        status: 'pending'
      }
    ]);
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should get user dashboard analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('totalDonations');
      expect(res.body).toHaveProperty('totalQuantity');
      expect(res.body).toHaveProperty('donationsByStatus');
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/analytics/donations-by-category', () => {
    it('should get donations grouped by category', async () => {
      const res = await request(app)
        .get('/api/analytics/donations-by-category')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/impact', () => {
    it('should get user impact statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/impact')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('itemsDonated');
      expect(res.body).toHaveProperty('peopleHelped');
      expect(res.body).toHaveProperty('co2Saved');
    });
  });

  describe('GET /api/analytics/admin/stats', () => {
    it('should get system-wide statistics for admin', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalDonations');
      expect(res.body).toHaveProperty('totalNGOs');
    });

    it('should reject non-admin access', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should get donation trends over time', async () => {
      const res = await request(app)
        .get('/api/analytics/trends?period=month')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('trends');
      expect(Array.isArray(res.body.trends)).toBe(true);
    });
  });
});
