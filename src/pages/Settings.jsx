import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { usePremium } from '../hooks/usePremium';
import { Button, Toggle, Modal, Card } from '../components/common';
import { DIFFICULTY_MODES, QUESTION_CATEGORIES, ALARM_TONES } from '../utils/constants';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { isPremium, triggerUpsell } = usePremium();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showKillCodeModal, setShowKillCodeModal] = useState(false);
  const [newKillCode, setNewKillCode] = useState(['', '', '', '']);

  const updateSetting = (key, value) => {
    updateSettings({ [key]: value });
  };

  const resetSettings = () => {
    updateSettings({
      difficulty: 'EASY',
      selectedCategories: ['math'],
      alarmTone: 'gentle',
      killCode: null,
      vibrationEnabled: true
    });
  };

  const handleCategoryToggle = (category) => {
    const currentCategories = settings.selectedCategories || ['math'];

    if (!isPremium) {
      // Free users can only have one category selected
      updateSetting('selectedCategories', [category]);
      return;
    }

    let newCategories;
    if (currentCategories.includes(category)) {
      // Don't allow removing if it's the last category
      if (currentCategories.length === 1) return;
      newCategories = currentCategories.filter(c => c !== category);
    } else {
      newCategories = [...currentCategories, category];
    }

    updateSetting('selectedCategories', newCategories);
  };

  const handleToneSelect = (toneKey) => {
    const tone = ALARM_TONES[toneKey];
    if (tone?.premium && !isPremium) {
      triggerUpsell('premium_tones');
      return;
    }
    updateSetting('alarmTone', toneKey);
  };

  const handleDifficultySelect = (difficultyKey) => {
    const mode = DIFFICULTY_MODES[difficultyKey];
    if (mode?.premium && !isPremium) {
      triggerUpsell(difficultyKey === 'medium' ? 'medium_difficulty' : 'hard_difficulty');
      return;
    }
    updateSetting('difficulty', difficultyKey.toUpperCase());
  };

  const handleKillCodeDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...newKillCode];
    newCode[index] = value.slice(-1);
    setNewKillCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`kill-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSaveKillCode = () => {
    const code = newKillCode.join('');
    if (code.length === 4) {
      updateSetting('killCode', code);
      setShowKillCodeModal(false);
      setNewKillCode(['', '', '', '']);
    }
  };

  const handleReset = () => {
    resetSettings();
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-surface-900 border-b border-gray-200 dark:border-surface-800 safe-area-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Difficulty Mode */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Difficulty Mode
          </h2>
          <div className="space-y-2">
            {Object.entries(DIFFICULTY_MODES).map(([key, mode]) => {
              const isLocked = mode.premium && !isPremium;
              const isSelected = settings.difficulty?.toLowerCase() === key;

              return (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key)}
                  className={`w-full p-3 rounded-xl text-left transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                      : isLocked
                      ? 'bg-gray-100 dark:bg-surface-800 border-2 border-transparent opacity-60'
                      : 'bg-gray-100 dark:bg-surface-800 border-2 border-transparent'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {mode.label}
                      </span>
                      {isLocked && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {mode.questions} questions
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Question Categories */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Question Categories
          </h2>
          {!isPremium && (
            <p className="text-xs text-amber-600 mb-3">
              Free users can select one category. Upgrade for multiple categories.
            </p>
          )}
          <div className="space-y-3">
            {Object.entries(QUESTION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
                  </div>
                </div>
                <Toggle
                  enabled={settings.selectedCategories?.includes(key)}
                  onChange={() => handleCategoryToggle(key)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Alarm Tone */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Alarm Tone
          </h2>
          <div className="space-y-2">
            {Object.entries(ALARM_TONES).map(([key, tone]) => {
              const isLocked = tone.premium && !isPremium;
              const isSelected = settings.alarmTone === key;

              return (
                <button
                  key={key}
                  onClick={() => handleToneSelect(key)}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                      : isLocked
                      ? 'bg-gray-100 dark:bg-surface-800 border-2 border-transparent opacity-60'
                      : 'bg-gray-100 dark:bg-surface-800 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tone.label}
                    </span>
                    {isLocked && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Premium
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Kill Switch */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Kill Switch
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Emergency Code
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current: {settings.killCode ? '****' : 'Not set'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKillCodeModal(true)}
            >
              Change
            </Button>
          </div>
        </Card>

        {/* Vibration */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Vibration
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Vibrate during alarm
              </div>
            </div>
            <Toggle
              enabled={settings.vibrationEnabled !== false}
              onChange={(enabled) => updateSetting('vibrationEnabled', enabled)}
            />
          </div>
        </Card>

        {/* Reset */}
        <Card>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setShowResetModal(true)}
          >
            Reset All Settings
          </Button>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings?"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This will reset all settings to their defaults. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowResetModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </Modal>

      {/* Kill Code Modal */}
      <Modal
        isOpen={showKillCodeModal}
        onClose={() => {
          setShowKillCodeModal(false);
          setNewKillCode(['', '', '', '']);
        }}
        title="Change Kill Code"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter a new 4-digit emergency code.
        </p>
        <div className="flex justify-center gap-3 mb-6">
          {newKillCode.map((digit, index) => (
            <input
              key={index}
              id={`kill-digit-${index}`}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleKillCodeDigit(index, e.target.value)}
              className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setShowKillCodeModal(false);
              setNewKillCode(['', '', '', '']);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveKillCode}
            disabled={newKillCode.join('').length !== 4}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
