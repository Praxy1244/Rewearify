import React from 'react';
import { AIInsightsCard, FraudDetectionWidget, MatchingWidget } from '../../components/AI';

const AIInsights = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Insights & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive AI-powered insights for donation management and optimization
        </p>
      </div>

      {/* Main AI Insights Dashboard */}
      <AIInsightsCard userRole="admin" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Detection Widget */}
        <FraudDetectionWidget showBatchResults={true} />
        
        {/* Matching Widget */}
        <MatchingWidget showTopMatches={true} />
      </div>
    </div>
  );
};

export default AIInsights;