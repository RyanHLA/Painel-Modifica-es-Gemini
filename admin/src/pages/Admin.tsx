import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminGalleryNew from '@/components/admin/AdminGalleryNew';
import AdminClientAlbums from '@/components/admin/AdminClientAlbums';
import AdminSettings from '@/components/admin/AdminSettings';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const { isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [checkoutBanner, setCheckoutBanner] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success' || checkout === 'cancel') {
      setCheckoutBanner(checkout);
      navigate('/admin', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('photographers')
        .select('id, account_status')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data: photographer }) => {
          setAccountStatus(photographer?.account_status ?? null);
          setStatusLoading(false);
        });
    });
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || (isAdmin && statusLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (accountStatus === 'suspended') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Conta Suspensa</h1>
            <p className="mt-3 text-sm text-slate-500">
              Sua conta está suspensa por falta de pagamento ou pelo encerramento do período de teste.
              Seus dados são mantidos por 30 dias após a suspensão.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Para reativar, acesse o painel de assinatura e regularize o pagamento.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setActiveTab('settings')}
            >
              Ver Planos
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'gallery': return 'Portfólio';
      case 'clients': return 'Clientes';
      case 'settings': return 'Configurações';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'gallery': return <AdminGalleryNew />;
      case 'clients': return <AdminClientAlbums />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      pageTitle={getPageTitle()}
      onTabChange={setActiveTab}
      onSignOut={handleSignOut}
      accountStatus={accountStatus}
    >
      {checkoutBanner === 'success' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Pagamento confirmado!</p>
            <p className="text-sm text-green-700">Sua assinatura foi ativada. Bem-vindo ao Fotux!</p>
          </div>
          <button onClick={() => setCheckoutBanner(null)} className="ml-auto text-green-500 hover:text-green-700 text-lg leading-none">&times;</button>
        </div>
      )}
      {checkoutBanner === 'cancel' && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pagamento cancelado</p>
            <p className="text-sm text-amber-700">Você pode assinar um plano a qualquer momento.</p>
          </div>
          <button onClick={() => setCheckoutBanner(null)} className="ml-auto text-amber-500 hover:text-amber-700 text-lg leading-none">&times;</button>
        </div>
      )}
      {renderContent()}
    </AdminLayout>
  );
};

export default Admin;
