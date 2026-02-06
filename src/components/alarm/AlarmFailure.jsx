export default function AlarmFailure({
  reason, // 'wrong_answers' | 'timeout'
  stats,
  onClose
}) {
  const getMessage = () => {
    switch (reason) {
      case 'wrong_answers':
        return {
          title: "Too Many Wrong Answers",
          subtitle: "You hit the maximum wrong answer limit.",
          tip: "Try getting more sleep or set an easier difficulty."
        };
      case 'timeout':
        return {
          title: "Time's Up",
          subtitle: "The alarm timed out after 20 minutes.",
          tip: "Answer questions more quickly next time."
        };
      default:
        return {
          title: "Alarm Ended",
          subtitle: "The alarm session has ended.",
          tip: "Keep trying, you'll get there!"
        };
    }
  };

  const { title, subtitle, tip } = getMessage();

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Failure icon */}
        <div className="w-32 h-32 rounded-full bg-[#EF4444]/20 flex items-center justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#EF4444]/30 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#F1F1F1] mb-2 text-center">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-[#B0B0B0] text-center text-lg mb-8">
          {subtitle}
        </p>

        {/* Stats */}
        {stats && (
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#F1F1F1]">
                  {stats.questionsAnswered}
                </div>
                <div className="text-[#636363] text-xs mt-1">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#34D399]">
                  {stats.questionsCorrect}
                </div>
                <div className="text-[#636363] text-xs mt-1">Correct</div>
              </div>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 w-full max-w-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[#636363] text-sm">{tip}</p>
          </div>
        </div>
      </div>

      {/* Close button */}
      <div className="px-6 pb-8">
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-[#161616] border border-[#222222] text-[#F1F1F1] font-semibold rounded-xl hover:bg-[#1A1A1A] hover:border-[#2E2E2E] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
