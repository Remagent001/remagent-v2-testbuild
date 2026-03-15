"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/App/Sidebar";
import Topbar from "@/components/App/Topbar";
import MsaBanner from "@/components/App/MsaBanner";
import "../app.css";

function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Login and register get their own full-screen layout
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  const user = session?.user || null;
  const role = user?.role?.toLowerCase() || "professional";

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        user={user}
      />

      <div className="app-main">
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        {role === "business" && <MsaBanner />}
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
