import React from 'react';
import { Check, Circle } from 'lucide-react';

const StatusTimeline = ({ currentStatus, events = [] }) => {
  const steps = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'OUT_FOR_DELIVERY', label: 'Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const getStepState = (stepKey, index) => {
    const statusOrder = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus?.toUpperCase());

    if (currentStatus?.toUpperCase() === 'CANCELLED') {
      return 'cancelled';
    }
    if (currentIndex > index) return 'completed';
    if (currentIndex === index) return 'active';
    return 'upcoming';
  };

  return (
    <div className="w-full my-4">
      {/* Horizontal Step Indicator Bar (Matching image_1.png mockup) */}
      <div className="flex items-center justify-between relative px-2 mb-6">
        {/* Connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, index) => {
          const state = getStepState(step.key, index);
          return (
            <div key={step.key} className="flex flex-col items-center z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-between justify-center transition-all ${
                  state === 'completed'
                    ? 'bg-teal-800 text-white shadow-sm'
                    : state === 'active'
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100 shadow-md'
                    : state === 'cancelled'
                    ? 'bg-red-500 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {state === 'completed' ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : state === 'active' ? (
                  <div className="w-3 h-3 bg-teal-300 rounded-full animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  state === 'completed'
                    ? 'text-teal-900 font-semibold'
                    : state === 'active'
                    ? 'text-teal-700 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Audit Log Events List */}
      {events.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Audit Trail & Status History
          </h4>
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={event.id || idx} className="flex items-start space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {event.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {event.note && <p className="text-slate-600 mt-0.5">{event.note}</p>}
                  <span className="text-[10px] text-slate-400 italic">By {event.changed_by_name || 'System'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
