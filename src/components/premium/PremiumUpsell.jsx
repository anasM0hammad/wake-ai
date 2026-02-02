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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-[#0C0C0C] rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-[#1F1F1F]">
        {/* Header - Gold Gradient */}
        <div className="relative bg-gradient-to-br from-amber-600 to-amber-500 px-6 py-8 text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polygon strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
                <div className="w-10 h-10 rounded-full bg-amber-600/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-[#737373]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 py-4 bg-[#050505] border-t border-[#1F1F1F]">
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-white">$4.99</span>
              <span className="text-[#737373]">/month</span>
            </div>
            <p className="text-sm text-[#737373] mt-1">or $29.99/year (save 50%)</p>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-600 active:from-amber-800 active:to-amber-700 transition-all shadow-lg shadow-amber-600/25"
          >
            Upgrade Now
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 mt-2 text-[#737373] font-medium hover:text-white transition-colors"
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
