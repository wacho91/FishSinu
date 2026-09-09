export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const variants = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500',
    secondary:
      'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-400',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-400',
    outline:
      'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300 bg-white',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
