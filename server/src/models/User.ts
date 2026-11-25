import { model, Schema, Types } from "mongoose";

export interface UserRecord {
  name: string;
  email: string;
  password: string;
  /**
   * false until the user enters the emailed code. Accounts created before email
   * verification existed have no value and are treated as verified.
   */
  emailVerified?: boolean;
  verifyOtp: string | null;
  verifyOtpExpire: Date | null;
  verifyOtpAttempts: number;
  verifyOtpSentAt: Date | null;
  resetToken: string | null;
  resetExpire: Date | null;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean },
    verifyOtp: { type: String, default: null },
    verifyOtpExpire: { type: Date, default: null },
    verifyOtpAttempts: { type: Number, default: 0 },
    verifyOtpSentAt: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetExpire: { type: Date, default: null },
  },
  { timestamps: true },
);

const User = model<UserRecord>("User", userSchema);
export type UserId = Types.ObjectId;
export default User;
