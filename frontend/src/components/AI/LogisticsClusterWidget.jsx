import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Navigation } from 'lucide-react';

export const LogisticsClusterWidget = ({ clusters }) => {
  if (!clusters) return null;

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Map className="w-5 h-5 text-blue-600" />
          Logistics Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {clusters.map((cluster) => (
            <div key={cluster.clusterId} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm text-gray-900">Zone {cluster.clusterId}: {cluster.regionName}</h4>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {cluster.ngos.length} NGOs
                </span>
              </div>
              <ul className="space-y-1">
                {cluster.ngos.slice(0, 3).map((ngo, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                     <Navigation className="w-3 h-3 text-gray-400" />
                     {ngo.name}
                  </li>
                ))}
                {cluster.ngos.length > 3 && (
                  <li className="text-xs text-gray-400 pl-4">+ {cluster.ngos.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};