// Socket.IO service for real-time notifications

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map of userId -> socketId
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, role } = data;
        
        if (!userId) {
          console.log('⚠️ Authentication failed: No userId provided');
          return;
        }

        // Store user socket mapping
        this.userSockets.set(userId, socket.id);
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join role-based room
        if (role) {
          socket.join(`role:${role}`);
        }

        console.log(`✅ User authenticated: ${userId} (${role}) - Socket: ${socket.id}`);
        
        // Send confirmation
        socket.emit('authenticated', { 
          success: true, 
          userId,
          message: 'Connected to real-time notifications' 
        });
      });

      // Handle joining custom rooms (e.g., donation-specific)
      socket.on('join-room', (roomName) => {
        socket.join(roomName);
        console.log(`📍 Socket ${socket.id} joined room: ${roomName}`);
      });

      // Handle leaving rooms
      socket.on('leave-room', (roomName) => {
        socket.leave(roomName);
        console.log(`📤 Socket ${socket.id} left room: ${roomName}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        // Remove from userSockets map
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`🗑️ Removed user ${userId} from active sockets`);
            break;
          }
        }
      });
    });

    console.log('✅ Socket.IO service initialized');
  }

  /**
   * Send notification to a specific user
   * @param {String} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendToUser(userId, notification) {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return false;
    }

    const room = `user:${userId}`;
    
    this.io.to(room).emit('notification', notification);
    
    console.log(`📨 Notification sent to user ${userId}:`, notification.type);
    return true;
  }

  /**
   * Send notification to all users with a specific role
   * @param {String} role - User role (admin, donor, recipient)
   * @param {Object} notification - Notification data
   */
  sendToRole(role, notification) {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return false;
    }

    const room = `role:${role}`;
    
    this.io.to(room).emit('notification', notification);
    
    console.log(`📨 Notification sent to role ${role}:`, notification.type);
    return true;
  }

  /**
   * Broadcast notification to all connected users
   * @param {Object} notification - Notification data
   */
  broadcast(notification) {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return false;
    }

    this.io.emit('notification', notification);
    
    console.log(`📢 Broadcast notification:`, notification.type);
    return true;
  }

  /**
   * Send notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  sendToUsers(userIds, notification) {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return false;
    }

    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });

    return true;
  }

  /**
   * Send notification to a custom room
   * @param {String} roomName - Room name
   * @param {Object} notification - Notification data
   */
  sendToRoom(roomName, notification) {
    if (!this.io) {
      console.error('❌ Socket.IO not initialized');
      return false;
    }

    this.io.to(roomName).emit('notification', notification);
    
    console.log(`📨 Notification sent to room ${roomName}:`, notification.type);
    return true;
  }

  /**
   * Get number of connected users
   */
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  /**
   * Check if a user is connected
   * @param {String} userId - User ID
   */
  isUserConnected(userId) {
    return this.userSockets.has(userId);
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds() {
    return Array.from(this.userSockets.keys());
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
