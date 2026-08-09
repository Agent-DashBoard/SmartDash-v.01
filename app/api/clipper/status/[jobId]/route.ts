import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  return NextResponse.json(
    { error: "Not implemented yet", jobId },
    { status: 404 }
  );
}
