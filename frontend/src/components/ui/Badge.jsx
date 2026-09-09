const colors = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
  slate: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, color = 'slate' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.slate}`}
    >
      {children}
    </span>
  );
}
