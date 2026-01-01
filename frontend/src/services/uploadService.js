import api from '../lib/api';

class UploadService {
  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      throw error;
    }
  }

  // Delete profile picture
  async deleteProfilePicture() {
    try {
      const response = await api.delete('/upload/profile-picture');
      return response.data;
    } catch (error) {
      console.error('Profile picture delete failed:', error);
      throw error;
    }
  }

  // Validate image before upload
  validateImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    return true;
  }
}

export default new UploadService();
