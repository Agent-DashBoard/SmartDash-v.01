import MetricDetailServer from "@/components/platform/metric-detail.server";
import { type DetailType } from "@/components/platform/metric-detail-types";
import { fetchLiveData } from "@/components/dashboard/live-data.server";

export default async function PerformancePage() {
  const live = await fetchLiveData();
  return <MetricDetailServer type={"performance" as DetailType} liveOverride={live} />;
}
