// Route /platform — redirect ke default metric (Followers).
// Halaman detail ada di /platform/followers|likes|comments|performance|engagement.
import { redirect } from "next/navigation";

export default function PlatformPage() {
  redirect("/platform/followers");
}
