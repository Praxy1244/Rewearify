/**
 * Delete Donation Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Donation = require('../../models/Donation');
const bcrypt = require('bcryptjs');

describe('DELETE /api/donations/:id', () => {
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

  it('should delete donation successfully', async () => {
    const res = await request(app)
      .delete(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);

    // Verify deletion
    const deletedDonation = await Donation.findById(donationId);
    expect(deletedDonation).toBeNull();
  });

  it('should not delete non-existent donation', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    
    const res = await request(app)
      .delete(`/api/donations/${fakeId}`)
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.statusCode).toEqual(404);
  });

  it('should reject deletion from non-owner', async () => {
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
      .delete(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toEqual(403);
  });
});
