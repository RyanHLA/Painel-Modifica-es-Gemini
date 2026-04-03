import { ReactNode, useState } from 'react';
import { Bell } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  pageTitle: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  accountStatus?: string | null;
}

const AdminLayout = ({ children, activeTab, pageTitle, onTabChange, onSignOut }: AdminLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onSignOut={onSignOut}
        isCollapsed={isCollapsed}
        onCollapsedChange={setIsCollapsed}
      />

      <div className={isCollapsed ? "ml-[88px] transition-all duration-300" : "ml-[280px] transition-all duration-300"}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-8 border-b border-[#F1F5F9]">
          <h2 className="font-sans text-xl text-slate-800">{pageTitle}</h2>
          <button className="relative w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center justify-center">
            <Bell className="w-5 h-5 text-zinc-600" />
            <span className="absolute top-1.5 right-2 w-[9px] h-[9px] bg-red-500 rounded-full border-[1.5px] border-white"></span>
          </button>
        </header>

        {/* Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
