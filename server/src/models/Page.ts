import { model, Schema, Types } from "mongoose";

export const PAGE_STATUSES = ["Draft", "Scheduled", "Published"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export interface PageAttachment {
  url: string;
  publicId: string;
  type: string;
}

export interface PageRecord {
  title: string;
  subTitle?: string;
  slug: string;
  body: string;
  author?: string;
  showAuthor: boolean;
  status: PageStatus;
  publishedAt: Date | null;
  attachments: PageAttachment[];
  createdBy: Types.ObjectId;
  modifiedBy: Types.ObjectId | null;
}

const attachmentSchema = new Schema<PageAttachment>(
  { url: { type: String, required: true }, publicId: { type: String, required: true }, type: { type: String, required: true } },
  { _id: false },
);

const pageSchema = new Schema<PageRecord>(
  {
    title: { type: String, required: true, trim: true },
    subTitle: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    body: { type: String, required: true },
    author: { type: String, trim: true },
    showAuthor: { type: Boolean, default: true },
    status: { type: String, enum: PAGE_STATUSES, default: "Draft", required: true },
    publishedAt: { type: Date, default: null },
    attachments: { type: [attachmentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const Page = model<PageRecord>("Page", pageSchema);
export default Page;
