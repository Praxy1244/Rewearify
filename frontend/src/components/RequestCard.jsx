import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Package, Calendar, Eye, Building2, CheckCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequestCard = ({ request, showDonorActions = false, onRespond }) => {
  const navigate = useNavigate();

  // Get NGO's profile picture with fallback
  const ngoImage = request.requester?.profile?.profilePicture?.url || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(request.requester?.name || 'NGO')}&background=10B981&color=fff&size=200`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {/* NGO Info with Profile Picture */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-green-200">
            <AvatarImage src={ngoImage} alt={request.requester?.name || 'NGO'} />
            <AvatarFallback className="bg-green-100 text-green-700">
              {request.requester?.name?.charAt(0)?.toUpperCase() || 'N'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {request.requester?.organization?.name || request.requester?.name}
            </p>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              {request.requester?.verification?.isOrganizationVerified && (
                <CheckCircle className="h-3 w-3 text-green-600" />
              )}
              {request.requester?.location?.city || 'Unknown City'}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">
            {request.title}
          </CardTitle>
          <Badge className={getStatusColor(request.status)}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {request.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{request.quantity} items</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {request.location && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{request.location.city}, {request.location.state}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {request.category}
          </Badge>
          {request.urgency && (
            <Badge variant="destructive" className="text-xs">
              Urgent
            </Badge>
          )}
        </div>

        {showDonorActions ? (
          <div className="flex gap-2 mt-2">
            <Button 
              onClick={() => onRespond(request)} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Heart className="h-4 w-4 mr-2" />
              Respond
            </Button>
            <Button 
              onClick={() => navigate(`/requests/${request._id}`)} 
              variant="outline"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => navigate(`/requests/${request._id}`)} 
            className="w-full mt-2"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestCard;
