/**
 * Create Donation Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('POST /api/donations', () => {
  let donorToken;
  let donorId;

  beforeEach(async () => {
    // Create donor user and get token
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const donor = await User.create({
      name: 'Donor User',
      email: 'donor@test.com',
      password: hashedPassword,
      role: 'donor'
    });
    donorId = donor._id;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'donor@test.com',
        password: 'Password123!'
      });
    
    donorToken = loginRes.body.token;
  });

  it('should create a new donation successfully', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        category: 'Clothes',
        type: 'Shirts',
        quantity: 10,
        condition: 'New',
        size: 'M',
        description: 'Brand new cotton shirts',
        pickupAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.donation).toHaveProperty('_id');
    expect(res.body.donation).toHaveProperty('donor', donorId.toString());
  });

  it('should reject donation without authentication', async () => {
    const res = await request(app)
      .post('/api/donations')
      .send({
        category: 'Clothes',
        quantity: 5
      });

    expect(res.statusCode).toEqual(401);
  });

  it('should reject donation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        category: 'Clothes'
        // Missing quantity and other required fields
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should reject donation with invalid quantity', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        category: 'Clothes',
        quantity: -5,
        condition: 'New'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should create donation with images', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        category: 'Clothes',
        quantity: 5,
        condition: 'Good',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.donation.images).toHaveLength(2);
  });
});
