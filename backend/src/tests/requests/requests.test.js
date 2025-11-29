/**
 * Request Management Tests
 * Tests for NGO/Recipient request functionality
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Request = require('../../models/Request');
const bcrypt = require('bcryptjs');

describe('Request Management', () => {
  let recipientToken;
  let recipientId;
  let donorToken;

  beforeEach(async () => {
    // Create recipient (NGO) user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const recipient = await User.create({
      name: 'NGO Organization',
      email: 'ngo@test.com',
      password: hashedPassword,
      role: 'recipient',
      organizationType: 'NGO'
    });
    recipientId = recipient._id;

    // Create donor user
    await User.create({
      name: 'Donor User',
      email: 'donor@test.com',
      password: hashedPassword,
      role: 'donor'
    });

    // Login as recipient
    const recipientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ngo@test.com',
        password: 'Password123!'
      });
    recipientToken = recipientLogin.body.token;

    // Login as donor
    const donorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'Password123!'
      });
    donorToken = donorLogin.body.token;
  });

  describe('POST /api/requests', () => {
    it('should create a new request successfully', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          category: 'Clothes',
          type: 'Winter Jackets',
          quantity: 50,
          urgency: 'high',
          purpose: 'Winter relief for homeless',
          deliveryAddress: {
            street: '456 NGO Street',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
          }
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.request).toHaveProperty('_id');
      expect(res.body.request).toHaveProperty('recipient', recipientId.toString());
    });

    it('should reject request from donor role', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          category: 'Clothes',
          quantity: 10
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should reject request with missing required fields', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          category: 'Clothes'
          // Missing quantity
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/requests', () => {
    beforeEach(async () => {
      // Create sample requests
      await Request.create([
        {
          recipient: recipientId,
          category: 'Clothes',
          quantity: 50,
          urgency: 'high',
          status: 'pending'
        },
        {
          recipient: recipientId,
          category: 'Shoes',
          quantity: 30,
          urgency: 'medium',
          status: 'approved'
        }
      ]);
    });

    it('should get all requests for recipient', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.requests).toHaveLength(2);
    });

    it('should filter requests by status', async () => {
      const res = await request(app)
        .get('/api/requests?status=approved')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.requests).toHaveLength(1);
      expect(res.body.requests[0]).toHaveProperty('status', 'approved');
    });

    it('should filter requests by urgency', async () => {
      const res = await request(app)
        .get('/api/requests?urgency=high')
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.requests[0]).toHaveProperty('urgency', 'high');
    });
  });

  describe('PUT /api/requests/:id', () => {
    let requestId;

    beforeEach(async () => {
      const req = await Request.create({
        recipient: recipientId,
        category: 'Clothes',
        quantity: 50,
        urgency: 'medium',
        status: 'pending'
      });
      requestId = req._id;
    });

    it('should update request successfully', async () => {
      const res = await request(app)
        .put(`/api/requests/${requestId}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({
          quantity: 75,
          urgency: 'high'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.request).toHaveProperty('quantity', 75);
      expect(res.body.request).toHaveProperty('urgency', 'high');
    });

    it('should reject update from non-owner', async () => {
      const res = await request(app)
        .put(`/api/requests/${requestId}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          quantity: 100
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/requests/:id', () => {
    let requestId;

    beforeEach(async () => {
      const req = await Request.create({
        recipient: recipientId,
        category: 'Clothes',
        quantity: 50,
        status: 'pending'
      });
      requestId = req._id;
    });

    it('should delete request successfully', async () => {
      const res = await request(app)
        .delete(`/api/requests/${requestId}`)
        .set('Authorization', `Bearer ${recipientToken}`);

      expect(res.statusCode).toEqual(200);

      const deletedRequest = await Request.findById(requestId);
      expect(deletedRequest).toBeNull();
    });
  });
});
