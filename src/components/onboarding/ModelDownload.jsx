import { useState, useEffect } from 'react';
import { useLLM } from '../../hooks/useLLM';
import { updateSettings } from '../../services/storage/settingsStorage';

export default function ModelDownload({ onNext, onBack }) {
  const [isStarting, setIsStarting] = useState(false);

  const { loadingProgress, initializeModel, isReady, isLoading, hasError, error } = useLLM();

  const handleDownload = async () => {
    setIsStarting(true);
    // Model is automatically selected based on device capabilities
    await initializeModel();
    setIsStarting(false);
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

  // Auto-start download when starting is triggered
  useEffect(() => {
    if (isStarting && !isLoading && !isReady && !hasError) {
      // Download already started via handleDownload
    }
  }, [isStarting, isLoading, isReady, hasError]);

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

  // Initial state - no model selection, just download button
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
            Download the AI to generate unique questions. The best model for your device will be automatically selected.
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-gray-900">Automatic Selection</h4>
              <p className="text-sm text-gray-600 mt-1">
                WakeAI will choose the optimal model based on your device's capabilities.
              </p>
            </div>
          </div>
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
          Download AI Model
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
