export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        onClick={() => onPageChange(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
      >
        ← Anterior
      </button>
      <span className="text-sm font-bold bg-teal-50 text-teal-700 px-4 py-2 rounded-lg">
        Página {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
      >
        Siguiente →
      </button>
    </div>
  );
}