import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarm } from '../hooks/useAlarm';
import { useSettings } from '../hooks/useSettings';
import { usePremium } from '../hooks/usePremium';
import { useLLM } from '../hooks/useLLM';
import AlarmForm from '../components/alarm/AlarmForm';
import PremiumUpsell from '../components/premium/PremiumUpsell';
import { getNextAlarmDate, getTimeUntilAlarm, formatTimeDisplay } from '../utils/timeUtils';
import { DIFFICULTY_MODES } from '../utils/constants';

export default function Home() {
  const navigate = useNavigate();
  const { alarm, createAlarm, updateAlarm, deleteAlarm, toggleAlarm, isAlarmSet } = useAlarm();
  const { settings, isOnboardingComplete } = useSettings();
  const { isPremium, showUpsell, upsellFeature, triggerUpsell, dismissUpsell } = usePremium();
  const { isReady: isModelReady } = useLLM();

  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [timeUntil, setTimeUntil] = useState('');

  // Check onboarding status
  useEffect(() => {
    if (!isOnboardingComplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [isOnboardingComplete, navigate]);

  // Update time until alarm
  useEffect(() => {
    if (alarm?.enabled) {
      const updateTime = () => {
        const nextAlarm = getNextAlarmDate(alarm.time);
        setTimeUntil(getTimeUntilAlarm(nextAlarm));
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [alarm]);

  const handleAddAlarm = () => {
    setEditingAlarm(null);
    setShowAlarmForm(true);
  };

  const handleEditAlarm = () => {
    setEditingAlarm(alarm);
    setShowAlarmForm(true);
  };

  const handleSaveAlarm = async (alarmData) => {
    if (alarmData.id) {
      await updateAlarm(alarmData.id, alarmData);
    } else {
      await createAlarm(alarmData.time, alarmData.difficulty);
    }
    setShowAlarmForm(false);
    setEditingAlarm(null);
  };

  const handleDeleteAlarm = async () => {
    if (confirm('Delete this alarm?')) {
      await deleteAlarm();
    }
  };

  const handleToggleAlarm = async () => {
    await toggleAlarm();
  };

  // Get difficulty info
  const getDifficultyInfo = () => {
    if (!alarm?.difficulty) return { name: 'Easy', questions: 1 };
    const diffKey = alarm.difficulty.toLowerCase();
    const diff = DIFFICULTY_MODES[diffKey];
    return diff ? { name: diff.label, questions: diff.questions } : { name: 'Easy', questions: 1 };
  };

  const difficultyInfo = getDifficultyInfo();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">WakeAI</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 bg-neutral-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-neutral-700/50">
            <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
            <span className="text-xs font-medium text-neutral-300">{isModelReady ? 'AI Ready' : 'Backup'}</span>
          </div>

          {/* Dashboard Button - only for premium users */}
          {isPremium && (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-11 h-11 bg-neutral-800/60 backdrop-blur-sm hover:bg-neutral-700/60 rounded-2xl flex items-center justify-center transition-all border border-neutral-700/50"
            >
              <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            className="w-11 h-11 bg-neutral-800/60 backdrop-blur-sm hover:bg-neutral-700/60 rounded-2xl flex items-center justify-center transition-all border border-neutral-700/50"
          >
            <svg className="w-5 h-5 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 flex flex-col">
        {!isAlarmSet ? (
          /* No Alarm Set - Show Setup Prompt */
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20">
              <svg className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Alarm Set</h2>
            <p className="text-neutral-400 text-center mb-8 max-w-xs">Set your first alarm and wake up smarter with AI-powered questions</p>
            <button
              onClick={handleAddAlarm}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              Set Your Alarm
            </button>
          </div>
        ) : (
          /* Alarm Exists - Show Alarm Card */
          <div className="flex-1 flex flex-col pt-8">
            {/* Alarm Time Card */}
            <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur-sm rounded-3xl p-6 border border-neutral-700/50 mb-6">
              {/* Toggle Row */}
              <div className="flex items-center justify-between mb-6">
                <span className={`text-sm font-medium ${alarm.enabled ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {alarm.enabled ? 'Alarm Active' : 'Alarm Disabled'}
                </span>
                <button
                  onClick={handleToggleAlarm}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${alarm.enabled ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${alarm.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Time Display */}
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-white tracking-tight mb-2">
                  {formatTimeDisplay(alarm.time, true)}
                </div>
                {alarm.enabled && timeUntil && (
                  <p className="text-neutral-400">
                    Rings in {timeUntil}
                  </p>
                )}
              </div>

              {/* Difficulty Badge */}
              <div className="flex justify-center mb-6">
                <div className="bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 rounded-xl">
                  <span className="text-indigo-300 font-medium">
                    {difficultyInfo.name} Mode
                  </span>
                  <span className="text-indigo-400/70 ml-2 text-sm">
                    ({difficultyInfo.questions} {difficultyInfo.questions === 1 ? 'question' : 'questions'})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleEditAlarm}
                  className="flex-1 bg-neutral-700/50 hover:bg-neutral-700 text-white py-3 rounded-xl font-medium transition-colors border border-neutral-600/50"
                >
                  Edit Alarm
                </button>
                <button
                  onClick={handleDeleteAlarm}
                  className="w-14 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-medium transition-colors border border-red-500/20"
                >
                  <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                  </svg>
                  <span className="text-xs text-neutral-500 uppercase tracking-wide">Category</span>
                </div>
                <p className="text-white font-medium capitalize">{settings?.selectedCategories?.[0] || 'Math'}</p>
              </div>
              <div className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                  <span className="text-xs text-neutral-500 uppercase tracking-wide">Tone</span>
                </div>
                <p className="text-white font-medium capitalize">{settings?.alarmTone || 'Gentle'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Upsell - Bottom */}
      {!isPremium && (
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={() => triggerUpsell()}
            className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 rounded-2xl p-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Upgrade to Premium</p>
                  <p className="text-neutral-400 text-sm">Unlock all modes and features</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Alarm Form Modal */}
      <AlarmForm
        alarm={editingAlarm}
        onSave={handleSaveAlarm}
        onCancel={() => {
          setShowAlarmForm(false);
          setEditingAlarm(null);
        }}
        isOpen={showAlarmForm}
      />

      {/* Premium Upsell Modal */}
      <PremiumUpsell
        isOpen={showUpsell}
        onClose={dismissUpsell}
        feature={upsellFeature}
      />
    </div>
  );
}
