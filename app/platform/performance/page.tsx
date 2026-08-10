import MetricDetailServer from "@/components/platform/metric-detail.server";
import { type DetailType } from "@/components/platform/metric-detail-types";
import { fetchLiveData } from "@/components/dashboard/live-data.server";
import { weeklyPerformance, aggregateTotal } from "@/components/dashboard/chart-data";

export default async function PerformancePage() {
  // Pre-aggregate di server biar SSR & client dapet value sama persis (no hydration drift).
  const live = await fetchLiveData();
  const rawBuckets = live ? weeklyPerformance(live.posts) : null;
  const ssrAggregated = aggregateTotal(rawBuckets);
  return (
    <MetricDetailServer
      type={"performance" as DetailType}
      ssrAggregated={ssrAggregated ?? undefined}
    />
  );
}
