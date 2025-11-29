import React from 'react';
import { Truck, MapPin, CheckCircle, Package, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const DONATION_FLOW = [
  { step: 1, label: "Upload Donation", icon: Package },
  { step: 2, label: "AI Matching", icon: Sparkles },
  { step: 3, label: "Admin Review", icon: ShieldCheck },
  { step: 4, label: "NGO Selection", icon: MapPin },
  { step: 5, label: "Delivery & Impact", icon: Truck },
];

const getProgressStep = (status) => {
  switch (status) {
    case 'pending':
    case 'rejected': return 1;
    case 'approved': return 3;
    case 'matched': return 4;
    case 'pickup_scheduled':
    case 'in_transit':
    case 'delivered':
    case 'completed': return 5;
    default: return 1;
  }
};

const DonationTimeline = ({ status, className }) => {
  const currentStep = getProgressStep(status);
  
  let statusMessage = "Waiting for Admin Review...";
  if (status === 'matched') statusMessage = "Ready to schedule pickup.";
  else if (status === 'pickup_scheduled') statusMessage = "Pickup confirmed!";
  else if (status === 'in_transit') statusMessage = "On its way.";
  else if (status === 'completed') statusMessage = "Delivered & Completed!";
  else if (status === 'rejected') statusMessage = "Donation rejected.";

  return (
    <div className={cn("space-y-6 p-6 bg-white rounded-xl border shadow-sm", className)}>
      <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
        <Clock className="h-6 w-6 text-blue-600" />
        Donation Progress
      </h3>
      
      <div className={cn(
        "p-3 rounded-lg text-sm font-medium border-l-4",
        status === 'rejected' ? "bg-red-50 border-red-500 text-red-800" : "bg-blue-50 border-blue-500 text-blue-800"
      )}>
        <p className="font-semibold capitalize">Current Status: {status?.replace('_', ' ') || 'Unknown'}</p>
        <p className="text-xs mt-1">{statusMessage}</p>
      </div>

      <div className="relative pt-4">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {DONATION_FLOW.map((flowItem) => {
          const isCompleted = flowItem.step < currentStep || (flowItem.step === currentStep && status !== 'pending' && status !== 'rejected');
          const isActive = flowItem.step === currentStep && status !== 'rejected';
          
          let iconColor = 'text-gray-400 bg-white border-gray-400';
          if (isCompleted) iconColor = 'text-green-600 bg-white border-green-600';
          if (isActive) iconColor = 'text-blue-600 bg-blue-100 border-blue-600 shadow-md';
          if (status === 'rejected' && flowItem.step === 1) iconColor = 'text-red-600 bg-red-100 border-red-600 shadow-md';

          return (
            <div key={flowItem.step} className="flex items-start mb-8 relative">
              <div className={cn("flex-shrink-0 w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-300", iconColor)}>
                <flowItem.icon className="h-4 w-4" />
              </div>
              <div className="ml-4 pt-0.5">
                <h4 className={cn("font-semibold transition-colors duration-300", isCompleted ? 'text-gray-900' : 'text-gray-500', isActive && 'text-blue-600')}>
                  Step {flowItem.step}: {flowItem.label}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonationTimeline;