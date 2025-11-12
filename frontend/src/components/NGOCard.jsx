import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Building2, Package, TrendingUp, Heart } from 'lucide-react';

const NGOCard = ({ ngo, matchScore, onSelect }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{ngo.name}</CardTitle>
          </div>
          {matchScore && (
            <Badge variant={matchScore >= 0.7 ? "default" : "secondary"}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {Math.round(matchScore * 100)}% Match
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{ngo.city}, {ngo.state || 'India'}</span>
        </div>

        {ngo.categories && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Accepts:</p>
            <div className="flex flex-wrap gap-1">
              {ngo.categories.slice(0, 3).map((cat, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {ngo.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{ngo.categories.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {ngo.urgentNeed && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <Heart className="h-4 w-4" />
            <span className="font-medium">Has urgent needs</span>
          </div>
        )}

        {ngo.capacity && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Capacity: {ngo.capacity} items/week</span>
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
