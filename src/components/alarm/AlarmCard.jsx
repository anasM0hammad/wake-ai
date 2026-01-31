import { formatTimeDisplay, getNextAlarmDate, getTimeUntilAlarm } from '../../utils/timeUtils';
import { DIFFICULTY } from '../../utils/constants';

export default function AlarmCard({
  alarm,
  onToggle,
  onEdit,
  onDelete
}) {
  const nextAlarmDate = getNextAlarmDate(alarm.time);
  const timeUntil = getTimeUntilAlarm(nextAlarmDate);
  const difficultyInfo = DIFFICULTY[alarm.difficulty] || DIFFICULTY.EASY;

  return (
    <div className="bg-[#171717] rounded-2xl p-4 border border-[#262626]">
      {/* Card content */}
      <div
        className="cursor-pointer"
        onClick={() => onEdit?.(alarm)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Time */}
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tight ${
                alarm.enabled ? 'text-white' : 'text-neutral-500'
              }`}>
                {formatTimeDisplay(alarm.time, false)}
              </span>
            </div>

            {/* One-time indicator */}
            <p className={`text-sm mt-1 ${
              alarm.enabled ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              One time
            </p>

            {/* Time until & difficulty */}
            <div className="flex items-center gap-3 mt-2">
              {alarm.enabled && (
                <span className="text-xs text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded-full">
                  in {timeUntil}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                alarm.enabled
                  ? 'text-neutral-300 bg-[#262626]'
                  : 'text-neutral-500 bg-[#262626]'
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
                onToggle?.(alarm.id);
              }}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                alarm.enabled ? 'bg-indigo-600' : 'bg-[#404040]'
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
      </div>

      {/* Delete button */}
      <div className="mt-4 pt-4 border-t border-[#262626]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(alarm.id);
          }}
          className="w-full py-2 text-red-400 font-medium hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Alarm
        </button>
      </div>
    </div>
  );
}
