import { useState, useRef } from 'react';

export default function SwipeToStart({
  currentTime,
  onDismiss,
  onKillSwitch
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef(null);

  const SWIPE_THRESHOLD = 120;
  const MAX_SWIPE = 150;

  const handleTouchStart = (e) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (isAnimating) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Only allow swiping right (positive direction)
    const clampedDiff = Math.max(0, Math.min(MAX_SWIPE, diff));

    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (isAnimating) return;

    if (swipeOffset > SWIPE_THRESHOLD) {
      // Swipe right - Dismiss (start questions)
      setIsAnimating(true);
      setSwipeOffset(MAX_SWIPE);
      setTimeout(() => {
        onDismiss?.();
      }, 200);
    } else {
      // Reset
      setSwipeOffset(0);
    }
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return { time: `${h}:${m}`, ampm };
  };

  const { time, ampm } = formatTime(currentTime);

  const getSwipeProgress = () => {
    return Math.min(1, swipeOffset / SWIPE_THRESHOLD);
  };

  const progress = getSwipeProgress();

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 flex flex-col">
      {/* Kill switch button */}
      <button
        onClick={onKillSwitch}
        className="absolute top-4 right-4 p-3 text-white/30 hover:text-white/60 transition-colors z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl bg-white/10 flex items-center justify-center mb-8 animate-pulse p-4">
          <img
            src='/assets/images/logo.png'
            alt="WakeAI"
            className='w-full h-full object-contain'
          />
        </div>

        {/* Current time */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center">
            <span className="text-8xl font-bold text-white tracking-tight">{time}</span>
            <span className="text-3xl font-medium text-white/70 ml-2">{ampm}</span>
          </div>
        </div>

        {/* Alarm label */}
        <p className="text-white/60 text-lg mb-16">Wake Up!</p>
      </div>

      {/* Swipe area */}
      <div className="px-6 pb-12">
        <div
          ref={containerRef}
          className="relative h-20 bg-white/10 rounded-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Right indicator (Dismiss) */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
            style={{
              opacity: 0.4 + progress * 0.6
            }}
          >
            <span className="text-green-400 font-medium">Dismiss</span>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Swipe handle */}
          <div
            className={`absolute top-2 bottom-2 w-16 rounded-full flex items-center justify-center transition-colors ${
              swipeOffset > 20
                ? 'bg-green-500'
                : 'bg-white'
            }`}
            style={{
              left: `calc(8px + ${swipeOffset}px)`,
              transition: isAnimating ? 'all 0.2s ease-out' : 'none'
            }}
          >
            <svg
              className={`w-6 h-6 ${
                swipeOffset > 20 ? 'text-white' : 'text-gray-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        {/* Hint text */}
        <p className="text-center text-white/40 text-sm mt-4">
          Swipe right to dismiss
        </p>
      </div>
    </div>
  );
}
