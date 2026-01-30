import { useState, useRef } from 'react';

export default function SwipeToStart({
  currentTime,
  snoozesRemaining,
  onDismiss,
  onSnooze,
  onKillSwitch
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
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
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));

    setSwipeOffset(clampedDiff);
    setSwipeDirection(diff > 20 ? 'right' : diff < -20 ? 'left' : null);
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
    } else if (swipeOffset < -SWIPE_THRESHOLD && snoozesRemaining > 0) {
      // Swipe left - Snooze
      setIsAnimating(true);
      setSwipeOffset(-MAX_SWIPE);
      setTimeout(() => {
        onSnooze?.();
      }, 200);
    } else {
      // Reset
      setSwipeOffset(0);
      setSwipeDirection(null);
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
    if (swipeDirection === 'right') {
      return Math.min(1, swipeOffset / SWIPE_THRESHOLD);
    }
    if (swipeDirection === 'left') {
      return Math.min(1, Math.abs(swipeOffset) / SWIPE_THRESHOLD);
    }
    return 0;
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
        {/* Alarm icon */}
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-8 animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
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
          {/* Left indicator (Snooze) */}
          <div
            className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-opacity ${
              swipeDirection === 'left' ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              opacity: swipeDirection === 'left' ? 0.4 + progress * 0.6 : 0.4
            }}
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-400 font-medium">
              Snooze {snoozesRemaining > 0 ? `(${snoozesRemaining})` : ''}
            </span>
          </div>

          {/* Right indicator (Dismiss) */}
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-opacity`}
            style={{
              opacity: swipeDirection === 'right' ? 0.4 + progress * 0.6 : 0.4
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
              swipeDirection === 'right'
                ? 'bg-green-500'
                : swipeDirection === 'left'
                ? 'bg-blue-500'
                : 'bg-white'
            }`}
            style={{
              left: `calc(50% - 32px + ${swipeOffset}px)`,
              transition: isAnimating ? 'all 0.2s ease-out' : 'none'
            }}
          >
            <svg
              className={`w-6 h-6 ${
                swipeDirection ? 'text-white' : 'text-gray-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Hint text */}
        <p className="text-center text-white/40 text-sm mt-4">
          Swipe right to dismiss{snoozesRemaining > 0 ? ', left to snooze' : ''}
        </p>
      </div>
    </div>
  );
}
