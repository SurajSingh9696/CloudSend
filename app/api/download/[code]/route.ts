import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareModel } from "@/lib/models/share";
import { allowCodeLookup } from "@/lib/rate-limit";
import { discardShare, isExpired } from "@/lib/share-utils";

export const runtime = "nodejs";

type Context = { params: { code: string } };

export async function GET(request: NextRequest, { params }: Context) {
  const code = params.code;
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });

  const limited = allowCodeLookup(request);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  try {
    await connectToDatabase();
    const share = await ShareModel.findOne({ code }).lean();
    if (!share) return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
    if (isExpired(share.expiresAt)) {
      await discardShare(share);
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 });
    }
    return NextResponse.json({
      code: share.code,
      type: share.type,
      fileName: share.fileName,
      fileSize: share.fileSize,
      mimeType: share.mimeType,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt || null,
      ...(share.type === "text" ? { textContent: share.textContent } : {}),
    });
  } catch (error) {
    console.error("Lookup failed", error);
    return NextResponse.json({ error: "Unable to search the register" }, { status: 500 });
  }
}
