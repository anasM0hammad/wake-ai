const variants = {
  primary: 'bg-[#10B981] text-white hover:bg-[#059669] active:bg-[#047857] disabled:bg-[#064E3B] disabled:opacity-50 shadow-lg shadow-[#10B981]/20',
  secondary: 'bg-[#161616] text-[#F1F1F1] hover:bg-[#1A1A1A] active:bg-[#222222] border border-[#222222]',
  danger: 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 active:bg-[#EF4444]/30 border border-[#EF4444]/20',
  success: 'bg-[#22C55E] text-white hover:bg-[#16A34A] active:bg-[#15803D] disabled:bg-[#15803D] disabled:opacity-50',
  ghost: 'bg-transparent text-[#636363] hover:bg-[#161616] hover:text-[#F1F1F1]',
  outline: 'bg-transparent border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10',
  premium: 'bg-gradient-to-r from-[#D4A053] to-[#C08B3F] text-white hover:from-[#C08B3F] hover:to-[#B07A35] shadow-lg shadow-[#D4A053]/20'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
  xl: 'px-8 py-4 text-xl'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:ring-offset-[#050505] disabled:cursor-not-allowed';

  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
}
