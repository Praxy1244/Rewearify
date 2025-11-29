import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Calendar, AlertCircle, Building2 } from 'lucide-react';

const NeedCard = ({ request, onDonate, onView }) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Badge className={`mb-2 ${getUrgencyColor(request.urgency)}`}>
              {request.urgency.toUpperCase()} NEED
            </Badge>
            <h4 className="font-bold text-lg text-gray-900">{request.title}</h4>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">
              {request.requester?.organization?.name || request.requester?.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{request.location?.city}, {request.location?.state}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Needed by: {new Date(request.timeline?.neededBy).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{request.category}</Badge>
          <span className="text-sm text-gray-600">• {request.quantity} items needed</span>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => onDonate(request)} 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Donate Now
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onView(request)}
            className="px-3"
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeedCard;