import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareModel } from "@/lib/models/share";
import { allowCodeLookup } from "@/lib/rate-limit";
import { discardShare, getBucket, isExpired, removeGridFsFile, streamFromGridFs } from "@/lib/share-utils";

export const runtime = "nodejs";

type Context = { params: { code: string } };

function missing() {
  return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
}

export async function GET(_request: NextRequest, { params }: Context) {
  const code = params.code;
  if (!/^\d{6}$/.test(code)) return missing();

  const limited = allowCodeLookup(_request);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  try {
    await connectToDatabase();
    let share = await ShareModel.findOne({ code }).lean();
    if (!share) return missing();
    if (isExpired(share.expiresAt)) {
      await discardShare(share);
      return missing();
    }
    if (share.type === "text" || !share.fileId) return NextResponse.json({ error: "This entry is text, not a file" }, { status: 400 });

    // Claim burn-after-download entries before sending bytes, so two simultaneous requests cannot retrieve them twice.
    if (share.burnAfterDownload) {
      const claimed = await ShareModel.findOneAndDelete({ code, burnAfterDownload: true }).lean();
      if (!claimed) return missing();
      share = claimed;
    } else {
      await ShareModel.updateOne({ _id: share._id }, { $inc: { downloadCount: 1 } });
    }

    if (!share.fileId) return missing();
    const bucket = await getBucket();
    const fileStream = bucket.openDownloadStream(share.fileId);
    if (share.burnAfterDownload) {
      fileStream.once("end", () => {
        removeGridFsFile(share.fileId).catch((error) => console.error("Unable to burn GridFS file", error));
      });
    }
    fileStream.once("error", (error) => console.error("GridFS read failed", error));
    const safeName = (share.fileName || "download").replace(/["\\\r\n]/g, "_");
    const encodedName = encodeURIComponent(share.fileName || "download");
    return new Response(streamFromGridFs(fileStream), {
      headers: {
        "Content-Type": share.mimeType || "application/octet-stream",
        "Content-Length": String(share.fileSize || ""),
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("File download failed", error);
    return NextResponse.json({ error: "Unable to retrieve this file" }, { status: 500 });
  }
}
