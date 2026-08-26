import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareModel } from "@/lib/models/share";
import { removeGridFsFile } from "@/lib/share-utils";

export const runtime = "nodejs";

/** Optional cron endpoint for promptly removing GridFS binaries; Mongo TTL handles metadata eventually. */
export async function DELETE(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cleanup is not configured" }, { status: 503 });

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const expired = await ShareModel.find({ expiresAt: { $lte: new Date() } }).lean();
    await Promise.all(expired.map(async (share) => {
      await ShareModel.deleteOne({ _id: share._id });
      await removeGridFsFile(share.fileId);
    }));
    return NextResponse.json({ removed: expired.length });
  } catch (error) {
    console.error("Cleanup failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
