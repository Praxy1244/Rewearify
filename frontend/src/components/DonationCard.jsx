import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Package, Calendar, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DonationCard = ({ donation }) => {
  const navigate = useNavigate();

  // Get donor's profile picture with fallback
  const donorImage = donation.donor?.profile?.profilePicture?.url || 
                     `https://ui-avatars.com/api/?name=${encodeURIComponent(donation.donor?.name || 'Donor')}&background=4F46E5&color=fff&size=200`;

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskBadge = () => {
    const riskScore = donation.riskScore || 0;
    const riskLevel = donation.riskLevel || 'low';
    
    if (riskScore > 0.7 || ['high', 'critical'].includes(riskLevel)) {
      return (
        <Badge className="bg-red-600 text-white flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          High Risk
        </Badge>
      );
    }
    
    if (riskScore > 0.3 || riskLevel === 'medium') {
      return (
        <Badge className="bg-yellow-500 text-white flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Medium Risk
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {/* Donor Info with Profile Picture */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-gray-200">
            <AvatarImage src={donorImage} alt={donation.donor?.name || 'Donor'} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {donation.donor?.name?.charAt(0)?.toUpperCase() || 'D'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{donation.donor?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {donation.donor?.location?.city || 'Unknown City'}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">
            {donation.title}
          </CardTitle>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={getConditionColor(donation.condition)}>
              {donation.condition}
            </Badge>
            {getRiskBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Fraud warning for high risk */}
        {(donation.riskScore > 0.7 || ['high', 'critical'].includes(donation.riskLevel)) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>
                <strong>AI Fraud Alert:</strong> Risk Score {(donation.riskScore * 100).toFixed(0)}%
              </span>
            </p>
          </div>
        )}

        {donation.images && donation.images.length > 0 && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={donation.images[0]}
              alt={donation.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p className="text-sm text-gray-600 line-clamp-2">
          {donation.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{donation.quantity} items</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {donation.location && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{donation.location.city}, {donation.location.state}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {donation.category}
          </Badge>
          {donation.subcategory && (
            <Badge variant="outline" className="text-xs">
              {donation.subcategory}
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => navigate(`/donations/${donation._id}`)} 
          className="w-full mt-2"
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default DonationCard;
