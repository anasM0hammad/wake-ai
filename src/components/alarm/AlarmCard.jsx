import { useState } from 'react';
import { formatTimeDisplay, getNextAlarmDate, getTimeUntilAlarm } from '../../utils/timeUtils';
import { DIFFICULTY } from '../../utils/constants';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AlarmCard({
  alarm,
  onToggle,
  onEdit,
  onDelete
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const nextAlarmDate = getNextAlarmDate(alarm.time, alarm.days);
  const timeUntil = getTimeUntilAlarm(nextAlarmDate);
  const difficultyInfo = DIFFICULTY[alarm.difficulty] || DIFFICULTY.EASY;

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;

    const currentX = e.touches[0].clientX;
    const diff = touchStart - currentX;

    if (diff > 50) {
      setShowDelete(true);
    } else if (diff < -50) {
      setShowDelete(false);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const formatDays = (days) => {
    if (!days || days.length === 0) {
      return 'One time';
    }
    if (days.length === 7) {
      return 'Every day';
    }
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
      return 'Weekdays';
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return 'Weekends';
    }
    return days.map(d => DAY_LABELS[d]).join(', ');
  };

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete button (revealed on swipe) */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-transform ${
          showDelete ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          onClick={() => {
            onDelete?.(alarm.id);
            setShowDelete(false);
          }}
          className="p-3"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Card content */}
      <div
        className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
          showDelete ? '-translate-x-20' : 'translate-x-0'
        } ${
          alarm.enabled
            ? 'border-gray-100'
            : 'border-gray-200 bg-gray-50'
        }`}
        onClick={() => !showDelete && onEdit?.(alarm)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Time */}
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tight ${
                alarm.enabled ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {formatTimeDisplay(alarm.time, false)}
              </span>
            </div>

            {/* Days */}
            <p className={`text-sm mt-1 ${
              alarm.enabled ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {formatDays(alarm.days)}
            </p>

            {/* Time until & difficulty */}
            <div className="flex items-center gap-3 mt-2">
              {alarm.enabled && (
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  in {timeUntil}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                alarm.enabled
                  ? 'text-gray-600 bg-gray-100'
                  : 'text-gray-400 bg-gray-100'
              }`}>
                {difficultyInfo.name} ({difficultyInfo.questions}Q)
              </span>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(false);
                onToggle?.(alarm.id);
              }}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                alarm.enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  alarm.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Day indicators */}
        {alarm.days && alarm.days.length > 0 && alarm.days.length < 7 && (
          <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
            {DAY_LABELS.map((day, index) => (
              <span
                key={day}
                className={`flex-1 text-center text-xs py-1 rounded ${
                  alarm.days.includes(index)
                    ? alarm.enabled
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'bg-gray-200 text-gray-500'
                    : 'text-gray-300'
                }`}
              >
                {day[0]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button for non-touch devices */}
      {!showDelete && (
        <button
          onClick={() => onDelete?.(alarm.id)}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
