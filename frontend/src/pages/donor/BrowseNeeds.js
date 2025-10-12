import React, { useState, useEffect } from 'react';

const BrowseNeeds = ({ currentUser, refreshData }) => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchNeeds();
  }, [filter, categoryFilter, priorityFilter]);

  const fetchNeeds = async () => {
    try {
      let url = '/needs';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      let filteredNeeds = response.data;
      
      if (priorityFilter !== 'all') {
        filteredNeeds = filteredNeeds.filter(need => need.priority === priorityFilter);
      }
      
      setNeeds(filteredNeeds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching needs:', error);
      setLoading(false);
    }
  };

  const fulfillNeed = async (needId) => {
    if (window.confirm('Are you sure you want to fulfill this need? This action cannot be undone.')) {
      try {
        await api.post(`/needs/${needId}/fulfill?donor_id=${currentUser.id}`);
        fetchNeeds();
        refreshData();
        alert('Need fulfilled successfully! The recipient will be notified.');
      } catch (error) {
        console.error('Error fulfilling need:', error);
        alert('Error fulfilling need. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍎',
      clothing: '👕',
      shelter: '🏠',
      education: '📚',
      medical: '🏥',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food & Groceries' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'shelter', label: 'Shelter' },
    { value: 'education', label: 'Education' },
    { value: 'medical', label: 'Medical' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Community Needs</h1>
        <p className="text-gray-600">Discover how you can make a difference in your community</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="active">Active Needs</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="all">All Needs</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {needs.length} {needs.length === 1 ? 'need' : 'needs'}
          {categoryFilter !== 'all' && ` in ${categoryFilter}`}
          {priorityFilter !== 'all' && ` with ${priorityFilter} priority`}
        </p>
      </div>

      {/* Needs List */}
      {needs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {needs.map((need) => (
            <div key={need.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{getCategoryIcon(need.category)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{need.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{need.category}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border capitalize ${getPriorityColor(need.priority)}`}>
                    {need.priority}
                  </span>
                  {need.status === 'fulfilled' && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      Fulfilled
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">{need.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">📍</span>
                  <span>{need.location}</span>
                </div>
                
                {need.quantity_needed && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">📦</span>
                    <span>{need.quantity_needed}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">📅</span>
                  <span>Posted {formatDate(need.created_at)}</span>
                </div>
                
                {need.deadline && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">⏰</span>
                    <span>Needed by {formatDate(need.deadline)}</span>
                  </div>
                )}
                
                {need.fulfilled_at && (
                  <div className="flex items-center text-sm text-green-600">
                    <span className="mr-2">✅</span>
                    <span>Fulfilled {formatDate(need.fulfilled_at)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Need ID: {need.id.substring(0, 8)}...
                </div>
                
                {need.status === 'active' ? (
                  <button
                    onClick={() => fulfillNeed(need.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Fulfill Need
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    {need.status === 'fulfilled' ? 'Already fulfilled' : 'Not available'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No needs found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'active' 
              ? "There are no active needs matching your filters at the moment."
              : "No needs match your current filter criteria."
            }
          </p>
          <button
            onClick={() => {
              setFilter('active');
              setCategoryFilter('all');
              setPriorityFilter('all');
            }}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Call to Action */}
      {needs.filter(need => need.status === 'active').length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">Make a Difference Today</h3>
          <p className="text-green-100 mb-4">
            {needs.filter(need => need.status === 'active').length} people in your community need your help.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            Browse More Needs
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseNeeds;