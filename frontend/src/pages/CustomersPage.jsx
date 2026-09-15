import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import Pagination from '../components/ui/Pagination'; // <-- Importamos la paginación
import { useCatalogStore } from '../stores/useCatalogStore';
import { formatCurrency } from '../lib/formatters'; // <-- Importamos el formato COP

export default function CustomersPage() {
  const {
    customers,
    creditAccounts,
    loading,
    fetchCustomers,
    fetchCreditAccounts,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCatalogStore();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // === ESTADOS DE PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // ==============================

  useEffect(() => {
    fetchCustomers().catch(() => {});
    fetchCreditAccounts().catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.tax_id.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Resetear página a 1 cuando se busca
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // === LÓGICA DE PAGINACIÓN ===
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentCustomers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  // ==============================

  const getCreditAccount = (customerId) =>
    creditAccounts.find((ca) => ca.customer_id === customerId);

  const handleSubmit = async (payload) => {
    try {
      if (editing) await updateCustomer(editing.id, payload);
      else await createCustomer(payload);
      setOpen(false);
      setEditing(null);
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: `Cliente ${editing ? 'actualizado' : 'creado'} correctamente.`,
        confirmButtonColor: '#0d9488',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.userMessage || err.message || 'Ocurrió un error al guardar.',
        confirmButtonColor: '#0d9488'
      });
    }
  };

  const handleDelete = async (customer) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar al cliente "${customer.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCustomer(customer.id);
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El cliente ha sido eliminado.',
            confirmButtonColor: '#0d9488',
            timer: 1500
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Restricción de ERP',
            text: 'No se puede eliminar el cliente porque tiene ventas o créditos asociados.',
            confirmButtonColor: '#0d9488'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-sm text-slate-500">Clientes minoristas y mayoristas.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Nuevo cliente
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-3">
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Crédito</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Usamos currentCustomers en vez de filtered */}
              {currentCustomers.map((c) => {
                const credit = getCreditAccount(c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400">{c.document_type}</span>{' '}
                      {c.tax_id}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.phone || c.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_active ? (
                        <Badge color="green">Activo</Badge>
                      ) : (
                        <Badge color="red">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {credit ? (
                        <div>
                          <span className="text-xs text-slate-400">Saldo: </span>
                          {/* Formato COP aplicado aquí */}
                          <span className="font-medium">{formatCurrency(credit.balance)}</span>
                          <span className="text-xs text-slate-400"> / {formatCurrency(credit.credit_limit)}</span>
                        </div>
                      ) : (
                        <Badge color="slate">Sin crédito</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-1"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {currentCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Componente de Paginación */}
        <div className="p-4 border-t border-slate-100">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Card>

      <CustomerFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}