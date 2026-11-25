export type PageStatus = "Draft" | "Scheduled" | "Published";

export interface Attachment {
  url: string;
  publicId?: string;
  type: string;
}

export interface PersonSummary {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
}

export interface BlogPage {
  _id: string;
  title: string;
  subTitle?: string;
  slug: string;
  body: string;
  author?: string;
  showAuthor?: boolean;
  status: PageStatus;
  publishedAt: string | null;
  attachments: Attachment[];
  createdBy?: PersonSummary | string;
  modifiedBy?: PersonSummary | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedPageEvent {
  pageId: string;
  title: string;
  slug: string;
  publishedAt: string;
}

export interface PageFormValues {
  title: string;
  subTitle: string;
  slug: string;
  author: string;
  showAuthor: boolean;
}

export interface PageAttachmentDraft {
  id: string;
  file: File | null;
  /** Object URL for new images, or the stored URL for already-uploaded files. */
  preview: string | null;
  /** Stored URL of an already-uploaded file (sent back as keepAttachments). */
  url: string | null;
  name: string;
  type: string;
  uploaded: boolean;
}

export interface PageListResponse {
  data: BlogPage[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface PageStats {
  total: number;
  published: number;
  scheduled: number;
  drafts: number;
  authors: string[];
}
