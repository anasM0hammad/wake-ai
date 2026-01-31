import { useNavigate } from 'react-router-dom';
import { useStats } from '../hooks/useStats';
import { usePremium } from '../hooks/usePremium';
import { Card, Button } from '../components/common';
import { PremiumUpsell } from '../components/premium';

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats } = useStats();
  const { isPremium, showUpsell, setShowUpsell, triggerUpsell } = usePremium();

  // Check premium access
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#171717] border-b border-[#262626] safe-area-top">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-lg hover:bg-[#262626] transition-colors"
            >
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-2 text-lg font-semibold text-white">Dashboard</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-900/30 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Premium Feature
          </h2>
          <p className="text-neutral-400 mb-6 max-w-sm">
            Unlock detailed statistics and insights with WakeAI Premium.
          </p>
          <Button
            variant="primary"
            onClick={() => triggerUpsell('dashboard')}
          >
            Upgrade to Premium
          </Button>
        </div>

        <PremiumUpsell
          isOpen={showUpsell}
          onClose={() => setShowUpsell(false)}
        />
      </div>
    );
  }

  const totalAlarms = stats.totalSuccessfulWakeups + stats.totalKillSwitchUses + stats.totalFailedAlarms;
  const successRate = totalAlarms > 0
    ? Math.round((stats.totalSuccessfulWakeups / totalAlarms) * 100)
    : 0;
  const avgQuestionsPerSession = stats.totalSuccessfulWakeups > 0
    ? Math.round(stats.totalQuestionsAnswered / stats.totalSuccessfulWakeups)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#171717] border-b border-[#262626] safe-area-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-[#262626] transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Dashboard</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Success Rate */}
        <Card className="text-center py-8">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-[#262626]"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${successRate * 3.52} 352`}
                className="text-indigo-500"
              />
            </svg>
            <div className="absolute">
              <div className="text-3xl font-bold text-white">
                {successRate}%
              </div>
              <div className="text-sm text-neutral-400">
                Success Rate
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center py-6">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {stats.totalSuccessfulWakeups}
            </div>
            <div className="text-sm text-neutral-400">
              Successful Wakeups
            </div>
          </Card>

          <Card className="text-center py-6">
            <div className="text-3xl font-bold text-amber-400 mb-1">
              {stats.totalKillSwitchUses}
            </div>
            <div className="text-sm text-neutral-400">
              Kill Switch Uses
            </div>
          </Card>

          <Card className="text-center py-6">
            <div className="text-3xl font-bold text-red-400 mb-1">
              {stats.totalFailedAlarms}
            </div>
            <div className="text-sm text-neutral-400">
              Failed Alarms
            </div>
          </Card>

          <Card className="text-center py-6">
            <div className="text-3xl font-bold text-indigo-400 mb-1">
              {stats.totalQuestionsAnswered}
            </div>
            <div className="text-sm text-neutral-400">
              Questions Answered
            </div>
          </Card>
        </div>

        {/* Streaks */}
        <Card>
          <h2 className="text-sm font-medium text-neutral-400 mb-4">
            Streaks
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">
                    Current Streak
                  </div>
                  <div className="text-sm text-neutral-400">
                    Consecutive successful wakeups
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.currentStreak || 0}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">
                    Best Streak
                  </div>
                  <div className="text-sm text-neutral-400">
                    Your all-time record
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.longestStreak || 0}
              </div>
            </div>
          </div>
        </Card>

        {/* Insights */}
        <Card>
          <h2 className="text-sm font-medium text-neutral-400 mb-4">
            Insights
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-[#262626] rounded-xl">
              <div className="text-sm text-neutral-400">
                Avg. questions per session
              </div>
              <div className="text-lg font-semibold text-white">
                {avgQuestionsPerSession} questions
              </div>
            </div>

            <div className="p-3 bg-[#262626] rounded-xl">
              <div className="text-sm text-neutral-400">
                Total alarms set
              </div>
              <div className="text-lg font-semibold text-white">
                {totalAlarms} alarms
              </div>
            </div>

            {stats.lastWakeupTime && (
              <div className="p-3 bg-[#262626] rounded-xl">
                <div className="text-sm text-neutral-400">
                  Last successful wakeup
                </div>
                <div className="text-lg font-semibold text-white">
                  {new Date(stats.lastWakeupTime).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
