import { model, Schema, Types } from "mongoose";

export interface UserRecord {
  name: string;
  email: string;
  password: string;
  resetToken: string | null;
  resetExpire: Date | null;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    resetToken: { type: String, default: null },
    resetExpire: { type: Date, default: null },
  },
  { timestamps: true },
);

const User = model<UserRecord>("User", userSchema);
export type UserId = Types.ObjectId;
export default User;
