import { AuthProvider } from "@/components/admin/AuthProvider";
import { AdminSidebar } from "@/components/admin/Sidebar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-polis-off-white">
        <AdminSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </AuthProvider>
  );
}
