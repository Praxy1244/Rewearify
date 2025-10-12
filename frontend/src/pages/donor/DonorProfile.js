import React, { useState } from 'react';

const DonorProfile = ({ currentUser, setCurrentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    location: currentUser?.location || '',
    bio: currentUser?.bio || '',
    organization: currentUser?.organization || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/users/${currentUser.id}`, formData);
      setCurrentUser(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-3xl">
                  {currentUser?.name?.charAt(0) || 'D'}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {currentUser?.name}
              </h2>
              
              <p className="text-green-600 font-medium mb-2">Donor</p>
              
              <p className="text-gray-600 text-sm mb-4">
                {currentUser?.location}
              </p>
              
              {currentUser?.organization && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-700">Organization</p>
                  <p className="text-sm text-gray-600">{currentUser.organization}</p>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <p>Member since {formatDate(currentUser?.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: currentUser?.name || '',
                            email: currentUser?.email || '',
                            phone: currentUser?.phone || '',
                            location: currentUser?.location || '',
                            bio: currentUser?.bio || '',
                            organization: currentUser?.organization || ''
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          placeholder="City, State"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization (Optional)
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Company, Foundation, or Organization"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Tell us about yourself and your motivation for donating..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Full Name</p>
                        <p className="text-gray-900">{currentUser?.name || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Email Address</p>
                        <p className="text-gray-900">{currentUser?.email || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Phone Number</p>
                        <p className="text-gray-900">{currentUser?.phone || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                        <p className="text-gray-900">{currentUser?.location || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    {currentUser?.organization && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Organization</p>
                        <p className="text-gray-900">{currentUser.organization}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Bio</p>
                      <p className="text-gray-900">
                        {currentUser?.bio || 'No bio provided yet.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Activity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Total Donations</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Needs Fulfilled</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {formatDate(currentUser?.created_at)}
              </p>
              <p className="text-sm text-gray-600">Member Since</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;