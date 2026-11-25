import DOMPurify from "dompurify";
import type { BlogPage, PersonSummary } from "../types";

/** Removes scripts and event handlers from rich-text HTML before it is rendered. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function excerpt(page: Pick<BlogPage, "subTitle" | "body">, maxLength = 140): string {
  const text = page.subTitle?.trim() || htmlToText(page.body ?? "");
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** First image attachment, falling back to the first image inside the body. */
export function coverImage(page: Pick<BlogPage, "attachments" | "body">): string | null {
  const attachment = page.attachments?.find((item) => item.type?.startsWith("image/"));
  if (attachment) return attachment.url;
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(page.body ?? "");
  return match?.[1] ?? null;
}

export function personName(person: PersonSummary | string | null | undefined): string | undefined {
  return typeof person === "object" && person ? person.name : undefined;
}

export function displayAuthor(page: Pick<BlogPage, "author" | "createdBy">): string {
  return page.author?.trim() || personName(page.createdBy) || "Unknown author";
}

export function initials(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/** Stable pastel gradient per page so cards without a cover image still look distinct. */
const GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-fuchsia-500 to-purple-500",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length] ?? GRADIENTS[0]!;
}

export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
