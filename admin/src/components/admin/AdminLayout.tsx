import { ReactNode } from 'react';
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
  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onSignOut={onSignOut}
      />

      <div className="ml-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-8 border-b border-[#F1F5F9]">
          <h2 className="font-serif text-xl text-slate-800">{pageTitle}</h2>
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-serif font-bold text-sm">
            I
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
