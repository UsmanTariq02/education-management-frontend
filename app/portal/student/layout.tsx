import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalShell } from "@/features/portal/components/portal-shell";

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGuard accountType="STUDENT">
      <PortalShell variant="student">{children}</PortalShell>
    </PortalAuthGuard>
  );
}
