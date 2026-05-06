import mongoose, { Schema, Document } from "mongoose";

export interface IClub extends Document {
  name: string;
  branchId: string;
  description: string;
  workerId: string;
  type: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true, trim: true },
    branchId: { type: String, required: true },
    description: { type: String, default: "Chi nhánh chính của Arena Billiard" },
    workerId: { type: String, default: "" },
    type: { type: String, default: "business" },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Club =
  mongoose.models.Club ?? mongoose.model<IClub>("Club", ClubSchema, "clubs");
