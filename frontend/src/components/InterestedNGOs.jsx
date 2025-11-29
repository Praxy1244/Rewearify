import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Check, Star, Clock } from 'lucide-react';

const InterestedNGOs = ({ requests, onAccept, loading }) => {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
        <Star className="h-5 w-5 text-yellow-500" />
        Interested NGOs ({requests.length})
      </h3>
      <p className="text-sm text-gray-600">
        These organizations have requested your donation. Accept one to proceed.
      </p>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request._id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={request.requester?.profile?.profilePicture} />
                  <AvatarFallback>{request.requester?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {request.requester?.organization?.name || request.requester?.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{request.requester?.location?.city}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {request.urgency} Priority
                    </Badge>
                  </div>
                  {request.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">"{request.notes}"</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => onAccept(request._id)} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Accept
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InterestedNGOs;