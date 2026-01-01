import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Building2, Package, TrendingUp, Heart, CheckCircle } from 'lucide-react';

const NGOCard = ({ ngo, matchScore, onSelect }) => {
  // Get NGO's profile picture with fallback
  const ngoImage = ngo?.profile?.profilePicture?.url || 
                   `https://ui-avatars.com/api/?name=${encodeURIComponent(ngo?.name || 'NGO')}&background=10B981&color=fff&size=200`;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {/* NGO Profile Picture and Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12 border-2 border-green-200">
            <AvatarImage src={ngoImage} alt={ngo?.name || 'NGO'} />
            <AvatarFallback className="bg-green-100 text-green-700">
              {ngo?.name?.charAt(0)?.toUpperCase() || 'N'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <CardTitle className="text-base truncate">{ngo.name}</CardTitle>
            </div>
            {ngo?.verification?.isOrganizationVerified && (
              <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {matchScore && (
            <Badge variant={matchScore >= 0.7 ? "default" : "secondary"} className="flex-shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round(matchScore * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{ngo.location?.city || ngo.city}, {ngo.location?.state || ngo.state || 'India'}</span>
        </div>

        {(ngo.categories || ngo.recipientProfile?.specialFocus) && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Accepts:</p>
            <div className="flex flex-wrap gap-1">
              {(ngo.categories || ngo.recipientProfile?.specialFocus || []).slice(0, 3).map((cat, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {(ngo.categories || ngo.recipientProfile?.specialFocus || []).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{(ngo.categories || ngo.recipientProfile?.specialFocus).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {(ngo.urgentNeed || ngo.recipientProfile?.urgentNeed) && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <Heart className="h-4 w-4" />
            <span className="font-medium">Has urgent needs</span>
          </div>
        )}

        {(ngo.capacity || ngo.recipientProfile?.capacityPerWeek) && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Capacity: {ngo.capacity || ngo.recipientProfile?.capacityPerWeek} items/week</span>
          </div>
        )}

        {ngo.organization?.name && (
          <div className="text-xs text-gray-500 italic">
            {ngo.organization.name}
          </div>
        )}

        <Button 
          onClick={() => onSelect?.(ngo)} 
          className="w-full mt-2"
          variant="outline"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default NGOCard;
