import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, ArrowRight } from 'lucide-react';

export const MatchingWidget = ({ matches }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        AI-Matched NGOs for Your Donation
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((ngo) => (
          <Card key={ngo.id} className="border-indigo-100 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-indigo-700">{ngo.name}</CardTitle>
              <CardDescription className="flex items-center text-xs">
                <MapPin className="w-3 h-3 mr-1" /> {ngo.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-800 mb-4">
                <strong>Why:</strong> {ngo.match_reason}
              </div>
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Donate Here <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};