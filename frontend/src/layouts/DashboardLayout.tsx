import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The reference UI uses a compact icon rail; users can expand it from the gold toggle.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="dashboard-shell flex min-h-screen" dir="rtl">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden" dir="rtl">
          <div className="dashboard-content p-4 sm:p-6 lg:p-8 lg:pt-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
