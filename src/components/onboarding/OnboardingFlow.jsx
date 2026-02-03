import { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import PermissionRequest from './PermissionRequest';
import BatteryOptimization from './BatteryOptimization';
import KillSwitchSetup from './KillSwitchSetup';
import ModelDownload from './ModelDownload';

const STEPS = [
  { id: 'welcome', component: WelcomeScreen, title: 'Welcome' },
  { id: 'permissions', component: PermissionRequest, title: 'Notifications' },
  { id: 'battery', component: BatteryOptimization, title: 'Battery' },
  { id: 'killswitch', component: KillSwitchSetup, title: 'Kill Switch' },
  { id: 'model', component: ModelDownload, title: 'AI Model' }
];

export default function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const CurrentComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      {/* Progress indicator */}
      {!isFirstStep && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#636363]">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-[#FF8A8A]">
              {STEPS[currentStep].title}
            </span>
          </div>
          <div className="h-1.5 bg-[#161616] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step dots for non-welcome screens */}
      {!isFirstStep && (
        <div className="flex justify-center gap-2 py-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-[#FF6B6B]'
                  : index < currentStep
                  ? 'bg-[#4A1C1C]'
                  : 'bg-[#222222]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-auto">
        <CurrentComponent
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
