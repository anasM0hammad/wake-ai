import { useState, useEffect } from 'react';
import { getRecommendedModelSize, getDeviceRAM } from '../../utils/deviceInfo';
import { useLLM } from '../../hooks/useLLM';
import { updateSettings } from '../../services/storage/settingsStorage';

const MODEL_INFO = {
  small: {
    name: 'Qwen 0.5B',
    size: '~350MB',
    description: 'Fast and lightweight, perfect for most devices'
  },
  large: {
    name: 'Qwen 1.5B',
    size: '~1GB',
    description: 'More capable, recommended for devices with 6GB+ RAM'
  }
};

export default function ModelDownload({ onNext, onBack }) {
  const [recommendedSize, setRecommendedSize] = useState('small');
  const [selectedSize, setSelectedSize] = useState('small');
  const [deviceRam, setDeviceRam] = useState(0);
  const [isDetecting, setIsDetecting] = useState(true);

  const { modelStatus, loadingProgress, initializeModel, isReady, isLoading, hasError, error } = useLLM();

  useEffect(() => {
    detectDevice();
  }, []);

  const detectDevice = async () => {
    setIsDetecting(true);
    const ram = await getDeviceRAM();
    const recommended = await getRecommendedModelSize();

    setDeviceRam(ram);
    setRecommendedSize(recommended);
    setSelectedSize(recommended);
    setIsDetecting(false);
  };

  const handleDownload = async () => {
    await initializeModel(selectedSize);
  };

  const handleSkip = () => {
    // Mark that model is not downloaded but continue
    updateSettings({ modelDownloaded: false });
    onNext();
  };

  const handleContinue = () => {
    updateSettings({ modelDownloaded: true });
    onNext();
  };

  if (isDetecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Detecting your device...</p>
      </div>
    );
  }

  // Download complete
  if (isReady) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">AI Model Ready!</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            The AI is ready to generate personalized questions for your alarms.
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={handleContinue}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            Finish Setup
          </button>
        </div>
      </div>
    );
  }

  // Downloading
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Downloading AI Model</h2>
          <p className="text-gray-600 max-w-sm mx-auto mb-6">
            {loadingProgress.status || 'Preparing download...'}
          </p>

          <div className="w-full max-w-sm">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress.progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{loadingProgress.progress}%</p>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <p className="text-center text-sm text-gray-500">
            Please keep the app open during download
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Download Failed</h2>
          <p className="text-gray-600 max-w-sm mx-auto mb-2">
            We couldn't download the AI model.
          </p>
          {error && (
            <p className="text-sm text-red-600 max-w-sm mx-auto">{error}</p>
          )}
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={handleDownload}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Initial state - model selection
  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <div className="mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Download AI Model</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Download the AI to generate unique questions. This only needs to happen once.
          </p>
        </div>

        {deviceRam > 0 && (
          <p className="text-center text-sm text-gray-500 mb-6">
            Detected device RAM: ~{Math.round(deviceRam / 1024)}GB
          </p>
        )}

        <div className="space-y-3 mb-6">
          {['small', 'large'].map((size) => {
            const info = MODEL_INFO[size];
            const isRecommended = size === recommendedSize;

            return (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedSize === size
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{info.name}</h4>
                      {isRecommended && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{info.size}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedSize === size
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedSize === size && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-2">What happens if I skip?</h4>
          <p className="text-sm text-gray-600">
            WakeAI will use pre-written questions instead. You can download the AI model later from settings.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={handleDownload}
          className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {MODEL_INFO[selectedSize].name}
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 px-6 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Download Later
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 px-6 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
