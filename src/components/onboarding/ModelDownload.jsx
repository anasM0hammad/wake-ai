import { useState, useEffect, useCallback } from 'react';
import { useLLM } from '../../hooks/useLLM';
import { updateSettings } from '../../services/storage/settingsStorage';
import { addProgressListener } from '../../services/llm/webllm';

// Rotating friendly messages shown during download
const FRIENDLY_MESSAGES = [
  { emoji: '🔒', text: 'Your questions are generated privately on your device' },
  { emoji: '✈️', text: 'Works completely offline — no internet needed for alarms' },
  { emoji: '🧠', text: 'AI stays on your phone — your data never leaves' },
  { emoji: '⚡', text: 'One-time setup — you won\'t need to do this again' },
  { emoji: '🌙', text: 'Smart questions to actually wake your brain up' },
  { emoji: '🔐', text: 'No servers, no cloud — 100% private and secure' },
  { emoji: '📱', text: 'Everything runs locally on this device' },
];

// Helper function to parse MB values from WebLLM progress text
function parseDownloadInfo(progressText) {
  if (!progressText) return { mbLoaded: null, mbTotal: null };

  // Try to extract MB loaded and total from the text
  // Patterns like "52.3MB loaded" or "52.3 MB loaded"
  const mbLoadedMatch = progressText.match(/(\d+\.?\d*)\s*MB\s*loaded/i);
  // Patterns like "370MB total" or "370 MB total"
  const mbTotalMatch = progressText.match(/(\d+\.?\d*)\s*MB\s*total/i);

  return {
    mbLoaded: mbLoadedMatch ? parseFloat(mbLoadedMatch[1]) : null,
    mbTotal: mbTotalMatch ? parseFloat(mbTotalMatch[1]) : null,
  };
}

export default function ModelDownload({ onNext, onBack }) {
  const [isStarting, setIsStarting] = useState(false);
  const [localProgress, setLocalProgress] = useState({ progress: 0, text: '' });
  const [messageIndex, setMessageIndex] = useState(0);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  const { loadingProgress, initializeModel, isReady, isLoading, hasError } = useLLM();

  // Subscribe to progress updates directly from the service
  useEffect(() => {
    const unsubscribe = addProgressListener((state) => {
      if (state.progress) {
        setLocalProgress({
          progress: state.progress.progress || 0,
          text: state.progress.status || ''
        });
      }
    });
    return unsubscribe;
  }, []);

  // Sync with hook's loading progress
  useEffect(() => {
    if (loadingProgress && (loadingProgress.progress !== undefined)) {
      setLocalProgress({
        progress: loadingProgress.progress || 0,
        text: loadingProgress.status || ''
      });
    }
  }, [loadingProgress]);

  // Rotate through friendly messages every 4 seconds
  useEffect(() => {
    if (!isLoading && !isStarting) return;

    const interval = setInterval(() => {
      // Start fade out
      setIsMessageVisible(false);

      // After fade out, change message and fade in
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % FRIENDLY_MESSAGES.length);
        setIsMessageVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading, isStarting]);

  const handleDownload = useCallback(async () => {
    setIsStarting(true);
    setLocalProgress({ progress: 0, text: '' });
    setMessageIndex(0);
    setIsMessageVisible(true);
    await initializeModel();
    setIsStarting(false);
  }, [initializeModel]);

  const handleSkip = () => {
    updateSettings({ modelDownloaded: false });
    onNext();
  };

  const handleContinue = () => {
    updateSettings({ modelDownloaded: true });
    onNext();
  };

  // Parse MB values from progress text
  const downloadInfo = parseDownloadInfo(localProgress.text);
  const displayProgress = Math.min(100, Math.max(0, localProgress.progress));
  const currentMessage = FRIENDLY_MESSAGES[messageIndex];

  // Download complete
  if (isReady) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-[#F1F1F1] mb-3">You're All Set!</h2>
          <p className="text-[#B0B0B0] max-w-sm mx-auto">
            Your AI assistant is ready to create unique questions
          </p>

          {/* One-time badge */}
          <p className="mt-6 text-center text-[#636363] text-xs tracking-wide">
            Everything runs on your device · No internet needed
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={handleContinue}
            className="w-full py-4 px-6 bg-[#FF6B6B] hover:bg-[#E85D5D] text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-[#FF6B6B]/25"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Downloading state
  if (isLoading || isStarting) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Icon and Heading */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#E85D5D] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F1F1F1] mb-3">Setting Up Smart Questions</h2>

          {/* Friendly context message */}
          <p className="text-[#B0B0B0] text-sm text-center mb-4">
            Downloading your personal AI assistant. This only happens once!
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-sm">
            <div className="h-3 bg-[#161616] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>

            {/* Progress details row */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-[#FF8A8A] text-lg font-semibold">{displayProgress}%</span>
              {downloadInfo.mbLoaded !== null && downloadInfo.mbTotal !== null ? (
                <span className="text-[#636363] text-sm">
                  {Math.round(downloadInfo.mbLoaded)} MB / {Math.round(downloadInfo.mbTotal)} MB
                </span>
              ) : null}
            </div>
          </div>

          {/* Rotating friendly messages */}
          <div className="mt-8 w-full max-w-sm">
            <div className="bg-[#0D0D0D] rounded-2xl px-4 py-3 border border-[#1A1A1A]">
              <p
                className={`text-[#B0B0B0] text-sm text-center transition-opacity duration-300 ${
                  isMessageVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="mr-2">{currentMessage.emoji}</span>
                {currentMessage.text}
              </p>
            </div>
          </div>

          {/* One-time badge */}
          <p className="mt-4 text-center text-[#636363] text-xs tracking-wide">
            One-time download · Works offline forever
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <button
            onClick={handleSkip}
            className="w-full py-3 px-6 bg-[#161616] hover:bg-[#1A1A1A] border border-[#222222] text-[#B0B0B0] font-medium rounded-2xl transition-colors"
          >
            Download Later
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Warning Icon (amber) */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-[#F1F1F1] mb-3">Download Interrupted</h2>
          <p className="text-[#B0B0B0] max-w-sm mx-auto">
            No worries! You can use the app with built-in questions for now
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="w-full py-4 px-6 bg-[#161616] hover:bg-[#1A1A1A] border border-[#222222] text-[#F1F1F1] font-semibold rounded-2xl transition-colors"
            >
              Continue Anyway
            </button>
            <p className="text-[#636363] text-xs mt-1">
              You'll use backup questions for now
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="w-full py-3 px-6 bg-[#161616] hover:bg-[#1A1A1A] border border-[#222222] text-[#B0B0B0] font-medium rounded-2xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Initial state (idle) - before download starts
  return (
    <div className="flex flex-col min-h-full px-6 py-8 bg-[#050505]">
      <div className="flex-1">
        <div className="mb-6 text-center">
          {/* Icon and Heading */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#E85D5D] flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#F1F1F1] mb-3">Setting Up Smart Questions</h2>
          <p className="text-[#B0B0B0] max-w-sm mx-auto">
            Download the AI to generate unique, personalized questions that will actually wake your brain up.
          </p>
        </div>

        {/* Privacy benefits */}
        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-[#1A1A1A] mb-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <h4 className="font-medium text-[#E8ECF1]">100% Private</h4>
              <p className="text-sm text-[#B0B0B0] mt-1">
                Everything runs on your device. Your data never leaves your phone.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0D0D0D] rounded-2xl p-4 border border-[#1A1A1A]">
          <div className="flex items-start gap-3">
            <span className="text-lg">✈️</span>
            <div>
              <h4 className="font-medium text-[#E8ECF1]">Works Offline</h4>
              <p className="text-sm text-[#B0B0B0] mt-1">
                Once downloaded, your AI works without internet — even in airplane mode.
              </p>
            </div>
          </div>
        </div>

        {/* Size note */}
        <p className="mt-4 text-center text-[#636363] text-xs">
          About 300-500 MB depending on your device
        </p>
      </div>

      <div className="space-y-3 pt-6">
        <button
          onClick={handleDownload}
          className="w-full py-4 px-6 bg-[#FF6B6B] text-white font-semibold rounded-2xl hover:bg-[#E85D5D] active:bg-[#D54F4F] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B6B]/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Now
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 px-6 bg-[#161616] hover:bg-[#1A1A1A] border border-[#222222] text-[#B0B0B0] font-medium rounded-2xl transition-colors"
        >
          Download Later
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 px-6 text-[#636363] font-medium hover:text-[#F1F1F1] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
