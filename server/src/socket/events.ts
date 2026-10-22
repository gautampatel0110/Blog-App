export interface PublishedPageEvent {
  pageId: string;
  title: string;
  slug: string;
  publishedAt: string;
}

export const PAGE_PUBLISHED_EVENT = "page:published";
