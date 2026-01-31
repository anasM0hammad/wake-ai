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
  const [localShowUpsell, setLocalShowUpsell] = useState(false);

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

  // Handle upsell state
  const isUpsellOpen = showUpsell || localShowUpsell;
  const handleDismissUpsell = () => {
    dismissUpsell();
    setLocalShowUpsell(false);
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo with new gradient */}
          <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/25">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">WakeAI</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 bg-zinc-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50">
            <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
            <span className="text-xs font-medium text-zinc-300">{isModelReady ? 'AI Ready' : 'Backup'}</span>
          </div>

          {/* Dashboard Button - visible for ALL users */}
          <button
            onClick={() => {
              if (isPremium) {
                navigate('/dashboard');
              } else {
                setLocalShowUpsell(true);
              }
            }}
            className="relative w-11 h-11 bg-zinc-800/60 backdrop-blur-sm hover:bg-zinc-700/60 rounded-2xl flex items-center justify-center transition-all border border-zinc-700/50"
          >
            <svg className="w-5 h-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            {/* Lock badge for free users */}
            {!isPremium && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-sm shadow-amber-500/30">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C9.24 2 7 4.24 7 7v2H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3z"/>
                </svg>
              </div>
            )}
          </button>

          {/* Settings Button - no background */}
          <button
            onClick={() => navigate('/settings')}
            className="w-11 h-11 flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="w-32 h-32 bg-gradient-to-br from-sky-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-sky-500/20">
              <svg className="w-16 h-16 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Alarm Set</h2>
            <p className="text-zinc-400 text-center mb-8 max-w-xs">Set your first alarm and wake up smarter with AI-powered questions</p>
            <button
              onClick={handleAddAlarm}
              className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-sky-500/25 transition-all active:scale-95"
            >
              Set Your Alarm
            </button>
          </div>
        ) : (
          /* Alarm Exists - Premium Design */
          <div className="flex-1 flex flex-col pt-6 pb-4">
            {/* Main Alarm Card */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 overflow-hidden">
              {/* Status Bar */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${alarm.enabled ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-zinc-600'}`} />
                  <span className={`text-sm font-medium ${alarm.enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {alarm.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <button
                  onClick={handleToggleAlarm}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${alarm.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${alarm.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Time Display */}
              <div className="px-6 py-10 text-center">
                <div className="text-7xl font-extralight text-white tracking-tight mb-3 font-mono">
                  {formatTimeDisplay(alarm.time, true)}
                </div>
                {alarm.enabled && timeUntil && (
                  <p className="text-zinc-500 text-base">
                    Rings {timeUntil}
                  </p>
                )}
              </div>

              {/* Mode and Category Row */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-xl">
                    <span className="text-sky-400 text-sm font-medium">
                      {difficultyInfo.name}
                    </span>
                    <span className="text-sky-400/60 text-sm ml-1">
                      · {difficultyInfo.questions}Q
                    </span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                    <span className="text-amber-400 text-sm font-medium capitalize">
                      {settings?.selectedCategories?.[0] || 'Math'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Full Width, Equal Size */}
              <div className="px-6 pb-6">
                <div className="flex gap-3">
                  <button
                    onClick={handleEditAlarm}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Alarm
                  </button>
                  <button
                    onClick={handleDeleteAlarm}
                    className="w-16 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-2xl font-medium transition-all flex items-center justify-center border border-red-500/20"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tone Card - Below Main Card */}
            <div className="mt-4 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-wide">Alarm Tone</p>
                    <p className="text-white font-medium capitalize">{settings?.alarmTone || 'Gentle'}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-sky-400 text-sm font-medium hover:text-sky-300 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Upsell - Bottom */}
      {!isPremium && (
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={() => setLocalShowUpsell(true)}
            className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 rounded-2xl p-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Upgrade to Premium</p>
                  <p className="text-zinc-400 text-sm">Unlock all modes & features</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        isOpen={isUpsellOpen}
        onClose={handleDismissUpsell}
        feature={upsellFeature}
      />
    </div>
  );
}
