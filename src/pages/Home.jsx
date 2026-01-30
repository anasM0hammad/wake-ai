import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarm } from '../hooks/useAlarm';
import { useSettings } from '../hooks/useSettings';
import { usePremium } from '../hooks/usePremium';
import { useLLM } from '../hooks/useLLM';
import AlarmCard from '../components/alarm/AlarmCard';
import AlarmForm from '../components/alarm/AlarmForm';
import PremiumUpsell from '../components/premium/PremiumUpsell';
import { getNextAlarmDate, getTimeUntilAlarm } from '../utils/timeUtils';

export default function Home() {
  const navigate = useNavigate();
  const { alarm, createAlarm, updateAlarm, deleteAlarm, toggleAlarm, isAlarmSet } = useAlarm();
  const { isOnboardingComplete } = useSettings();
  const { isPremium, showUpsell, upsellFeature, triggerUpsell, dismissUpsell } = usePremium();
  const { modelStatus, loadingProgress, isReady: isModelReady, isLoading: isModelLoading } = useLLM();

  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);

  // Check onboarding status
  useEffect(() => {
    if (!isOnboardingComplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [isOnboardingComplete, navigate]);

  const handleAddAlarm = () => {
    setEditingAlarm(null);
    setShowAlarmForm(true);
  };

  const handleEditAlarm = (alarmToEdit) => {
    setEditingAlarm(alarmToEdit);
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
    await deleteAlarm();
    setShowAlarmForm(false);
    setEditingAlarm(null);
  };

  const handleToggleAlarm = async () => {
    await toggleAlarm();
  };

  // Calculate next alarm info
  const nextAlarmDate = alarm?.enabled ? getNextAlarmDate(alarm.time) : null;
  const timeUntilAlarm = nextAlarmDate ? getTimeUntilAlarm(nextAlarmDate) : null;

  const getModelStatusDisplay = () => {
    if (isModelReady) {
      return { text: 'AI Ready', color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (isModelLoading) {
      return { text: `Downloading ${loadingProgress.progress}%`, color: 'text-indigo-600', bg: 'bg-indigo-100' };
    }
    if (modelStatus === 'error') {
      return { text: 'Using fallback questions', color: 'text-amber-600', bg: 'bg-amber-100' };
    }
    return { text: 'Fallback mode', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const modelStatusDisplay = getModelStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">WakeAI</h1>
            <div className="flex items-center gap-2">
              {/* Settings */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {/* Dashboard */}
              <button
                onClick={() => {
                  if (isPremium) {
                    navigate('/dashboard');
                  } else {
                    triggerUpsell('dashboard');
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {!isPremium && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Model Status */}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${modelStatusDisplay.bg} ${modelStatusDisplay.color}`}>
              {isModelLoading && (
                <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
              )}
              {isModelReady && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {modelStatusDisplay.text}
            </span>
          </div>
        </div>
      </div>

      {/* Next Alarm Banner */}
      {alarm?.enabled && timeUntilAlarm && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <p className="text-indigo-100 text-sm">Next alarm in</p>
          <p className="text-white text-xl font-semibold">{timeUntilAlarm}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Alarm Display */}
        {isAlarmSet ? (
          <div className="space-y-4">
            <AlarmCard
              alarm={alarm}
              onToggle={handleToggleAlarm}
              onEdit={handleEditAlarm}
              onDelete={handleDeleteAlarm}
            />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Set Your Alarm</h2>
            <p className="text-gray-600 mb-6">Create your alarm to get started</p>
            <button
              onClick={handleAddAlarm}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Alarm
            </button>
          </div>
        )}

        {/* Premium Banner (for free users) */}
        {!isPremium && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Upgrade to Premium</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get harder questions, dashboard stats, and premium tones
                </p>
              </div>
              <button
                onClick={() => triggerUpsell()}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </div>

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
