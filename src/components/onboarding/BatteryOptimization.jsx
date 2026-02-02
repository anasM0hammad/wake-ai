import { useState, useEffect } from 'react';
import {
  isBatteryOptimizationEnabled,
  requestDisableBatteryOptimization,
  getBatteryOptimizationInstructions,
  getManufacturer
} from '../../utils/permissions';

export default function BatteryOptimization({ onNext, onBack }) {
  const [isOptimized, setIsOptimized] = useState(null);
  const [manufacturer, setManufacturer] = useState('generic');
  const [instructions, setInstructions] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkOptimization();
  }, []);

  const checkOptimization = async () => {
    setIsChecking(true);
    const optimized = await isBatteryOptimizationEnabled();
    const mfr = await getManufacturer();

    setIsOptimized(optimized);
    setManufacturer(mfr);
    setInstructions(getBatteryOptimizationInstructions(mfr));
    setIsChecking(false);
  };

  const handleOpenSettings = async () => {
    await requestDisableBatteryOptimization();
    setShowInstructions(true);
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 bg-[#050505]">
        <div className="w-12 h-12 border-4 border-[#262626] border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-[#737373]">Checking battery settings...</p>
      </div>
    );
  }

  // Not optimized - all good
  if (!isOptimized) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">You're All Set!</h2>
          <p className="text-[#737373] max-w-sm mx-auto">
            Battery optimization won't interfere with your alarms. Your alarms will ring reliably.
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={onNext}
            className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 px-6 text-[#737373] font-medium hover:text-white transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Battery optimization is enabled - need to guide user
  return (
    <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
      <div className="flex-1">
        <div className="mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Battery Optimization</h2>
          <p className="text-[#737373] max-w-sm mx-auto">
            Your device may stop WakeAI from running in the background. Let's fix that.
          </p>
        </div>

        <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-white mb-1">Why disable this?</h4>
              <p className="text-sm text-[#737373]">
                Battery optimization can prevent alarms from ringing when your phone is asleep. Disabling it ensures your alarm works every time.
              </p>
            </div>
          </div>
        </div>

        {showInstructions && instructions && (
          <div className="bg-[#0C0C0C] rounded-xl p-4 mb-6 border border-[#1F1F1F]">
            <h4 className="font-semibold text-white mb-3">{instructions.title}</h4>
            <ol className="space-y-2">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm text-[#E5E5E5]">
                  <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center flex-shrink-0 font-medium text-xs">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!showInstructions && (
          <button
            onClick={handleOpenSettings}
            className="w-full py-3 px-4 bg-red-600/10 border border-red-600/20 text-red-500 font-medium rounded-xl hover:bg-red-600/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Show Me How
          </button>
        )}
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={onNext}
          className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors"
        >
          {showInstructions ? "I've Done This" : 'Continue'}
        </button>

        {!showInstructions && (
          <button
            onClick={onNext}
            className="w-full py-3 px-6 text-[#525252] font-medium hover:text-[#737373] transition-colors text-sm"
          >
            Skip for now (alarm may not ring reliably)
          </button>
        )}

        <button
          onClick={onBack}
          className="w-full py-3 px-6 text-[#737373] font-medium hover:text-white transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
