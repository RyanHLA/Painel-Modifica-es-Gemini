import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhotographerId } from '@/hooks/usePhotographerId';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Loader2, FileText, Image, CheckCircle2, Circle,
  ExternalLink, Copy, Check, Send, Eye, AlertCircle
} from 'lucide-react';

interface JobDetail {
  id: string;
  title: string;
  event_type: string | null;
  event_date: string | null;
  status: string;
  notes: string | null;
  album_id: string | null;
  client_id: string;
  clients: {
    name: string;
    email: string | null;
    whatsapp: string | null;
  } | null;
  albums: {
    id: string;
    title: string;
    category: string;
    client_enabled: boolean;
    client_submitted_at: string | null;
  } | null;
}

interface Contract {
  id: string;
  body_html: string;
  signed_at: string | null;
  client_name: string | null;
}

interface Album {
  id: string;
  title: string;
  category: string;
}

interface Selection {
  id: string;
  image_id: string;
  site_images: { image_url: string; title: string | null } | null;
}

const STATUS_STEPS = [
  { key: 'draft',              label: 'Rascunho' },
  { key: 'contract_pending',   label: 'Contrato enviado' },
  { key: 'contract_signed',    label: 'Contrato assinado' },
  { key: 'gallery_active',     label: 'Galeria ativa' },
  { key: 'selection_received', label: 'Seleção recebida' },
  { key: 'delivered',          label: 'Entregue' },
];

const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]));

interface Props {
  jobId: string;
  onBack: () => void;
}

const AdminJobDetail = ({ jobId, onBack }: Props) => {
  const photographerId = usePhotographerId();
  const { toast } = useToast();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contrato' | 'galeria' | 'selecao'>('contrato');

  // estados locais de edição
  const [contractBody, setContractBody] = useState('');
  const [savingContract, setSavingContract] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photographerSlug, setPhotographerSlug] = useState('');

  useEffect(() => {
    if (!photographerId) return;
    fetchAll();
    supabase.from('photographers').select('slug').eq('id', photographerId).single()
      .then(({ data }) => { if (data) setPhotographerSlug(data.slug); });
  }, [jobId, photographerId]);

  const fetchAll = async () => {
    setLoading(true);
    const [jobRes, albumsRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, clients(name, email, whatsapp), albums(id, title, category, client_enabled, client_submitted_at)')
        .eq('id', jobId)
        .single(),
      supabase.from('albums').select('id, title, category').eq('photographer_id', photographerId!).order('title'),
    ]);

    const jobData = jobRes.data as unknown as JobDetail;
    setJob(jobData);
    setAlbums((albumsRes.data || []) as Album[]);
    setSelectedAlbumId(jobData?.album_id || '');

    // Busca contrato do job (por job_id ou album_id)
    if (jobData) {
      const { data: contractData } = await supabase
        .from('contracts')
        .select('id, body_html, signed_at, client_name')
        .eq('album_id', jobData.album_id || '')
        .maybeSingle();
      setContract(contractData as Contract | null);
      setContractBody(contractData?.body_html?.replace(/<br\/>/g, '\n') || '');

      // Busca seleções se houver álbum
      if (jobData.album_id && jobData.albums?.client_submitted_at) {
        const { data: sel } = await supabase
          .from('client_selections')
          .select('id, image_id, site_images(image_url, title)')
          .eq('album_id', jobData.album_id);
        setSelections((sel || []) as unknown as Selection[]);
      }
    }
    setLoading(false);
  };

  const updateJobStatus = async (status: string) => {
    await supabase.from('jobs').update({ status }).eq('id', jobId);
    setJob((prev) => prev ? { ...prev, status } : prev);
  };

  const handleLinkAlbum = async () => {
    if (!selectedAlbumId) return;
    setSavingAlbum(true);
    await supabase.from('jobs').update({ album_id: selectedAlbumId, status: 'gallery_active' }).eq('id', jobId);
    await supabase.from('albums').update({ client_enabled: true }).eq('id', selectedAlbumId);
    toast({ title: 'Álbum vinculado! Galeria ativada.' });
    await fetchAll();
    setSavingAlbum(false);
  };

  const handleSaveContract = async () => {
    if (!job || !contractBody.trim()) return;
    if (!job.album_id) {
      toast({ title: 'Vincule um álbum antes de criar o contrato.', variant: 'destructive' });
      return;
    }
    setSavingContract(true);

    const bodyHtml = contractBody.replace(/\n/g, '<br/>');

    if (contract) {
      await supabase.from('contracts').update({ body_html: bodyHtml }).eq('id', contract.id);
    } else {
      await supabase.from('contracts').insert({
        album_id: job.album_id,
        photographer_id: photographerId!,
        body_html: bodyHtml,
      });
    }

    await updateJobStatus('contract_pending');
    await fetchAll();
    setSavingContract(false);
    toast({ title: 'Contrato salvo! Status atualizado para "Contrato enviado".' });
  };

  const copyContractLink = async () => {
    if (!job?.album_id || !photographerSlug) return;
    const url = `${window.location.origin}/p/${photographerSlug}/${job.album_id}/contrato`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  const currentStepIndex = STATUS_INDEX[job.status] ?? 0;
  const contractLink = job.album_id && photographerSlug
    ? `${window.location.origin}/p/${photographerSlug}/${job.album_id}/contrato`
    : null;
  const galleryLink = job.album_id && photographerSlug
    ? `${window.location.origin}/p/${photographerSlug}/${job.album_id}`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 hover:text-slate-700 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Jobs
        </Button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{job.title}</span>
      </div>

      {/* Header do Job */}
      <div className="rounded-xl bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-slate-800">{job.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {job.clients?.name}
              {job.event_type && ` · ${job.event_type}`}
              {job.event_date && ` · ${new Date(job.event_date).toLocaleDateString('pt-BR')}`}
            </p>
            {job.clients?.email && <p className="text-xs text-slate-400 mt-0.5">{job.clients.email}</p>}
            {job.clients?.whatsapp && <p className="text-xs text-slate-400">{job.clients.whatsapp}</p>}
          </div>
        </div>

        {/* Linha do tempo de status */}
        <div className="mt-6 flex items-center gap-0 overflow-x-auto pb-1">
          {STATUS_STEPS.map((step, i) => {
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    done    ? 'bg-emerald-500 border-emerald-500 text-white' :
                    active  ? 'bg-indigo-600 border-indigo-600 text-white' :
                              'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs font-medium">{i + 1}</span>}
                  </div>
                  <span className={`text-xs text-center leading-tight ${active ? 'text-indigo-600 font-medium' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 mb-5 mx-1 flex-shrink-0 ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['contrato', 'galeria', 'selecao'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'contrato' ? 'Contrato' : tab === 'galeria' ? 'Álbum & Galeria' : 'Seleção'}
          </button>
        ))}
      </div>

      {/* Aba: Contrato */}
      {activeTab === 'contrato' && (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-800">Contrato Digital</h3>
            {contract?.signed_at && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                Assinado por {contract.client_name}
              </Badge>
            )}
            {contract && !contract.signed_at && (
              <Badge className="bg-amber-100 text-amber-700 border-0">Aguardando assinatura</Badge>
            )}
          </div>

          {!job.album_id && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Vincule um álbum na aba "Álbum & Galeria" antes de criar o contrato.
            </div>
          )}

          <div className="space-y-2">
            <Label>Texto do contrato</Label>
            <textarea
              value={contractBody}
              onChange={(e) => setContractBody(e.target.value)}
              placeholder={`CONTRATO DE SERVIÇOS FOTOGRÁFICOS\n\nPelo presente instrumento, o fotógrafo compromete-se a prestar os seguintes serviços...\n\nVariáveis disponíveis: use o nome do cliente que será digitado no momento da assinatura.`}
              rows={12}
              disabled={!!contract?.signed_at || !job.album_id}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleSaveContract}
              disabled={savingContract || !!contract?.signed_at || !job.album_id || !contractBody.trim()}
              className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
            >
              {savingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {contract ? 'Atualizar Contrato' : 'Salvar e Ativar Contrato'}
            </Button>

            {contractLink && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={copyContractLink}
                  className="border-slate-200 gap-2"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  Copiar link do contrato
                </Button>
                <a href={contractLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
          </div>

          {contractLink && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Link para o cliente assinar:</p>
              <p className="text-sm text-indigo-600 break-all">{contractLink}</p>
            </div>
          )}
        </div>
      )}

      {/* Aba: Álbum & Galeria */}
      {activeTab === 'galeria' && (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-5">
          <h3 className="font-medium text-slate-800">Álbum de Fotos</h3>

          <div className="space-y-2">
            <Label>Vincular álbum existente</Label>
            <div className="flex gap-3">
              <Select
                value={selectedAlbumId}
                onValueChange={setSelectedAlbumId}
                disabled={!!job.album_id}
              >
                <SelectTrigger className="rounded-xl border-slate-200 flex-1">
                  <SelectValue placeholder="Selecione o álbum de fotos deste Job" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} <span className="text-slate-400 text-xs">· {a.category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleLinkAlbum}
                disabled={savingAlbum || !selectedAlbumId || !!job.album_id}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {savingAlbum ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vincular'}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              O álbum deve ser criado primeiro em <strong>Portfólio</strong> com as fotos já carregadas.
            </p>
          </div>

          {job.albums && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{job.albums.title}</p>
                  <p className="text-sm text-slate-400 capitalize">{job.albums.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.albums.client_submitted_at ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Seleção enviada</Badge>
                  ) : job.albums.client_enabled ? (
                    <Badge className="bg-blue-100 text-blue-700 border-0">Galeria ativa</Badge>
                  ) : null}
                </div>
              </div>

              {galleryLink && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-400">Link da galeria para o cliente:</p>
                    <p className="text-sm text-indigo-600 truncate">{galleryLink}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(galleryLink);
                      toast({ title: 'Link copiado!' });
                    }}
                    className="border-slate-200 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aba: Seleção */}
      {activeTab === 'selecao' && (
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
          <h3 className="font-medium text-slate-800">Fotos Selecionadas pelo Cliente</h3>

          {!job.albums?.client_submitted_at ? (
            <div className="py-12 text-center">
              <Circle className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-slate-500">O cliente ainda não finalizou a seleção.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Seleção recebida — {selections.length} foto{selections.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-xs text-emerald-600">
                  {new Date(job.albums.client_submitted_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 max-h-[60vh] overflow-y-auto">
                {selections.map((s) => (
                  <div key={s.id} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                    {s.site_images?.image_url && (
                      <img
                        src={s.site_images.image_url}
                        alt={s.site_images.title || ''}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminJobDetail;
