import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

export const RequestSuggestions = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-2 text-sm text-green-700 font-medium">
        <TrendingUp className="w-4 h-4" />
        <span>Available Now (High Supply):</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((item, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-green-100 hover:text-green-800 transition-all px-3 py-1 bg-green-50 text-green-700 border-green-200 border"
            onClick={() => onSelect(item)}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};