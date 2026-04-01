import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhotographerId } from '@/hooks/usePhotographerId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Briefcase, Plus, Loader2, ChevronRight, FileText,
  CheckCircle2, Circle, Clock, Image, Send, Copy, Check
} from 'lucide-react';
import AdminJobDetail from './AdminJobDetail';

interface Client {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
}

interface Album {
  id: string;
  title: string;
  category: string;
}

interface Job {
  id: string;
  title: string;
  event_type: string | null;
  event_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  client_id: string;
  album_id: string | null;
  clients: Client | null;
  albums: { title: string; category: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:               { label: 'Rascunho',          color: 'bg-slate-100 text-slate-600' },
  contract_pending:    { label: 'Contrato pendente',  color: 'bg-amber-100 text-amber-700' },
  contract_signed:     { label: 'Contrato assinado',  color: 'bg-violet-100 text-violet-700' },
  gallery_active:      { label: 'Galeria ativa',      color: 'bg-blue-100 text-blue-700' },
  selection_received:  { label: 'Seleção recebida',   color: 'bg-emerald-100 text-emerald-700' },
  delivered:           { label: 'Entregue',           color: 'bg-green-100 text-green-700' },
};

const EVENT_TYPES = ['Casamento', 'Gestante', 'Família', 'Aniversário', 'Corporativo', 'Formatura', 'Outro'];

const AdminJobs = () => {
  const photographerId = usePhotographerId();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    event_type: '',
    event_date: '',
    notes: '',
  });

  useEffect(() => {
    if (!photographerId) return;
    fetchAll();
  }, [photographerId]);

  const fetchAll = async () => {
    if (!photographerId) return;
    setLoading(true);
    const [jobsRes, clientsRes, albumsRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, clients(id, name, email, whatsapp), albums(title, category)')
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, email, whatsapp').eq('photographer_id', photographerId).order('name'),
      supabase.from('albums').select('id, title, category').eq('photographer_id', photographerId).order('title'),
    ]);
    setJobs((jobsRes.data || []) as unknown as Job[]);
    setClients((clientsRes.data || []) as Client[]);
    setAlbums((albumsRes.data || []) as Album[]);
    setLoading(false);
  };

  const handleCreateJob = async () => {
    if (!photographerId || !form.client_id || !form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        photographer_id: photographerId,
        client_id: form.client_id,
        title: form.title.trim(),
        event_type: form.event_type || null,
        event_date: form.event_date || null,
        notes: form.notes.trim() || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar Job', variant: 'destructive' });
    } else {
      toast({ title: 'Job criado!' });
      setIsNewJobOpen(false);
      setForm({ client_id: '', title: '', event_type: '', event_date: '', notes: '' });
      await fetchAll();
      // Abre o job recém criado
      setSelectedJobId(data.id);
    }
    setSaving(false);
  };

  // Se um job está selecionado, mostra o detalhe
  if (selectedJobId) {
    return (
      <AdminJobDetail
        jobId={selectedJobId}
        onBack={() => { setSelectedJobId(null); fetchAll(); }}
      />
    );
  }

  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [s, jobs.filter((j) => j.status === s).length])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-slate-800">Jobs</h2>
          <p className="mt-1 text-sm text-slate-500">{jobs.length} atendimento{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => {
            if (clients.length === 0) {
              toast({ title: 'Cadastre um cliente primeiro', description: 'Acesse a seção Clientes para adicionar.', variant: 'destructive' });
              return;
            }
            setIsNewJobOpen(true);
          }}
          className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Job
        </Button>
      </div>

      {/* Resumo de status */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="rounded-xl bg-white p-3 shadow-sm text-center">
            <p className="text-xl font-light text-slate-700">{statusCounts[key] || 0}</p>
            <p className="mt-0.5 text-xs text-slate-400 leading-tight">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="rounded-xl bg-white shadow-sm divide-y divide-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="text-slate-500">Nenhum Job criado ainda.</p>
            <p className="text-sm text-slate-400 mt-1">Crie um Job para iniciar o fluxo de atendimento.</p>
          </div>
        ) : (
          jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
            return (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{job.title}</p>
                    <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {job.clients?.name}
                    {job.event_type && ` · ${job.event_type}`}
                    {job.event_date && ` · ${new Date(job.event_date).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {/* Dialog novo job */}
      <Dialog open={isNewJobOpen} onOpenChange={setIsNewJobOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Novo Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título do Job *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Casamento Ana & Pedro"
                className="rounded-xl border-slate-200"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de Ensaio</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Evento</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Detalhes adicionais..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsNewJobOpen(false)} className="flex-1 rounded-xl border-slate-200">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateJob}
                disabled={saving || !form.client_id || !form.title.trim()}
                className="flex-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
