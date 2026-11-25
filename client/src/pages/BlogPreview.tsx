import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiClock, FiDownload, FiFileText } from "react-icons/fi";
import api from "../services/api";
import type { BlogPage } from "../types";
import { coverImage, displayAuthor, formatDate, initials, readingMinutes, sanitizeHtml } from "../utils/content";

interface BlogPreviewProps {
  adminPreview?: boolean;
}

function fileName(url: string): string {
  return decodeURIComponent(url.split("/").pop() ?? "file").replace(/^\d{10,}-/, "");
}

export default function BlogPreview({ adminPreview = false }: BlogPreviewProps) {
  const { slug, id } = useParams();
  const [blog, setBlog] = useState<BlogPage | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const requestKey = adminPreview ? `id:${id}` : `slug:${slug}`;

  useEffect(() => {
    let cancelled = false;
    api
      .get<BlogPage>(adminPreview ? `/pages/${id}` : `/public/blogs/${encodeURIComponent(slug ?? "")}`)
      .then((response) => {
        if (!cancelled) setBlog(response.data);
      })
      .catch(() => {
        if (!cancelled) setBlog(null);
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [adminPreview, id, slug, requestKey]);

  const safeBody = useMemo(() => sanitizeHtml(blog?.body ?? ""), [blog?.body]);

  useEffect(() => {
    if (blog) document.title = blog.title;
  }, [blog]);

  if (loadedFor !== requestKey) {
    return (
      <div className="mx-auto max-w-[720px] animate-pulse space-y-4 px-6 py-20">
        <div className="h-10 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-100" />
        <div className="mt-10 h-64 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold text-gray-900">This post isn’t available</h1>
        <p className="text-sm text-gray-500">It may have been unpublished, moved, or never existed.</p>
      </div>
    );
  }

  const hero = coverImage(blog);
  const author = displayAuthor(blog);
  const files = (blog.attachments ?? []).filter((attachment) => attachment.url !== hero);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {adminPreview && (
        <div className="sticky top-0 z-10 flex items-center justify-center gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Preview · this page is <strong>{blog.status.toLowerCase()}</strong> and not visible to readers yet
          <Link to={`/edit/${blog._id}`} className="font-semibold underline">Back to editor</Link>
        </div>
      )}

      <article className="mx-auto max-w-[720px] px-6 pb-20 pt-14 md:pt-20">
        <header>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">{blog.title}</h1>
          {blog.subTitle && <p className="mt-5 text-xl leading-relaxed text-gray-500">{blog.subTitle}</p>}

          <div className="mt-8 flex items-center gap-3 border-y border-gray-100 py-4 text-sm text-gray-500">
            {blog.showAuthor !== false && (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                  {initials(author)}
                </span>
                <span className="font-medium text-gray-800">{author}</span>
                <span className="text-gray-300">·</span>
              </>
            )}
            {blog.publishedAt && <span>{formatDate(blog.publishedAt)}</span>}
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1">
              <FiClock size={13} /> {readingMinutes(blog.body)} min read
            </span>
          </div>
        </header>

        {hero && <img src={hero} alt="" className="mt-10 w-full rounded-2xl object-cover shadow-sm" />}

        <div
          className="prose prose-lg prose-gray mt-10 max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-brand-600 prose-img:mx-auto prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />

        {files.length > 0 && (
          <section className="mt-16 border-t pt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Attachments</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {files.map((attachment) => (
                <a
                  key={attachment.url}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border p-4 transition hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <FiFileText size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">{fileName(attachment.url)}</span>
                    <span className="text-xs text-gray-500">{attachment.type || "File"}</span>
                  </span>
                  <FiDownload className="text-gray-400" size={16} />
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
