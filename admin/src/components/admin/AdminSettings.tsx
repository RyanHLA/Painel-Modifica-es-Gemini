import { Globe, Palette, Bell } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-slate-800">Configurações</h2>
        <p className="mt-1 text-slate-500">Gerencie as configurações da sua conta.</p>
      </div>

      <div className="space-y-6">

        {/* General */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Globe className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">Configurações Gerais</h3>
              <p className="text-sm text-slate-500">Nome do site, descrição e informações básicas</p>
            </div>
          </div>
          <div className="mt-6 text-center text-slate-400">Em breve</div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">Aparência</h3>
              <p className="text-sm text-slate-500">Cores, fontes e estilo visual</p>
            </div>
          </div>
          <div className="mt-6 text-center text-slate-400">Em breve</div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-800">Notificações</h3>
              <p className="text-sm text-slate-500">E-mails e alertas do sistema</p>
            </div>
          </div>
          <div className="mt-6 text-center text-slate-400">Em breve</div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
