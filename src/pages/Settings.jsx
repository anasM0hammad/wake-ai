import { useState, useRef } from 'react';
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
  const [confirmKillCode, setConfirmKillCode] = useState(['', '', '', '']);
  const [killCodeStep, setKillCodeStep] = useState('enter'); // 'enter' | 'confirm'
  const [killCodeError, setKillCodeError] = useState('');
  const inputRefs = useRef([]);
  const confirmInputRefs = useRef([]);

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

  const handleKillCodeDigit = (index, value, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;

    const setter = isConfirm ? setConfirmKillCode : setNewKillCode;
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const currentCode = isConfirm ? confirmKillCode : newKillCode;

    const newCode = [...currentCode];
    newCode[index] = value.slice(-1);
    setter(newCode);
    setKillCodeError('');

    // Auto-focus next input
    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKillCodeKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const currentCode = isConfirm ? confirmKillCode : newKillCode;

    if (e.key === 'Backspace' && !currentCode[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleKillCodeContinue = () => {
    if (killCodeStep === 'enter') {
      const code = newKillCode.join('');
      if (code.length === 4) {
        setKillCodeStep('confirm');
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
      }
    } else {
      const code = newKillCode.join('');
      const confirm = confirmKillCode.join('');
      if (code === confirm) {
        updateSetting('killCode', code);
        handleCloseKillCodeModal();
      } else {
        setKillCodeError('Codes do not match. Please try again.');
        setConfirmKillCode(['', '', '', '']);
        confirmInputRefs.current[0]?.focus();
      }
    }
  };

  const handleCloseKillCodeModal = () => {
    setShowKillCodeModal(false);
    setNewKillCode(['', '', '', '']);
    setConfirmKillCode(['', '', '', '']);
    setKillCodeStep('enter');
    setKillCodeError('');
  };

  const handleReset = () => {
    resetSettings();
    setShowResetModal(false);
  };

  const renderKillCodeInputs = (values, refs, isConfirm = false) => (
    <div className="flex justify-center items-center gap-4 py-6">
      {values.map((digit, index) => (
        <input
          key={index}
          ref={el => refs.current[index] = el}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleKillCodeDigit(index, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKillCodeKeyDown(index, e, isConfirm)}
          className="w-16 h-16 bg-[#0A0A0A] border-2 border-[#262626] rounded-2xl text-3xl font-bold text-center text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505] border-b border-[#1F1F1F] safe-area-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-[#141414] transition-colors"
          >
            <svg className="w-6 h-6 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Difficulty Mode */}
        <Card>
          <h2 className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-3">
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
                      ? 'bg-red-600/10 border-2 border-red-600/30'
                      : isLocked
                      ? 'bg-[#0A0A0A] border-2 border-transparent opacity-60'
                      : 'bg-[#0A0A0A] border-2 border-transparent hover:bg-[#141414]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {mode.label}
                      </span>
                      {isLocked && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-600/20 text-amber-500 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#737373]">
                      {mode.questions} questions
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
          <h2 className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-3">
            Question Categories
          </h2>
          {!isPremium && (
            <p className="text-xs text-amber-500 mb-3">
              Free users can select one category. Upgrade for multiple categories.
            </p>
          )}
          <div className="space-y-3">
            {Object.entries(QUESTION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">
                    {category.label}
                  </div>
                  <div className="text-sm text-[#737373]">
                    {category.description}
                  </div>
                </div>
                <Toggle
                  checked={settings.selectedCategories?.includes(key)}
                  onChange={() => handleCategoryToggle(key)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Alarm Tone */}
        <Card>
          <h2 className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-3">
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
                      ? 'bg-red-600/10 border-2 border-red-600/30'
                      : isLocked
                      ? 'bg-[#0A0A0A] border-2 border-transparent opacity-60'
                      : 'bg-[#0A0A0A] border-2 border-transparent hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {tone.label}
                    </span>
                    {isLocked && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-600/20 text-amber-500 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Premium
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
          <h2 className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-3">
            Kill Switch
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">
                Emergency Code
              </div>
              <div className="text-sm text-[#737373]">
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
              <div className="font-medium text-white">
                Vibration
              </div>
              <div className="text-sm text-[#737373]">
                Vibrate during alarm
              </div>
            </div>
            <Toggle
              checked={settings.vibrationEnabled !== false}
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
        <p className="text-[#737373] mb-6">
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
        onClose={handleCloseKillCodeModal}
        title={killCodeStep === 'enter' ? 'Set Kill Code' : 'Confirm Kill Code'}
      >
        <p className="text-[#737373] mb-2 text-center">
          {killCodeStep === 'enter'
            ? 'Enter a new 4-digit emergency code.'
            : 'Enter your code again to confirm.'}
        </p>

        {killCodeStep === 'enter'
          ? renderKillCodeInputs(newKillCode, inputRefs, false)
          : renderKillCodeInputs(confirmKillCode, confirmInputRefs, true)}

        {killCodeError && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{killCodeError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCloseKillCodeModal}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleKillCodeContinue}
            disabled={killCodeStep === 'enter'
              ? newKillCode.join('').length !== 4
              : confirmKillCode.join('').length !== 4}
          >
            {killCodeStep === 'enter' ? 'Continue' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
