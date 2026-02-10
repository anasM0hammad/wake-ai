import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useBannerAd } from '../hooks/useAds';
import { Button, Toggle, Modal, Card } from '../components/common';
import { DIFFICULTY_MODES, QUESTION_CATEGORIES, ALARM_TONES } from '../utils/constants';
import { playAlarm, stopAlarm } from '../services/alarm/audioPlayer';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showKillCodeModal, setShowKillCodeModal] = useState(false);
  const [newKillCode, setNewKillCode] = useState(['', '', '', '']);
  const [confirmKillCode, setConfirmKillCode] = useState(['', '', '', '']);
  const [killCodeStep, setKillCodeStep] = useState('enter'); // 'enter' | 'confirm'
  const [killCodeError, setKillCodeError] = useState('');
  const inputRefs = useRef([]);
  const confirmInputRefs = useRef([]);

  const tonePreviewRef = useRef(null);

  // Show banner ad at bottom
  useBannerAd();

  // Stop tone preview on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (tonePreviewRef.current) clearTimeout(tonePreviewRef.current);
    };
  }, []);

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

  const clearData = async () => {
    const cacheNames = await caches.keys();
    for(const cache of cacheNames){
      if(cache.includes('webllm')){
        await caches.delete(cache);
      }
    }

    updateSettings({
      difficulty: 'EASY',
      selectedCategories: ['math'],
      alarmTone: 'gentle',
      killCode: null,
      vibrationEnabled: true,
      modelDownloaded: false,
      onboardingComplete: false
    });
  }

  const handleCategoryToggle = (category) => {
    const currentCategories = settings.selectedCategories || ['math'];

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

  const handleToneSelect = useCallback((toneKey) => {
    updateSetting('alarmTone', toneKey);

    // Stop any previous preview and play the selected tone once
    stopAlarm();
    if (tonePreviewRef.current) clearTimeout(tonePreviewRef.current);

    playAlarm(toneKey, false).catch(() => {
      // Silently ignore preview errors (e.g. on web with no audio files)
    });

    // Auto-stop after 3 seconds
    tonePreviewRef.current = setTimeout(() => {
      stopAlarm();
    }, 3000);
  }, [updateSetting]);

  const handleDifficultySelect = (difficultyKey) => {
    updateSetting('difficulty', difficultyKey);
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

  const handleClearData = () => {
    clearData();
    setShowClearModal(false);
  }

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
          className="w-16 h-16 bg-[#0A0A0A] border-2 border-[#222222] rounded-2xl text-3xl font-bold text-center text-[#F1F1F1] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-all"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#050505] border-b border-[#1A1A1A] safe-area-top">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-[#161616] transition-colors"
          >
            <svg className="w-6 h-6 text-[#636363]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold text-[#F1F1F1]">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Difficulty Mode */}
        <Card>
          <h2 className="text-xs font-medium text-[#636363] uppercase tracking-wide mb-3">
            Difficulty Mode
          </h2>
          <div className="space-y-2">
            {Object.entries(DIFFICULTY_MODES).map(([key, mode]) => {
              const isSelected = settings.difficulty === key;

              return (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key)}
                  className={`w-full p-3 rounded-xl text-left transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#10B981]/10 border-2 border-[#10B981]/30'
                      : 'bg-[#0A0A0A] border-2 border-transparent hover:bg-[#161616]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-[#34D399]' : 'text-[#F1F1F1]'}`}>
                        {mode.label}
                      </span>
                    </div>
                    <div className="text-sm text-[#636363]">
                      {mode.questions} questions
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
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
          <h2 className="text-xs font-medium text-[#636363] uppercase tracking-wide mb-3">
            Question Categories
          </h2>
          <div className="space-y-3">
            {Object.entries(QUESTION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#F1F1F1]">
                    {category.label}
                  </div>
                  <div className="text-sm text-[#636363]">
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
          <h2 className="text-xs font-medium text-[#636363] uppercase tracking-wide mb-3">
            Alarm Tone
          </h2>
          <div className="space-y-2">
            {Object.entries(ALARM_TONES).map(([key, tone]) => {
              const isSelected = settings.alarmTone === key;

              return (
                <button
                  key={key}
                  onClick={() => handleToneSelect(key)}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#10B981]/10 border-2 border-[#10B981]/30'
                      : 'bg-[#0A0A0A] border-2 border-transparent hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isSelected ? 'text-[#34D399]' : 'text-[#F1F1F1]'}`}>
                      {tone.label}
                    </span>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
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
          <h2 className="text-xs font-medium text-[#636363] uppercase tracking-wide mb-3">
            Kill Switch
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#F1F1F1]">
                Emergency Code
              </div>
              <div className="text-sm text-[#636363]">
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
              <div className="font-medium text-[#F1F1F1]">
                Vibration
              </div>
              <div className="text-sm text-[#636363]">
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
            className="w-full mb-1"
            onClick={() => setShowResetModal(true)}
          >
            Reset All Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setShowClearModal(true)}
          >
            Clear Data
          </Button>
        </Card>
      </div>

      {/* Spacer for native banner ad overlay */}
      <div className="h-16 flex-shrink-0" />

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings?"
      >
        <p className="text-[#636363] mb-6">
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

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Data?"
      >
        <p className="text-[#636363] mb-6">
          This will clear all the current data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowClearModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleClearData}
          >
            Clear
          </Button>
        </div>
      </Modal>

      {/* Kill Code Modal */}
      <Modal
        isOpen={showKillCodeModal}
        onClose={handleCloseKillCodeModal}
        title={killCodeStep === 'enter' ? 'Set Kill Code' : 'Confirm Kill Code'}
      >
        <p className="text-[#636363] mb-2 text-center">
          {killCodeStep === 'enter'
            ? 'Enter a new 4-digit emergency code.'
            : 'Enter your code again to confirm.'}
        </p>

        {killCodeStep === 'enter'
          ? renderKillCodeInputs(newKillCode, inputRefs, false)
          : renderKillCodeInputs(confirmKillCode, confirmInputRefs, true)}

        {killCodeError && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 mb-4">
            <p className="text-[#EF4444] text-sm text-center">{killCodeError}</p>
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
