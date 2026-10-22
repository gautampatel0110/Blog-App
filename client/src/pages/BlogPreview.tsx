import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import type { BlogPage } from "../types";

interface BlogPreviewProps {
  adminPreview?: boolean;
}

export default function BlogPreview({ adminPreview = false }: BlogPreviewProps) {
  const { slug, id } = useParams();
  const [blog, setBlog] = useState<BlogPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<BlogPage>(adminPreview ? `/pages/${id}` : `/public/blogs/${encodeURIComponent(slug ?? "")}`)
      .then((res) => setBlog(res.data))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [adminPreview, id, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading blog...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Blog not found
      </div>
    );
  }

  const heroImage = blog.attachments?.find((a) =>
    a.type?.startsWith("image/")
  );
  const authorName = typeof blog.createdBy === "object" && blog.createdBy
    ? blog.createdBy.name
    : undefined;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Image */}
      {heroImage && (
        <div className="w-full bg-gray-100">
          <div className="max-w-5xl mx-auto">
            <img
              src={heroImage.url}
              alt={blog.title}
              className="w-full max-h-[460px] object-cover rounded-b-xl"
            />
          </div>
        </div>
      )}

      {/* Article */}
      <article className="mx-auto max-w-[680px] px-6 py-12">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          {blog.title}
        </h1>

        {/* Subtitle */}
        {blog.subTitle && (
          <p className="text-lg text-gray-500 mt-4 leading-relaxed">
            {blog.subTitle}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
          {blog.showAuthor !== false && (blog.author || authorName) && (
            <span className="font-medium text-gray-700">
              {blog.author || authorName}
            </span>
          )}
          {blog.publishedAt && (
            <>
              <span>·</span>
              <span>
                {new Date(blog.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-gray-200" />

        {/* Body */}
        <div
          className="
           prose
    prose-lg
    max-w-none
    mt-14
    prose-p:leading-[1.8]
    prose-p:mt-6
    prose-headings:mt-12
    prose-headings:mb-4
    prose-img:rounded-xl
    prose-img:mx-auto
    prose-img:my-10
          "
          dangerouslySetInnerHTML={{ __html: blog.body }}
        />

        {/* Attachments */}
        {blog.attachments?.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">
              Attachments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blog.attachments.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Attachment {i + 1}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.type || "File"}
                    </p>
                  </div>

                  <span className="text-blue-600 text-sm">
                    View →
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
