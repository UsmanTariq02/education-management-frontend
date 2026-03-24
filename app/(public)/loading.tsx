import { AppLoader } from "@/components/feedback/app-loader";

export default function PublicLoading() {
  return (
    <AppLoader
      compact
      title="Loading experience"
      description="Preparing the education SaaS landing pages and authentication flow."
      className="min-h-[calc(100vh-4rem)]"
    />
  );
}
