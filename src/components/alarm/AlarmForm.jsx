import { useState, useEffect } from 'react';
import TimePicker from '../common/TimePicker';
import { DIFFICULTY } from '../../utils/constants';
import { usePremium } from '../../hooks/usePremium';

export default function AlarmForm({
  alarm,
  onSave,
  onCancel,
  isOpen
}) {
  const [time, setTime] = useState('07:00');
  const [difficulty, setDifficulty] = useState('EASY');

  const { isPremium, triggerUpsell } = usePremium();

  // Initialize form when alarm changes or form opens
  useEffect(() => {
    if (alarm) {
      setTime(alarm.time || '07:00');
      setDifficulty(alarm.difficulty || 'EASY');
    } else {
      setTime('07:00');
      setDifficulty('EASY');
    }
  }, [alarm, isOpen]);

  const handleDifficultySelect = (level) => {
    const difficultyInfo = DIFFICULTY[level];
    if (difficultyInfo?.premium && !isPremium) {
      triggerUpsell(level === 'MEDIUM' ? 'medium_difficulty' : 'hard_difficulty');
      return;
    }
    setDifficulty(level);
  };

  const handleSave = () => {
    onSave?.({
      id: alarm?.id,
      time,
      difficulty,
      enabled: alarm?.enabled ?? true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Form */}
      <div className="relative w-full max-w-md mx-0 sm:mx-4 bg-white rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <button
            onClick={onCancel}
            className="text-gray-600 font-medium hover:text-gray-900"
          >
            Cancel
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {alarm?.id ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button
            onClick={handleSave}
            className="text-indigo-600 font-semibold hover:text-indigo-700"
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Time Picker */}
          <div>
            <TimePicker
              value={time}
              onChange={setTime}
            />
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Difficulty</h3>
            <div className="space-y-2">
              {Object.entries(DIFFICULTY).map(([key, value]) => {
                const isLocked = value.premium && !isPremium;
                const isSelected = difficulty === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleDifficultySelect(key)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50'
                        : isLocked
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          isSelected ? 'text-indigo-600' : isLocked ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {value.name}
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
                      <p className={`text-sm mt-1 ${
                        isLocked ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Answer {value.questions} question{value.questions > 1 ? 's' : ''} to dismiss
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete button for edit mode */}
          {alarm?.id && (
            <button
              onClick={() => {
                onCancel?.();
                // Parent should handle delete
              }}
              className="w-full py-3 text-red-600 font-medium hover:text-red-700 transition-colors"
            >
              Delete Alarm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
