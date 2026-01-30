import { useEffect, useState } from 'react';

const MOTIVATIONAL_MESSAGES = [
  "Rise and shine! You've conquered the morning!",
  "Great job! Your brain is now officially awake.",
  "Success! Time to make today amazing.",
  "You did it! Every morning victory counts.",
  "Awesome! Your willpower is stronger than your pillow.",
  "Champion! You've defeated the snooze monster.",
  "Brilliant! Ready to take on the world.",
  "Excellent! Your future self thanks you.",
  "Victory! Coffee tastes better when you earn it.",
  "Amazing! You're already winning the day."
];

export default function AlarmSuccess({
  stats,
  onClose,
  isPremium
}) {
  const [message] = useState(() =>
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  );
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-900 via-emerald-900 to-green-900 flex flex-col">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#FCD34D', '#FBBF24', '#F59E0B'][
                    Math.floor(Math.random() * 6)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Success icon */}
        <div className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center mb-8 animate-bounce-slow">
          <div className="w-24 h-24 rounded-full bg-green-500/40 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          You're Awake!
        </h1>

        {/* Motivational message */}
        <p className="text-green-200 text-center text-lg mb-10 max-w-sm">
          {message}
        </p>

        {/* Stats */}
        <div className="bg-white/10 rounded-2xl p-6 w-full max-w-sm mb-8">
          <h3 className="text-white/60 text-sm font-medium mb-4 text-center">Session Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {stats.questionsAnswered}
              </div>
              <div className="text-green-300/60 text-xs mt-1">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {stats.questionsCorrect}
              </div>
              <div className="text-green-300/60 text-xs mt-1">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {formatDuration(stats.duration)}
              </div>
              <div className="text-green-300/60 text-xs mt-1">Time</div>
            </div>
          </div>
        </div>

        {/* Accuracy */}
        {stats.questionsAnswered > 0 && (
          <div className="mb-8">
            <div className="text-center">
              <span className="text-5xl font-bold text-white">
                {Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100)}%
              </span>
              <span className="text-green-300/60 ml-2">accuracy</span>
            </div>
          </div>
        )}
      </div>

      {/* Ad placeholder for free users */}
      {!isPremium && (
        <div className="px-6 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-white/40 text-sm">Ad placeholder</p>
          </div>
        </div>
      )}

      {/* Close button */}
      <div className="px-6 pb-8">
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors"
        >
          Start Your Day
        </button>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
