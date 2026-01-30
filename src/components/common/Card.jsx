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

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const classes = [
    'bg-white dark:bg-gray-900 rounded-2xl',
    paddingClasses[padding],
    shadowClasses[shadow],
    border ? 'border border-gray-100 dark:border-gray-800' : '',
    onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
    className
  ].join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {(title || subtitle) && (
        <div className={padding !== 'none' ? 'mb-4' : 'p-4 pb-0'}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
