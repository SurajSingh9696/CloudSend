import { NextRequest, NextResponse } from "next/server";
import { ShareModel } from "@/lib/models/share";
import { classifyUpload, makeCode, MAX_FILE_SIZE, MAX_TEXT_LENGTH, removeGridFsFile, saveToGridFs } from "@/lib/share-utils";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const mode = form.get("mode");
    const expiresAt = new Date(Date.now() + 86400 * 1000); // Fixed 24 hours
    const burnAfterDownload = form.get("burnAfterDownload") === "true";

    await connectToDatabase();
    await ShareModel.init();
    let entry: Record<string, unknown>;
    let storedFileId;

    if (mode === "text") {
      const textContent = form.get("textContent");
      if (typeof textContent !== "string" || !textContent.trim()) return NextResponse.json({ error: "Text content is required" }, { status: 400 });
      if (textContent.length > MAX_TEXT_LENGTH) return NextResponse.json({ error: "Text is limited to 100,000 characters" }, { status: 413 });
      entry = { type: "text", fileName: "Shared text note", textContent, expiresAt, burnAfterDownload };
    } else {
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "A file is required" }, { status: 400 });
      if (file.size === 0) return NextResponse.json({ error: "Empty files cannot be shared" }, { status: 400 });
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Files must be 25 MB or smaller" }, { status: 413 });
      const type = classifyUpload(file.name, file.type || "application/octet-stream");
      if (!type) return NextResponse.json({ error: "This file type is not supported" }, { status: 415 });
      storedFileId = await saveToGridFs(file.stream(), file.name, file.type || "application/octet-stream");
      entry = { type, fileName: file.name, fileSize: file.size, mimeType: file.type || "application/octet-stream", fileId: storedFileId, expiresAt, burnAfterDownload };
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const code = await makeCode();
        await ShareModel.create({ ...entry, code });
        return NextResponse.json({ code, expiresAt: expiresAt || null }, { status: 201 });
      } catch (error: unknown) {
        if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
      }
    }
    if (storedFileId) await removeGridFsFile(storedFileId);
    return NextResponse.json({ error: "Unable to allocate a unique code. Please retry." }, { status: 503 });
  } catch (error) {
    console.error("Upload failed", error);
    const message = error instanceof Error && error.message.includes("MONGODB_URI")
      ? "Storage is not configured. Add MONGODB_URI to .env.local."
      : "Unable to seal this entry. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
