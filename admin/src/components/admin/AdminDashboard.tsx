import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Images, FolderOpen, Eye, TrendingUp, Plus, ArrowUpRight, Calendar } from 'lucide-react';
import { Button } from '../ui/button';

interface Stats {
  totalAlbums: number;
  totalPhotos: number;
  publishedAlbums: number;
  categories: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalAlbums: 0,
    totalPhotos: 0,
    publishedAlbums: 0,
    categories: 6,
  });
  const [recentAlbums, setRecentAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [photographerName, setPhotographerName] = useState<string>('fotógrafo');

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca dados do fotógrafo logado (filtra pelo user_id da sessão)
      const { data: photographer } = await supabase
        .from('photographers')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!photographer) return;

      setPhotographerName(photographer.name);

      // Busca álbuns e fotos filtrados pelo photographer_id — RLS garante isolamento
      const [albumsRes, photosRes] = await Promise.all([
        supabase
          .from('albums')
          .select('id, title, category, status, cover_image_url, created_at, photographer_id')
          .eq('photographer_id', photographer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('site_images')
          .select('id')
          .eq('photographer_id', photographer.id),
      ]);

      const albums = albumsRes.data ?? [];
      setStats({
        totalAlbums: albums.length,
        totalPhotos: photosRes.data?.length ?? 0,
        publishedAlbums: albums.filter(a => a.status === 'published').length,
        categories: 6,
      });
      setRecentAlbums(albums.slice(0, 5));
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total de Álbuns',
      value: stats.totalAlbums,
      icon: FolderOpen,
      trend: '+2 esse mês', // Exemplo estático, pode dinamizar depois
    },
    {
      title: 'Fotos no Site',
      value: stats.totalPhotos,
      icon: Images,
      trend: 'Atualizado hoje',
    },
    {
      title: 'Publicados',
      value: stats.publishedAlbums,
      icon: Eye,
      trend: 'Visíveis no site',
    },
    {
      title: 'Categorias',
      value: stats.categories,
      icon: TrendingUp,
      trend: 'Seções ativas',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section - Mais Premium */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-medium text-slate-900">
            Bem-vindo(a), {photographerName}.
          </h2>
          <p className="mt-1 text-slate-500">
            Aqui está o panorama do seu portfólio hoje.
          </p>
        </div>
        <div className="flex gap-3">
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Plus className="mr-2 h-4 w-4" /> Novo Álbum
            </Button>
        </div>
      </div>

      {/* Stats Grid - Design Limpo e Unificado */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-indigo-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="mt-2 font-serif text-3xl font-medium text-slate-800">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Albums & Quick Actions */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main List */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl text-slate-800">Álbuns Recentes</h3>
            <span className="text-sm font-medium text-indigo-500 flex items-center gap-1">
              Ver todos <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          
          {recentAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FolderOpen className="h-10 w-10 mb-3 opacity-20" />
                <p>Nenhum álbum criado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlbums.map((album) => (
                <div key={album.id} className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all hover:bg-slate-50 hover:border-slate-100">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 shadow-sm relative">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Images className="h-6 w-6 text-slate-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-800 truncate">{album.title}</h4>
                        {album.status === 'published' && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(album.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{album.category || 'Sem categoria'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        album.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {album.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel / Dicas ou Status Rápido */}
        <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-[#1E293B] to-slate-700 p-6 text-white shadow-lg">
                <h3 className="font-serif text-lg mb-2">Dica Pro</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Mantenha suas galerias atualizadas. Álbuns com mais de 20 fotos tendem a reter clientes por 40% mais tempo.
                </p>
                <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 w-2/3"></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Meta de uploads mensal</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;