import React from 'react';
import { CheckCircle2, Circle, Truck, Package, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const TrackingTimeline = ({ status, history = [] }) => {
  // Define the standard lifecycle steps
  const steps = [
    { id: 'pending', label: 'Submitted', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle2 },
    { id: 'matched', label: 'Matched', icon: Package },
    { id: 'pickup_scheduled', label: 'Pickup', icon: Truck },
    { id: 'completed', label: 'Delivered', icon: CheckCircle2 }
  ];

  // Helper to determine step status: 'complete', 'current', or 'upcoming'
  const getStepStatus = (stepId, currentStatus) => {
    const statusOrder = ['pending', 'approved', 'matched', 'pickup_scheduled', 'in_transit', 'delivered', 'completed'];
    
    // Map specialized statuses to our simplified steps
    let normalizedCurrent = currentStatus;
    if (currentStatus === 'in_transit') normalizedCurrent = 'pickup_scheduled';
    if (currentStatus === 'delivered') normalizedCurrent = 'completed';

    const currentIndex = statusOrder.indexOf(normalizedCurrent);
    const stepIndex = statusOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-6">
      <div className="relative">
        {/* Connector Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => {
            const stepStatus = getStepStatus(step.id, status);
            const isComplete = stepStatus === 'complete';
            const isCurrent = stepStatus === 'current';

            return (
              <div key={step.id} className="relative flex items-center gap-6">
                {/* Icon Circle */}
                <div 
                  className={cn(
                    "z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-300 bg-white",
                    isComplete ? "border-green-500 text-green-600" : 
                    isCurrent ? "border-blue-500 text-blue-600 scale-110" : 
                    "border-gray-200 text-gray-300"
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h4 className={cn(
                    "text-sm font-semibold",
                    isComplete || isCurrent ? "text-gray-900" : "text-gray-400"
                  )}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <p className="text-xs text-blue-600 font-medium animate-pulse">
                      In Progress
                    </p>
                  )}
                  {isComplete && (
                    <p className="text-xs text-green-600">
                      Completed
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackingTimeline;