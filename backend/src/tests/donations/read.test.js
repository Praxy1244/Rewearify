/**
 * Read/Get Donations Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Donation = require('../../models/Donation');
const bcrypt = require('bcryptjs');

describe('GET /api/donations', () => {
  let donorToken;
  let donorId;

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

    // Create sample donations
    await Donation.create([
      {
        donor: donorId,
        category: 'Clothes',
        quantity: 10,
        condition: 'New',
        status: 'pending'
      },
      {
        donor: donorId,
        category: 'Shoes',
        quantity: 5,
        condition: 'Good',
        status: 'approved'
      }
    ]);
  });

  it('should get all donations for authenticated donor', async () => {
    const res = await request(app)
      .get('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.donations).toHaveLength(2);
  });

  it('should get donation by ID', async () => {
    const donations = await Donation.find({ donor: donorId });
    const donationId = donations[0]._id;

    const res = await request(app)
      .get(`/api/donations/${donationId}`)
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.donation).toHaveProperty('_id', donationId.toString());
  });

  it('should filter donations by status', async () => {
    const res = await request(app)
      .get('/api/donations?status=approved')
      .set('Authorization', `Bearer ${donorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.donations).toHaveLength(1);
    expect(res.body.donations[0]).toHaveProperty('status', 'approved');
  });

  it('should reject unauthorized access', async () => {
    const res = await request(app)
      .get('/api/donations');

    expect(res.statusCode).toEqual(401);
  });
});
