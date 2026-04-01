import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhotographerId } from '@/hooks/usePhotographerId';
import { useToast } from '@/hooks/use-toast';
import { Search, MoreVertical, X, Loader2, User } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  notes: string;
}

const EMPTY_FORM: FormData = { name: '', email: '', whatsapp: '', notes: '' };
const PAGE_SIZE = 7;

const AdminClients = () => {
  const photographerId = usePhotographerId();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!photographerId) return;
    fetchClients();
  }, [photographerId]);

  const fetchClients = async () => {
    if (!photographerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('photographer_id', photographerId)
      .order('name');
    if (error) {
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' });
    } else {
      setClients((data || []) as Client[]);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email || '',
      whatsapp: client.whatsapp || '',
      notes: client.notes || '',
    });
    setOpenMenuIndex(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!photographerId || !form.name.trim()) return;
    setSaving(true);

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update({
          name: form.name.trim(),
          email: form.email.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq('id', editingClient.id);

      if (error) {
        toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' });
      } else {
        toast({ title: 'Cliente atualizado!' });
        setIsModalOpen(false);
        fetchClients();
      }
    } else {
      const { error } = await supabase.from('clients').insert({
        photographer_id: photographerId,
        name: form.name.trim(),
        email: form.email.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        notes: form.notes.trim() || null,
      });

      if (error) {
        toast({ title: 'Erro ao cadastrar cliente', variant: 'destructive' });
      } else {
        toast({ title: 'Cliente cadastrado!' });
        setIsModalOpen(false);
        fetchClients();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (client: Client) => {
    setOpenMenuIndex(null);
    const confirmed = window.confirm(
      `Remover "${client.name}"? Esta ação não pode ser desfeita e vai impedir a exclusão caso haja Jobs vinculados.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) {
      toast({ title: 'Erro ao remover cliente', description: 'Verifique se há Jobs vinculados a este cliente.', variant: 'destructive' });
    } else {
      toast({ title: 'Cliente removido.' });
      fetchClients();
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp?.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-modal-backdrop { animation: modalFadeIn 0.2s ease-out forwards; }
        .animate-modal-content { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">

        {/* Sub-header Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-[20px] font-bold text-zinc-900">Gestão de Clientes</h2>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Pesquisar por cliente ou detalhes do cliente"
                className="pl-10 pr-4 py-2 w-[380px] bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-700 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-5 py-2.5 font-medium text-[13px] shadow-sm hover:bg-black transition-colors"
            >
              + Novo Cliente
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-zinc-900 text-[13px] font-semibold border-b border-zinc-200">
                <th className="py-4 px-6 w-[25%]">Nome</th>
                <th className="py-4 px-6 w-[30%]">E-mail</th>
                <th className="py-4 px-6 w-[20%]">Telefone/WhatsApp</th>
                <th className="py-4 px-6 w-[15%]">Adicionado em</th>
                <th className="py-4 px-6 text-center w-[10%]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-zinc-400 mx-auto" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <User className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
                    <p className="text-zinc-500 text-[13px]">{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
                    {!search && (
                      <button onClick={openNew} className="mt-4 text-[13px] border border-zinc-200 rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-50 transition-colors">
                        Cadastrar primeiro cliente
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((client, index) => (
                  <tr key={client.id} className="bg-white hover:bg-zinc-50/50 transition-colors border-b border-zinc-100 last:border-0 relative">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[13px] font-semibold text-zinc-600 shrink-0">
                          {getInitial(client.name)}
                        </div>
                        <span className="text-[13px] text-zinc-900 font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-zinc-700">{client.email || '—'}</td>
                    <td className="py-4 px-6 text-[13px] text-zinc-700">{client.whatsapp || '—'}</td>
                    <td className="py-4 px-6 text-[13px] text-zinc-700">{formatDate(client.created_at)}</td>
                    <td className="py-4 px-6 text-center relative">
                      <button
                        className="text-zinc-400 hover:text-zinc-700 transition-colors outline-none p-1 rounded-md hover:bg-zinc-100"
                        onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                      >
                        <MoreVertical className="w-5 h-5 mx-auto" />
                      </button>

                      {openMenuIndex === index && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuIndex(null)}
                          />
                          <div className="absolute top-[50px] right-1/2 translate-x-1/2 w-32 bg-white border border-zinc-200 shadow-md rounded-lg z-50 flex flex-col py-1.5 overflow-hidden">
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-t border-l border-zinc-200 rotate-45" />
                            <button
                              onClick={() => openEdit(client)}
                              className="px-5 py-2 text-left text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 relative z-10 bg-white transition-colors"
                            >
                              Editar
                            </button>
                            <div className="h-px bg-zinc-100 my-1 relative z-10" />
                            <button
                              onClick={() => handleDelete(client)}
                              className="px-5 py-2 text-left text-[12px] font-medium text-red-600 hover:bg-red-50 relative z-10 bg-white transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-zinc-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 font-medium hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-medium transition-colors ${
                  p === currentPage
                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200/50'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 font-medium hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo →
            </button>
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Cliente */}
      {isModalOpen && (
        <div
          className="fixed inset-0 w-full h-full z-[9999] bg-zinc-900/60 flex items-center justify-center p-4 font-sans animate-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-[550px] rounded shadow-2xl flex flex-col animate-modal-content max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 shrink-0">
              <h2 className="text-[16px] font-bold text-zinc-900">
                {editingClient ? 'Editar cliente' : 'Criar novo cliente'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-all"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex flex-col gap-5 overflow-y-auto">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-900">
                  Nome <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ana Paula Silva"
                  autoFocus
                  className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-all"
                />
              </div>

              {/* E-mail */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-900">
                  E-mail <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ana@email.com"
                  className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-all"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-900">
                  Telefone / Whatsapp <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full h-[42px] px-4 border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-all"
                />
              </div>

              {/* Senha (apenas no cadastro) */}
              {!editingClient && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Senha</label>
                  <input
                    type="text"
                    disabled
                    placeholder="A senha será gerada automaticamente."
                    className="w-full h-[42px] px-4 border border-zinc-200 bg-zinc-50 rounded text-sm text-zinc-400 placeholder:text-zinc-400 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    As credenciais de acesso serão enviadas automaticamente para o e-mail do cliente após a criação.
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-900">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-zinc-200 bg-white rounded-b shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 px-5 py-2.5 rounded transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="bg-zinc-900 text-white text-sm font-bold px-6 py-2.5 rounded hover:bg-black transition-all shadow-lg shadow-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingClient ? 'Salvar' : 'Criar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminClients;
