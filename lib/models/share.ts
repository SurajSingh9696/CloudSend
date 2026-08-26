import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const shareSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ["document", "image", "video", "audio", "text"] },
    fileName: { type: String, trim: true, maxlength: 255 },
    fileSize: { type: Number, min: 0 },
    mimeType: { type: String, maxlength: 255 },
    fileId: { type: Schema.Types.ObjectId },
    textContent: { type: String, maxlength: 100000 },
    expiresAt: { type: Date, index: { expires: 0 } },
    burnAfterDownload: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export type Share = InferSchemaType<typeof shareSchema>;
export const ShareModel: Model<Share> = mongoose.models.Share || mongoose.model<Share>("Share", shareSchema);
