import { useEffect, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import type { BlogPage, PageListResponse } from "../types";
import { usePublishedPageEvents } from "../services/publishingContext";

export default function Pages() {
  const navigate = useNavigate();

  const [pages, setPages] = useState<BlogPage[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("All");
  const [author, setAuthor] = useState("All");

  const [page, setPage] = useState(1);
  const limit = 10;
  const publishedEvents = usePublishedPageEvents();

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
  });


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);


  useEffect(() => {
    let cancelled = false;
    api.get<PageListResponse>("/pages", {
      params: { search: debouncedSearch, status, author, page, limit },
    }).then((response) => {
      if (cancelled) return;
      setPages(response.data.data);
      setPagination(response.data.pagination);
    }).catch(() => {
      if (!cancelled) toast.error("Failed to load pages");
    });
    return () => { cancelled = true; };
  }, [author, debouncedSearch, limit, page, publishedEvents, status]);

  const authors = ["All", ...new Set(pages
    .map((item) => typeof item.createdBy === "object" ? item.createdBy?.name : undefined)
    .filter((name): name is string => Boolean(name)))];

  const deletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await api.delete(`/pages/${id}`);
      toast.success("Page deleted");
      setPages((previous) => previous.filter((item) => item._id !== id));
    } catch {
      toast.error("Failed to delete page");
    }
  };

  return (
    <div className="px-10 py-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">
            Pages
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Create and publish pages.
          </p>
        </div>

        <button
          onClick={() => navigate("/create-page")}
          className="bg-[#5B4CF5] text-white text-sm px-4 py-2 rounded-md hover:bg-[#4a3de0]"
        >
          + Add Page
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <input
            placeholder="Search"
            className="w-72 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B4CF5]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="text-sm text-gray-500">
            {pagination.total} records
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none"
            >
              <option>All</option>
              <option>Published</option>
              <option>Scheduled</option>
              <option>Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Created By</span>
            <select
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setPage(1);
              }}
              className="bg-transparent focus:outline-none"
            >
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-white">
            <tr className="text-gray-500 font-medium">
              <th className="px-6 py-3 text-left">Title</th>
              <th className="text-left">URL</th>
              <th className="text-left">Created By</th>
              <th className="text-left">Created At</th>
              <th className="text-left">Modified By</th>
              <th className="text-left">Modified At</th>
              <th className="text-left">Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {pages.map((p) => (
              <tr
                key={p._id}
                className="group/row border-b last:border-0 hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {p.title}
                </td>

                <td>{p.slug}</td>
                <td>{typeof p.createdBy === "object" ? p.createdBy?.name : ""}</td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>{typeof p.modifiedBy === "object" ? p.modifiedBy?.name || "—" : "—"}</td>
                <td>
                  {p.modifiedBy
                    ? new Date(p.updatedAt).toLocaleString()
                    : "—"}
                </td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : p.status === "Scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="relative pr-4 text-right">
                  <div className="relative inline-block opacity-0 group-hover/row:opacity-100 transition">
                    <div className="relative inline-block group/menu">
                      <FiMoreVertical className="text-gray-400 cursor-pointer hover:text-gray-700" />

                      <div className="absolute right-0 top-0 hidden group-hover/menu:block w-28 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        <button
                          onClick={() => navigate(`/edit/${p._id}`)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePage(p._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}

            {pages.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  No pages found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <div className="flex gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
