import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const FraudAlertWidget = ({ alerts, onReview }) => {
  return (
    <Card className="border-red-100 shadow-sm">
      <CardHeader className="pb-3 bg-red-50/50 rounded-t-xl border-b border-red-100">
        <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Fraud Detection Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {!alerts || alerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No suspicious activities detected.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start justify-between bg-white p-3 border rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Donation #{alert.id}</p>
                  <p className="text-xs text-red-600 mt-0.5">{alert.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">Donor Risk Score: {alert.riskScore}%</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onReview(alert.id)} className="text-xs h-8">
                Review
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};