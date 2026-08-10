import MainContent from "@/components/dashboard/main-content";
import { fetchLiveData } from "@/components/dashboard/live-data.server";

// Dashboard utama — SSR data asli Zernio (tanpa flicker mock).
// Data di-render server → HTML pertama sudah berisi angka asli (1.651, 45, 9),
// lalu client-side tetap refetch via useLiveData untuk update real-time.
export const revalidate = 60;

export default async function DashboardPage() {
  const live = await fetchLiveData();
  return <MainContent initialLive={live} />;
}
