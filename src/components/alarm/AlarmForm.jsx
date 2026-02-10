import { useState } from 'react';
import TimePicker from '../common/TimePicker';
import { DIFFICULTY } from '../../utils/constants';

export default function AlarmForm({
  alarm,
  onSave,
  onCancel,
  isOpen
}) {
  // Initialize directly from alarm prop - component remounts fresh each time it opens
  const [time, setTime] = useState(alarm?.time || '07:00');
  const [difficulty, setDifficulty] = useState(alarm?.difficulty || 'EASY');

  const handleSave = () => {
    onSave?.({
      id: alarm?.id,
      time,
      difficulty,
      enabled: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Form */}
      <div className="relative w-full max-w-md mx-0 sm:mx-4 bg-[#0D0D0D] rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto border border-[#1A1A1A]">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D0D] px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between z-10">
          <button
            onClick={onCancel}
            className="text-[#636363] font-medium hover:text-[#F1F1F1]"
          >
            Cancel
          </button>
          <h2 className="text-lg font-semibold text-[#F1F1F1]">
            {alarm?.id ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button
            onClick={handleSave}
            className="text-[#34D399] font-semibold hover:text-[#10B981]"
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
            <h3 className="text-xs font-medium text-[#636363] uppercase tracking-wide mb-3">Difficulty</h3>
            <div className="space-y-2">
              {Object.entries(DIFFICULTY).map(([key, value]) => {
                const isSelected = difficulty === key;

                return (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#10B981]/30 bg-[#10B981]/10'
                        : 'border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#222222]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          isSelected ? 'text-[#34D399]' : 'text-[#F1F1F1]'
                        }`}>
                          {value.name}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-[#636363]">
                        Answer {value.questions} question{value.questions > 1 ? 's' : ''} to dismiss
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-[#10B981] bg-[#10B981]'
                        : 'border-[#222222]'
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
              className="w-full py-3 text-[#EF4444] font-medium hover:text-[#DC2626] transition-colors"
            >
              Delete Alarm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
