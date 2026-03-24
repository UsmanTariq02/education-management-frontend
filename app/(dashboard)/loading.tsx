import { AppLoader } from "@/components/feedback/app-loader";

export default function DashboardLoading() {
  return (
    <AppLoader
      compact
      title="Loading dashboard"
      description="Fetching live tables, charts, permissions, and module context for the secure workspace."
      className="min-h-[calc(100vh-5rem)] bg-background"
    />
  );
}
