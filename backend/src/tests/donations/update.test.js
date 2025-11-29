/**
 * Update Donation Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Donation = require('../../models/Donation');
const bcrypt = require('bcryptjs');

describe('PUT /api/donations/:id', () => {
  let donorToken;
  let donorId;
  let donationId;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const donor = await User.create({
      name: 'Donor User',
      email: 'donor@test.com',
      password: hashedPassword,
      role: 'donor'
    });
    donorId = donor._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'Password123!'
      });
    
    donorToken = loginRes.body.token;

    const donation = await Donation.create({
      donor: donorId,
      category: 'Clothes',
      quantity: 10,
      condition: 'New',
      status: 'pending'
    });
    donationId = donation._id;
  });

  it('should update donation successfully', async () => {
    const res = await request(app)
      .put(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        quantity: 15,
        description: 'Updated description'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.donation).toHaveProperty('quantity', 15);
    expect(res.body.donation).toHaveProperty('description', 'Updated description');
  });

  it('should not allow updating to invalid status', async () => {
    const res = await request(app)
      .put(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        status: 'invalid_status'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should reject update from non-owner', async () => {
    // Create another user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await User.create({
      name: 'Other User',
      email: 'other@test.com',
      password: hashedPassword,
      role: 'donor'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@test.com',
        password: 'Password123!'
      });
    
    const otherToken = loginRes.body.token;

    const res = await request(app)
      .put(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        quantity: 20
      });

    expect(res.statusCode).toEqual(403);
  });
});
