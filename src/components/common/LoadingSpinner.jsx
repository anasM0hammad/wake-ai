export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  text,
  className = ''
}) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const colors = {
    primary: 'border-primary-200 border-t-primary-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          rounded-full animate-spin
          ${sizes[size]}
          ${colors[color]}
        `}
      />
      {text && (
        <p className={`mt-3 text-sm ${color === 'white' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
