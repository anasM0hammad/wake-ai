import { useState, useEffect, useRef } from 'react';

export default function TimePicker({ value, onChange, className = '' }) {
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [isPM, setIsPM] = useState(false);

  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const hour12 = h % 12 || 12;
      setHours(hour12);
      setMinutes(m);
      setIsPM(h >= 12);
    }
  }, []);

  // Emit change in 24-hour format
  useEffect(() => {
    let hour24 = hours;
    if (isPM && hours !== 12) {
      hour24 = hours + 12;
    } else if (!isPM && hours === 12) {
      hour24 = 0;
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange?.(timeString);
  }, [hours, minutes, isPM, onChange]);

  const handleScroll = (ref, items, setter, currentValue) => {
    const container = ref.current;
    if (!container) return;

    const itemHeight = 56; // h-14 = 56px
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = items[Math.min(index, items.length - 1)];

    if (newValue !== currentValue) {
      setter(newValue);
    }
  };

  const scrollToValue = (ref, items, value) => {
    const container = ref.current;
    if (!container) return;

    const index = items.indexOf(value);
    if (index !== -1) {
      const itemHeight = 56;
      container.scrollTop = index * itemHeight;
    }
  };

  // Initialize scroll positions
  useEffect(() => {
    const hourItems = Array.from({ length: 12 }, (_, i) => i + 1);
    const minuteItems = Array.from({ length: 12 }, (_, i) => i * 5);

    setTimeout(() => {
      scrollToValue(hoursRef, hourItems, hours);
      scrollToValue(minutesRef, minuteItems, minutes);
    }, 100);
  }, []);

  const hourItems = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteItems = Array.from({ length: 12 }, (_, i) => i * 5);

  const renderScrollColumn = (items, value, setter, ref, formatFn = (v) => v.toString().padStart(2, '0')) => (
    <div
      ref={ref}
      className="h-[168px] overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      onScroll={() => handleScroll(ref, items, setter, value)}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="h-14" /> {/* Spacer */}
      {items.map((item) => (
        <div
          key={item}
          className={`h-14 flex items-center justify-center snap-center cursor-pointer transition-all ${
            item === value
              ? 'text-4xl font-bold text-indigo-400'
              : 'text-2xl text-neutral-500'
          }`}
          onClick={() => {
            setter(item);
            scrollToValue(ref, items, item);
          }}
        >
          {formatFn(item)}
        </div>
      ))}
      <div className="h-14" /> {/* Spacer */}
    </div>
  );

  return (
    <div className={`bg-[#171717] rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-center gap-2">
        {/* Hours */}
        <div className="w-20 bg-[#262626] rounded-xl overflow-hidden">
          {renderScrollColumn(hourItems, hours, setHours, hoursRef, (v) => v.toString())}
        </div>

        {/* Separator */}
        <div className="text-4xl font-bold text-neutral-500">:</div>

        {/* Minutes */}
        <div className="w-20 bg-[#262626] rounded-xl overflow-hidden">
          {renderScrollColumn(minuteItems, minutes, setMinutes, minutesRef)}
        </div>

        {/* AM/PM */}
        <div className="flex flex-col gap-2 ml-2">
          <button
            onClick={() => setIsPM(false)}
            className={`px-4 py-3 rounded-xl font-semibold text-lg transition-all ${
              !isPM
                ? 'bg-indigo-600 text-white'
                : 'bg-[#262626] text-neutral-500 hover:bg-[#333333]'
            }`}
          >
            AM
          </button>
          <button
            onClick={() => setIsPM(true)}
            className={`px-4 py-3 rounded-xl font-semibold text-lg transition-all ${
              isPM
                ? 'bg-indigo-600 text-white'
                : 'bg-[#262626] text-neutral-500 hover:bg-[#333333]'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Quick time display */}
      <div className="mt-4 text-center">
        <span className="text-sm text-neutral-500">
          {hours}:{minutes.toString().padStart(2, '0')} {isPM ? 'PM' : 'AM'}
        </span>
      </div>
    </div>
  );
}
