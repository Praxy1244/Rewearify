/**
 * Notification System Tests
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const bcrypt = require('bcryptjs');

describe('Notification System', () => {
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

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create sample notifications
      await Notification.create([
        {
          user: userId,
          type: 'donation_approved',
          message: 'Your donation has been approved',
          read: false
        },
        {
          user: userId,
          type: 'match_found',
          message: 'A match has been found for your donation',
          read: true
        }
      ]);
    });

    it('should get all notifications for user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.notifications).toHaveLength(2);
    });

    it('should filter unread notifications', async () => {
      const res = await request(app)
        .get('/api/notifications?read=false')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.notifications[0]).toHaveProperty('read', false);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create({
        user: userId,
        type: 'donation_approved',
        message: 'Test notification',
        read: false
      });
      notificationId = notification._id;
    });

    it('should mark notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.notification).toHaveProperty('read', true);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    beforeEach(async () => {
      await Notification.create([
        { user: userId, type: 'test', message: 'Test 1', read: false },
        { user: userId, type: 'test', message: 'Test 2', read: false },
        { user: userId, type: 'test', message: 'Test 3', read: false }
      ]);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);

      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        read: false 
      });
      expect(unreadCount).toEqual(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await Notification.create({
        user: userId,
        type: 'test',
        message: 'Test notification'
      });
      notificationId = notification._id;
    });

    it('should delete notification successfully', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);

      const deletedNotification = await Notification.findById(notificationId);
      expect(deletedNotification).toBeNull();
    });
  });
});
