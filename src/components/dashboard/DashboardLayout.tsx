import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";
import { TenantProvider, useTenant } from "@/lib/tenant";
import { CustomModeProvider } from "@/lib/custom-mode";

function DashboardLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { tenantId } = useTenant();

  return (
    <div className="min-h-screen bg-background">
      {/* Background noise texture */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Topbar
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div
          key={tenantId || "preview"}
          className="p-4 lg:p-6 animate-fade-up"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <TenantProvider>
      <CustomModeProvider>
        <DashboardLayoutContent />
      </CustomModeProvider>
    </TenantProvider>
  );
}
