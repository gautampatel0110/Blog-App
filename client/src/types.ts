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
  preview: string | null;
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
