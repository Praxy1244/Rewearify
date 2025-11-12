import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Package, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DonationCard = ({ donation }) => {
  const navigate = useNavigate();

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">
            {donation.title}
          </CardTitle>
          <Badge className={getConditionColor(donation.condition)}>
            {donation.condition}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
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
