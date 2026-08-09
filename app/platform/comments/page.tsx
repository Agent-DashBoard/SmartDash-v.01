import MetricDetailServer from "@/components/platform/metric-detail.server";
import { type DetailType } from "@/components/platform/metric-detail-types";

export default async function CommentsPage() {
  return <MetricDetailServer type={"comments" as DetailType} />;
}
