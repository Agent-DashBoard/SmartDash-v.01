// Route /platform/* — belum dibangun.
// Klik badge di kartu Follow/Like/Comment akan navigate ke sini.
// Untuk sementara tampilkan not-found (halaman sedang dikerjakan).
import { notFound } from "next/navigation";

export default function PlatformPage() {
  notFound();
}
