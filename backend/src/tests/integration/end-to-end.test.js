/**
 * End-to-End Integration Tests
 * Tests complete user workflows
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Donation = require('../../models/Donation');
const Request = require('../../models/Request');

describe('End-to-End User Workflows', () => {
  describe('Donor Complete Flow', () => {
    it('should complete full donor journey', async () => {
      // 1. Register as donor
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Donor',
          email: 'john@donor.com',
          password: 'Password123!',
          role: 'donor',
          phone: '1234567890'
        });

      expect(signupRes.statusCode).toEqual(201);
      const token = signupRes.body.token;

      // 2. Create a donation
      const donationRes = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Clothes',
          type: 'Shirts',
          quantity: 10,
          condition: 'New',
          pickupAddress: {
            street: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        });

      expect(donationRes.statusCode).toEqual(201);
      const donationId = donationRes.body.donation._id;

      // 3. Get donation details
      const getRes = await request(app)
        .get(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.donation).toHaveProperty('_id', donationId);

      // 4. Update donation
      const updateRes = await request(app)
        .put(`/api/donations/${donationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 15,
          description: 'Updated description'
        });

      expect(updateRes.statusCode).toEqual(200);
      expect(updateRes.body.donation).toHaveProperty('quantity', 15);

      // 5. Get user profile
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.statusCode).toEqual(200);
      expect(profileRes.body.user).toHaveProperty('email', 'john@donor.com');

      // 6. Get analytics
      const analyticsRes = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(analyticsRes.statusCode).toEqual(200);
      expect(analyticsRes.body).toHaveProperty('totalDonations');
    });
  });

  describe('Recipient/NGO Complete Flow', () => {
    it('should complete full NGO journey', async () => {
      // 1. Register as NGO
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Help NGO',
          email: 'help@ngo.org',
          password: 'Password123!',
          role: 'recipient',
          phone: '9876543210',
          organizationType: 'NGO'
        });

      expect(signupRes.statusCode).toEqual(201);
      const token = signupRes.body.token;

      // 2. Create a request
      const requestRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Clothes',
          type: 'Winter Jackets',
          quantity: 50,
          urgency: 'high',
          purpose: 'Winter relief',
          deliveryAddress: {
            street: '456 NGO Street',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
          }
        });

      expect(requestRes.statusCode).toEqual(201);
      const requestId = requestRes.body.request._id;

      // 3. Get all requests
      const getRequestsRes = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${token}`);

      expect(getRequestsRes.statusCode).toEqual(200);
      expect(getRequestsRes.body.requests.length).toBeGreaterThan(0);

      // 4. Update request
      const updateRes = await request(app)
        .put(`/api/requests/${requestId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 75,
          urgency: 'urgent'
        });

      expect(updateRes.statusCode).toEqual(200);

      // 5. Get profile
      const profileRes = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.statusCode).toEqual(200);
      expect(profileRes.body.user.role).toEqual('recipient');
    });
  });

  describe('Donation-Request Matching Flow', () => {
    it('should match donation with request', async () => {
      // Create donor and donation
      const donorSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Donor',
          email: 'donor@test.com',
          password: 'Password123!',
          role: 'donor'
        });
      const donorToken = donorSignup.body.token;

      const donation = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          category: 'Clothes',
          quantity: 20,
          condition: 'New'
        });
      const donationId = donation.body.donation._id;

      // Create NGO and request
      const ngoSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'NGO',
          email: 'ngo@test.com',
          password: 'Password123!',
          role: 'recipient'
        });
      const ngoToken = ngoSignup.body.token;

      const req = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${ngoToken}`)
        .send({
          category: 'Clothes',
          quantity: 15,
          urgency: 'medium'
        });

      // Test AI matching endpoint
      const matchRes = await request(app)
        .post('/api/ai/match')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          donationId: donationId
        });

      // Response depends on AI service availability
      expect([200, 503]).toContain(matchRes.statusCode);
    });
  });
});
