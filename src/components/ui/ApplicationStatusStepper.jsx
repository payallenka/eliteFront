import React from "react";
import { 
  User, 
  FileText, 
  Brain, 
  University, 
  Send, 
  Mail, 
  DollarSign, 
  Plane, 
  CheckCircle 
} from 'lucide-react';

export default function ApplicationStatusStepper({ steps, currentStep = 0, onStepUpdate }) {
  const getStepIcon = (step, idx, isActive) => {
    if (step.status === 'done') {
      return <CheckCircle size={16} />;
    } else if (step.status === 'in-progress') {
      return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>;
    } else {
      // Map step labels to appropriate icons
      const stepLabel = step.label || step.step_label || '';
      const stepId = step.id || step.step_id || idx + 1;
      
      // Map by step label or ID
      if (stepLabel.includes('Profile') || stepId === 1) return <User size={16} />;
      if (stepLabel.includes('Documents') || stepId === 2) return <FileText size={16} />;
      if (stepLabel.includes('Analysis') || stepLabel.includes('Eligibility') || stepId === 3) return <Brain size={16} />;
      if (stepLabel.includes('University') || stepLabel.includes('Selection') || stepId === 4) return <University size={16} />;
      if (stepLabel.includes('Application') || stepLabel.includes('Submitted') || stepId === 5) return <Send size={16} />;
      if (stepLabel.includes('Offer') || stepLabel.includes('Decision') || stepId === 6) return <Mail size={16} />;
      if (stepLabel.includes('Scholarship') || stepLabel.includes('Financial') || stepId === 7) return <DollarSign size={16} />;
      if (stepLabel.includes('Visa') && stepLabel.includes('Started') || stepId === 8) return <FileText size={16} />;
      if (stepLabel.includes('Visa') && (stepLabel.includes('Approved') || stepLabel.includes('Travel')) || stepId === 9) return <Plane size={16} />;
      
      // Fallback to step number if no match
      return idx + 1;
    }
  };

  const getStepColor = (step, idx, isActive) => {
    if (step.status === 'done') {
      return 'bg-green-500 border-green-500 text-white';
    } else if (step.status === 'in-progress') {
      return 'bg-yellow-500 border-yellow-500 text-white';
    } else if (isActive) {
      return 'bg-[#6c47ff] border-[#6c47ff] text-white';
    } else {
      return 'bg-white border-gray-300 text-gray-400';
    }
  };

  const getTextColor = (step, idx, isActive) => {
    if (step.status === 'done') {
      return 'text-green-600';
    } else if (step.status === 'in-progress') {
      return 'text-yellow-600';
    } else if (isActive) {
      return 'text-[#6c47ff]';
    } else {
      return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 sm:p-6 mb-8">
      <div className="flex items-center justify-between w-full overflow-x-auto pb-4">
        {steps.map((step, idx) => {
          const isActive = idx <= currentStep;
          const stepColor = getStepColor(step, idx, isActive);
          const textColor = getTextColor(step, idx, isActive);
          
          return (
            <div key={step.id || step.label} className="flex-1 flex flex-col items-center relative min-w-[120px]">
              <div className={`rounded-full border-2 flex items-center justify-center w-10 h-10 mb-2 transition-colors duration-200 text-sm font-bold ${stepColor}`}>
                {getStepIcon(step, idx, isActive)}
              </div>
              <span className={`text-xs sm:text-sm font-medium text-center ${textColor} leading-tight`}>
                {step.label}
              </span>
              {step.triggerType && (
                <span className={`text-xs mt-1 px-2 py-1 rounded-full ${
                  step.triggerType === 'Auto' ? 'bg-blue-100 text-blue-600' :
                  step.triggerType === 'Manual' ? 'bg-orange-100 text-orange-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {step.triggerType}
                </span>
              )}
              {idx < steps.length - 1 && (
                <div className={`absolute top-5 left-full w-full h-1 ${
                  step.status === 'done' ? 'bg-green-500' :
                  isActive ? 'bg-[#6c47ff]' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
