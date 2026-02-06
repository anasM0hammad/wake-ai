import { useState, useEffect } from 'react';

const CATEGORY_COLORS = {
  math: { bg: 'bg-[#10B981]/10', text: 'text-[#34D399]' },
  patterns: { bg: 'bg-[#10B981]/10', text: 'text-[#34D399]' },
  general: { bg: 'bg-[#10B981]/10', text: 'text-[#34D399]' },
  logic: { bg: 'bg-[#10B981]/10', text: 'text-[#34D399]' }
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

  // Reset state when question changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(null);
    setIsAnimating(false);
  }, [question]);

  if (!question) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#222222] border-t-[#10B981] rounded-full animate-spin" />
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
        return 'bg-[#22C55E] border-[#22C55E] text-white scale-105';
      }
      return 'bg-[#EF4444] border-[#EF4444] text-white animate-shake';
    }

    if (showFeedback === 'wrong' && index === question.correctIndex) {
      return 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]';
    }

    return 'bg-[#161616] border-[#222222] text-[#F1F1F1] hover:bg-[#1A1A1A] hover:border-[#2E2E2E]';
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
          className="p-2 text-[#636363] hover:text-[#B0B0B0] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between text-sm text-[#636363] mb-2">
          <span className="text-[#34D399]">{progress.correct} of {progress.required} correct</span>
          <span className="text-[#EF4444]">{progress.wrong} wrong</span>
        </div>
        <div className="h-2 bg-[#161616] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-300"
            style={{ width: `${(progress.correct / progress.required) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F1F1] text-center leading-relaxed">
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
              className={`w-full py-4 px-6 rounded-2xl border-2 font-medium text-lg transition-all duration-200 ${getOptionStyle(index)}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-[#222222] flex items-center justify-center text-sm font-bold">
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
