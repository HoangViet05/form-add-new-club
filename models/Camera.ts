import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICamera extends Document {
  name: string;
  clubId: Types.ObjectId;
  cameraChannel: number;
  port: number;
  username: string;
  password: string;
  domain: string;
  tableCorners: number[][];
  rtspUrl: string;
  scoreboardId: string;
}

const CameraSchema = new Schema<ICamera>(
  {
    name: { type: String, required: true, trim: true },
    clubId: { type: Schema.Types.ObjectId, required: true, ref: "Club" },
    cameraChannel: { type: Number, default: 201 },
    port: { type: Number, default: 1555 },
    username: { type: String, default: "admin" },
    password: { type: String, default: "" },
    domain: { type: String, default: "" },
    tableCorners: {
      type: [[Number]],
      default: [
        [176, 167],
        [1711, 168],
        [1717, 940],
        [172, 940],
      ],
    },
    rtspUrl: { type: String, required: true },
    scoreboardId: { type: String, required: true },
  },
  { timestamps: false }
);

export const Camera =
  mongoose.models.Camera ?? mongoose.model<ICamera>("Camera", CameraSchema, "cameras");
