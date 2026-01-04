import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import './DonationOffers.css';

const DonationOffers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, urgent
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  // Fetch donation offers
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching offers for NGO:', user.id, user.name);

      const response = await api.get('/donations', {
        params: {
          status: 'approved',
          recipientId: user.id,
          page: 1,
          limit: 100
        }
      });

      console.log('📦 API Response:', response);

      if (response.success) {
        // Filter donations that include this NGO as preferred recipient
        const myOffers = response.data.filter(donation => {
          console.log('Checking donation:', donation._id, donation.preferences?.preferredRecipients);
          
          const isForThisNGO = donation.preferences?.preferredRecipients?.some(
            recipient => {
              const recipientId = typeof recipient === 'object' ? recipient._id : recipient;
              return recipientId === user.id;
            }
          );
          
          return isForThisNGO;
        });

        console.log('✅ Found', myOffers.length, 'offers for this NGO');
        setOffers(myOffers);
      } else {
        console.error('❌ Response not successful:', response);
        setOffers([]);
      }
    } catch (err) {
      console.error('❌ Error fetching offers:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load donation offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleAcceptOffer = async (donationId) => {
  try {
    setAcceptingId(donationId);
    
    console.log('✅ Accepting donation offer:', donationId);
    
    const response = await api.put(`/donations/${donationId}/ngo-accept`);
    
    if (response.success) {
      alert('✅ Donation offer accepted successfully!\n\nThe donor has been notified and will schedule a pickup time.');
      
      // Remove accepted offer from list
      setOffers(offers.filter(offer => offer._id !== donationId));
      setSelectedOffer(null);
      
      // Navigate to my requests page where it will show
      setTimeout(() => {
        navigate('/recipient/my-requests'); // ✅ Changed from /recipient/accepted-donations
      }, 1500);
    }
  } catch (err) {
    console.error('Error accepting offer:', err);
    alert(err.response?.data?.message || 'Failed to accept offer. Please try again.');
  } finally {
    setAcceptingId(null);
  }
};

  const handleViewDetails = (offer) => {
    setSelectedOffer(offer);
  };

  const closeModal = () => {
    setSelectedOffer(null);
  };

  const getFilteredOffers = () => {
    if (filter === 'new') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return offers.filter(offer => new Date(offer.approvedAt) > sevenDaysAgo);
    }
    if (filter === 'urgent') {
      return offers.filter(offer => offer.preferences?.urgentNeeded);
    }
    return offers;
  };

  const filteredOffers = getFilteredOffers();

  if (loading) {
    return (
      <div className="offers-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading donation offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="offers-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOffers} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-container">
      {/* Header */}
      <div className="offers-header">
        <h1>🎁 Donation Offers</h1>
        <p className="subtitle">
          Donors have offered these donations specifically to your organization
        </p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Offers ({offers.length})
        </button>
        <button
          className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
          onClick={() => setFilter('new')}
        >
          New (Last 7 Days)
        </button>
        <button
          className={`filter-btn ${filter === 'urgent' ? 'active' : ''}`}
          onClick={() => setFilter('urgent')}
        >
          Urgent
        </button>
        <button
          className="refresh-btn"
          onClick={fetchOffers}
          title="Refresh offers"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="no-offers">
          <div className="no-offers-icon">📭</div>
          <h3>No donation offers yet</h3>
          <p>
            {filter === 'all'
              ? 'You have no pending donation offers at the moment.'
              : `No ${filter} offers found.`}
          </p>
        </div>
      ) : (
        <div className="offers-grid">
          {filteredOffers.map((offer) => (
            <div key={offer._id} className="offer-card">
              {/* Offer Image */}
              <div className="offer-image">
                {offer.images && offer.images.length > 0 ? (
                  <img src={offer.images[0]} alt={offer.title} />
                ) : (
                  <div className="no-image">📦</div>
                )}
                {offer.preferences?.urgentNeeded && (
                  <span className="urgent-badge">🚨 Urgent</span>
                )}
              </div>

              {/* Offer Content */}
              <div className="offer-content">
                <h3 className="offer-title">{offer.title}</h3>
                
                <div className="offer-meta">
                  <span className="category">{offer.category}</span>
                  <span className="condition">{offer.condition}</span>
                  <span className="quantity">Qty: {offer.quantity}</span>
                </div>

                <p className="offer-description">
                  {offer.description.length > 100
                    ? `${offer.description.substring(0, 100)}...`
                    : offer.description}
                </p>

                {/* Donor Info */}
                <div className="donor-info">
                  <div className="donor-avatar">
                    {offer.donor?.profile?.profilePicture ? (
                      <img src={offer.donor.profile.profilePicture} alt={offer.donor.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {offer.donor?.name?.charAt(0) || 'D'}
                      </div>
                    )}
                  </div>
                  <div className="donor-details">
                    <p className="donor-name">{offer.donor?.name || 'Anonymous Donor'}</p>
                    <p className="donor-location">
                      📍 {offer.location?.city || 'Location not specified'}
                    </p>
                  </div>
                </div>

                {/* Approval Info */}
                <div className="approval-info">
                  <span className="approval-badge">
                    ✅ Approved {new Date(offer.approvedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="offer-actions">
                  <button
                    className="btn-view"
                    onClick={() => handleViewDetails(offer)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-accept"
                    onClick={() => handleAcceptOffer(offer._id)}
                    disabled={acceptingId === offer._id}
                  >
                    {acceptingId === offer._id ? (
                      <>
                        <span className="btn-spinner"></span>
                        Accepting...
                      </>
                    ) : (
                      '✓ Accept Offer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOffer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <h2>{selectedOffer.title}</h2>

            {/* Image Gallery */}
            {selectedOffer.images && selectedOffer.images.length > 0 && (
              <div className="modal-images">
                {selectedOffer.images.map((img, index) => (
                  <img key={index} src={img} alt={`${selectedOffer.title} ${index + 1}`} />
                ))}
              </div>
            )}

            {/* Details Grid */}
            <div className="modal-details">
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedOffer.category}</span>
              </div>
              <div className="detail-row">
                <strong>Condition:</strong>
                <span>{selectedOffer.condition}</span>
              </div>
              <div className="detail-row">
                <strong>Quantity:</strong>
                <span>{selectedOffer.quantity}</span>
              </div>
              <div className="detail-row">
                <strong>Season:</strong>
                <span>{selectedOffer.season || 'All Season'}</span>
              </div>
              {selectedOffer.size && (
                <div className="detail-row">
                  <strong>Size:</strong>
                  <span>{selectedOffer.size}</span>
                </div>
              )}
            </div>

            <div className="modal-section">
              <h3>Description</h3>
              <p>{selectedOffer.description}</p>
            </div>

            {/* Donor Information */}
            <div className="modal-section">
              <h3>Donor Information</h3>
              <div className="donor-full-info">
                <p><strong>Name:</strong> {selectedOffer.donor?.name}</p>
                <p><strong>Email:</strong> {selectedOffer.donor?.email}</p>
                {selectedOffer.donor?.phone && (
                  <p><strong>Phone:</strong> {selectedOffer.donor.phone}</p>
                )}
                <p><strong>Location:</strong> {selectedOffer.location?.address || selectedOffer.location?.city}</p>
              </div>
            </div>

            {/* AI Analysis (if available) */}
            {selectedOffer.aiAnalysis && (
              <div className="modal-section">
                <h3>AI Analysis</h3>
                <div className="ai-info">
                  {selectedOffer.aiAnalysis.qualityScore && (
                    <p>Quality Score: {(selectedOffer.aiAnalysis.qualityScore * 100).toFixed(0)}%</p>
                  )}
                  {selectedOffer.aiAnalysis.demandPrediction && (
                    <p>Demand: {selectedOffer.aiAnalysis.demandPrediction}</p>
                  )}
                </div>
              </div>
            )}

            {/* Accept Button */}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button
                className="btn-accept-large"
                onClick={() => {
                  handleAcceptOffer(selectedOffer._id);
                  closeModal();
                }}
                disabled={acceptingId === selectedOffer._id}
              >
                {acceptingId === selectedOffer._id ? 'Accepting...' : '✓ Accept This Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationOffers;
