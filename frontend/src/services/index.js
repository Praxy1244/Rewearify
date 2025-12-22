// Service layer exports
export { default as authService } from './authService';
export { default as donationService } from './donationService';
export { default as requestService } from './requestService';
export { default as userService } from './userService';
export { default as aiService } from './aiService';
export { default as adminService } from './adminService';
export { default as notificationService } from './notificationService';
export { default as matchingService } from './matchingService';


// Re-export for convenience
import authService from './authService';
import donationService from './donationService';
import requestService from './requestService';
import userService from './userService';
import aiService from './aiService';
import adminService from './adminService';
import notificationService from './notificationService';

export default {
  auth: authService,
  donations: donationService,
  requests: requestService,
  users: userService,
  ai: aiService,
  admin: adminService,
  notifications: notificationService
};