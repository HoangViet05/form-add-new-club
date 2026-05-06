import mongoose, { Schema, Document } from "mongoose";

export interface IQRCode extends Document {
  cameraId: string;
  name: string;
  qrImageBase64: string;
  url: string;
  createdAt: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    cameraId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    qrImageBase64: { type: String, required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const QRCode =
  mongoose.models.QRCode ?? mongoose.model<IQRCode>("QRCode", QRCodeSchema, "qrcodes");
