import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import emptyIllustration from "../assets/web-design.svg";
import type { BlogPage, PageListResponse } from "../types";
import { usePublishedPageEvents } from "../services/publishingContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogPage[]>([]);
  const [loading, setLoading] = useState(true);
  const publishedEvents = usePublishedPageEvents();

  const loadBlogs = useCallback(async () => {
    try {
      const response = await api.get<PageListResponse>("/pages", {
        params: { status: "Published" },
      });
      setBlogs(response.data.data);
    } catch {
      toast.error("Failed to load published pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs, publishedEvents]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <main className="flex-1 px-6 py-10">
        {blogs.length === 0 ? (
          /* EMPTY STATE — CENTERED (UNCHANGED) */
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-4xl bg-white border rounded-lg p-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  No Pages Found.
                </h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Looks like you don’t have any pages yet. Let’s add a new page.
                </p>

                <button
                  onClick={() => navigate("/create-page")}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#5B4CF5] px-5 py-2 text-sm font-medium text-white hover:bg-[#4a3de0] transition"
                >
                  + Add Page
                </button>
              </div>

              <div className="hidden md:block">
                <img
                  src={emptyIllustration}
                  alt="No pages"
                  className="h-56"
                />
              </div>
            </div>
          </div>
        ) : (
          /* BLOG GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog._id}
                onClick={() => navigate(`/blog/${blog.slug}`)}
                className="cursor-pointer bg-white border rounded-lg p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {blog.title}
                </h3>

                {blog.subTitle && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {blog.subTitle}
                  </p>
                )}

                <div className="mt-4 text-xs text-gray-400">
                  Published on{" "}
                  {new Date(blog.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
