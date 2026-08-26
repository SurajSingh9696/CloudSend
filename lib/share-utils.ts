import { randomInt } from "crypto";
import mongoose from "mongoose";
import { Readable } from "stream";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareModel } from "@/lib/models/share";

export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 100000;
export type ShareKind = "document" | "image" | "video" | "audio" | "text";
type GridFsObjectId = InstanceType<typeof mongoose.mongo.ObjectId>;

const ALLOWED_DOCUMENT_EXTENSIONS = /\.(pdf|docx?|rtf|odt|csv|md|txt)$/i;

export function classifyUpload(fileName: string, mimeType: string): ShareKind | null {
  const type = mimeType.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf" || type.includes("word") || type.startsWith("text/") || ALLOWED_DOCUMENT_EXTENSIONS.test(fileName)) return "document";
  return null;
}

export async function makeCode() {
  await connectToDatabase();
  for (let attempts = 0; attempts < 5; attempts += 1) {
    const code = String(randomInt(100000, 1000000));
    const exists = await ShareModel.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Unable to allocate a unique code. Please retry.");
}

export async function getBucket() {
  const connection = await connectToDatabase();
  if (!connection.connection.db) throw new Error("MongoDB connection is unavailable.");
  return new mongoose.mongo.GridFSBucket(connection.connection.db, { bucketName: "CloudSend" });
}

export async function saveToGridFs(data: Buffer, fileName: string, mimeType: string) {
  const bucket = await getBucket();
  return new Promise<GridFsObjectId>((resolve, reject) => {
    const upload = bucket.openUploadStream(fileName, { contentType: mimeType });
    upload.once("error", reject);
    upload.once("finish", () => resolve(upload.id));
    upload.end(data);
  });
}

export async function removeGridFsFile(fileId?: GridFsObjectId | null) {
  if (!fileId) return;
  const bucket = await getBucket();
  try {
    await bucket.delete(fileId);
  } catch (error: unknown) {
    if (!(error instanceof Error) || !/not found/i.test(error.message)) throw error;
  }
}

export function streamFromGridFs(stream: NodeJS.ReadableStream) {
  return Readable.toWeb(stream as Readable) as ReadableStream<Uint8Array>;
}

export async function discardShare(share: { _id: GridFsObjectId; fileId?: GridFsObjectId | null }) {
  await ShareModel.deleteOne({ _id: share._id });
  await removeGridFsFile(share.fileId);
}

export function isExpired(expiresAt?: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}
