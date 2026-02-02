import { useState } from 'react';

const CATEGORY_COLORS = {
  math: { bg: 'bg-red-600/10', text: 'text-red-400' },
  patterns: { bg: 'bg-red-600/10', text: 'text-red-400' },
  general: { bg: 'bg-red-600/10', text: 'text-red-400' },
  logic: { bg: 'bg-red-600/10', text: 'text-red-400' }
};

export default function QuestionCard({
  question,
  progress,
  onAnswer,
  onKillSwitch
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [isAnimating, setIsAnimating] = useState(false);

  if (!question) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#262626] border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const categoryStyle = CATEGORY_COLORS[question.category] || CATEGORY_COLORS.math;

  const handleOptionSelect = async (index) => {
    if (isAnimating) return;

    setSelectedIndex(index);
    setIsAnimating(true);

    const isCorrect = index === question.correctIndex;
    setShowFeedback(isCorrect ? 'correct' : 'wrong');

    // Show feedback briefly
    await new Promise(resolve => setTimeout(resolve, isCorrect ? 500 : 800));

    setSelectedIndex(null);
    setShowFeedback(null);
    setIsAnimating(false);

    onAnswer?.(isCorrect);
  };

  const getOptionStyle = (index) => {
    if (showFeedback && selectedIndex === index) {
      if (showFeedback === 'correct') {
        return 'bg-emerald-500 border-emerald-500 text-white scale-105';
      }
      return 'bg-red-500 border-red-500 text-white animate-shake';
    }

    if (showFeedback === 'wrong' && index === question.correctIndex) {
      return 'bg-emerald-500/20 border-emerald-500 text-emerald-100';
    }

    return 'bg-[#141414] border-[#262626] text-white hover:bg-[#1F1F1F] hover:border-[#333333]';
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        {/* Category */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
          {question.category?.charAt(0).toUpperCase() + question.category?.slice(1)}
        </span>

        {/* Kill switch */}
        <button
          onClick={onKillSwitch}
          className="p-2 text-[#525252] hover:text-[#737373] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between text-sm text-[#737373] mb-2">
          <span>{progress.correct} of {progress.required} correct</span>
          <span>{progress.wrong} wrong</span>
        </div>
        <div className="h-2 bg-[#141414] rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300"
            style={{ width: `${(progress.correct / progress.required) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 pb-8">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnimating}
              className={`w-full py-4 px-6 rounded-xl border-2 font-medium text-lg transition-all duration-200 ${getOptionStyle(index)}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-[#262626] flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
