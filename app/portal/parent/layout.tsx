import { PortalAuthGuard } from "@/components/layout/portal-auth-guard";
import { PortalShell } from "@/features/portal/components/portal-shell";

export default function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGuard accountType="PARENT">
      <PortalShell variant="parent">{children}</PortalShell>
    </PortalAuthGuard>
  );
}
