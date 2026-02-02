export default function Card({
  children,
  title,
  subtitle,
  padding = 'md',
  shadow = 'sm',
  border = true,
  className = '',
  onClick,
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const classes = [
    'bg-[#0C0C0C] rounded-2xl',
    paddingClasses[padding],
    border ? 'border border-[#1F1F1F]' : '',
    onClick ? 'cursor-pointer hover:bg-[#141414] transition-colors' : '',
    className
  ].join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {(title || subtitle) && (
        <div className={padding !== 'none' ? 'mb-4' : 'p-4 pb-0'}>
          {title && (
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[#737373] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
