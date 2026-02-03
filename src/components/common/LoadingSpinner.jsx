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
    primary: 'border-[#222222] border-t-[#10B981]',
    white: 'border-white/30 border-t-white',
    gray: 'border-[#222222] border-t-[#636363]'
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
        <p className={`mt-3 text-sm ${color === 'white' ? 'text-white' : 'text-[#636363]'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
