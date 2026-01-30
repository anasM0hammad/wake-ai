import { useEffect } from 'react';

const FEATURE_DESCRIPTIONS = {
  medium_difficulty: 'Medium difficulty mode with 3 questions',
  hard_difficulty: 'Hard difficulty mode with 5 questions',
  multiple_alarms: 'Create unlimited alarms',
  premium_tones: 'Access all alarm tones',
  all_categories: 'All question categories',
  no_ads: 'Ad-free experience',
  dashboard: 'Detailed sleep statistics'
};

const PREMIUM_FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'All Difficulty Modes',
    description: 'Medium (3 questions) and Hard (5 questions)'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Multiple Alarms',
    description: 'Create as many alarms as you need'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
      </svg>
    ),
    title: 'Premium Alarm Tones',
    description: 'Classic, Intense, and more'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Statistics Dashboard',
    description: 'Track your wake-up performance'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: 'No Ads',
    description: 'Enjoy an ad-free experience'
  }
];

export default function PremiumUpsell({ isOpen, onClose, feature, onUpgrade }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const featureDescription = feature ? FEATURE_DESCRIPTIONS[feature] : null;

  const handleUpgrade = () => {
    // Placeholder for IAP integration
    onUpgrade?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 px-6 py-8 text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
          {featureDescription ? (
            <p className="text-white/80">Unlock {featureDescription}</p>
          ) : (
            <p className="text-white/80">Get the most out of WakeAI</p>
          )}
        </div>

        {/* Features */}
        <div className="px-6 py-6 max-h-64 overflow-y-auto">
          <div className="space-y-4">
            {PREMIUM_FEATURES.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">$4.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">or $29.99/year (save 50%)</p>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            Upgrade Now
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 mt-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
