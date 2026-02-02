export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className = ''
}) {
  const sizes = {
    sm: { track: 'w-10 h-6', thumb: 'w-4 h-4', translate: 'translate-x-4' },
    md: { track: 'w-14 h-8', thumb: 'w-6 h-6', translate: 'translate-x-6' },
    lg: { track: 'w-16 h-9', thumb: 'w-7 h-7', translate: 'translate-x-7' }
  };

  const sizeConfig = sizes[size] || sizes.md;

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <span className="text-white font-medium">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-[#737373] mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-[#050505]
          ${sizeConfig.track}
          ${checked ? 'bg-red-600' : 'bg-[#262626]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${sizeConfig.thumb}
            ${checked ? sizeConfig.translate : 'translate-x-1'}
            mt-1 ml-0
          `}
          style={{ marginTop: size === 'sm' ? '4px' : size === 'lg' ? '4px' : '4px' }}
        />
      </button>
    </div>
  );
}
