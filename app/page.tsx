import MainContent from "@/components/dashboard/main-content";
import { fetchLiveData } from "@/components/dashboard/live-data.server";
import { weeklyPerformance, aggregateTotal } from "@/components/dashboard/chart-data";

// Dashboard utama — SSR data asli Zernio (tanpa flicker mock).
// Data di-render server → HTML pertama sudah berisi angka asli (1.651, 45, 9),
// lalu client-side tetap refetch via useLiveData untuk update real-time.
// Pre-aggregate Content Performance di server (no hydration drift).
export const revalidate = 60;

export default async function DashboardPage() {
  const live = await fetchLiveData();
  const rawBuckets = weeklyPerformance(live.posts);
  const ssrAggregated = aggregateTotal(rawBuckets) ?? undefined;
  return <MainContent initialLive={live} ssrAggregated={ssrAggregated} />;
}
