import React, { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import uploadService from '../services/uploadService';
import { toast } from 'sonner';

const ProfilePictureUpload = ({ currentImage, onUploadSuccess }) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate image
      uploadService.validateImage(file);

      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);

      // Upload to server
      setUploading(true);
      const response = await uploadService.uploadProfilePicture(file);
      
      toast.success('Profile picture updated successfully!');
      setPreview(response.data.url);
      onUploadSuccess?.(response.data.url);
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage); // Revert to original on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await uploadService.deleteProfilePicture();
      
      setPreview(null);
      toast.success('Profile picture removed');
      onUploadSuccess?.('');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
          {preview ? (
            <img 
              src={preview} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <label 
          htmlFor="profile-picture-upload" 
          className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </label>

        <input
          id="profile-picture-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Remove Button (only show if image exists) */}
        {preview && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Click <Upload className="inline w-4 h-4" /> to upload photo
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Max 5MB • JPG, PNG, WebP
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
