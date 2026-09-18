import { NextResponse } from "next/server";
import { readSnapshot } from "@/lib/holders/blob";
import { isSnapshotId } from "@/lib/holders/snapshot";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isSnapshotId(id)) {
    return NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
  }

  try {
    const snapshot = await readSnapshot(id);
    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ snapshot });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load snapshot.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
