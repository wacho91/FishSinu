export default function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-600">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
