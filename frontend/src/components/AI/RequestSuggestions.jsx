import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TrendingUp, Package } from 'lucide-react';

export const RequestSuggestions = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      {suggestions.slice(0, 4).map((item, idx) => (
        <div 
          key={idx}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition-colors cursor-pointer"
          onClick={() => onSelect(item.category || item.name)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 capitalize">
                {item.category || item.name}
              </p>
              <p className="text-xs text-gray-600">
                {item.available_count || item.count} items available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Supply
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
