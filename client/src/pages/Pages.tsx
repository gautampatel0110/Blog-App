import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiExternalLink, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { usePublishedPageEvents } from "../services/publishingContext";
import type { BlogPage, PageListResponse, PageStats } from "../types";
import { formatDate, personName } from "../utils/content";

const LIMIT = 10;

export default function Pages() {
  const navigate = useNavigate();
  const publishedEvents = usePublishedPageEvents();

  const [pages, setPages] = useState<BlogPage[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [author, setAuthor] = useState("All");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [authors, setAuthors] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    api
      .get<PageStats>("/pages/stats")
      .then((response) => setAuthors(response.data.authors))
      .catch(() => setAuthors([]));
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PageListResponse>("/pages", { params: { search: debouncedSearch, status, author, page, limit: LIMIT } })
      .then((response) => {
        if (cancelled) return;
        // Deleting the last row of the last page leaves it empty: step back one page.
        if (response.data.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setPages(response.data.data);
        setPagination(response.data.pagination);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load pages");
      });
    return () => {
      cancelled = true;
    };
  }, [author, debouncedSearch, page, publishedEvents, reloadToken, status]);

  const deletePage = async (target: BlogPage) => {
    if (!confirm(`Delete “${target.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/pages/${target._id}`);
      toast.success("Page deleted");
      setReloadToken((token) => token + 1);
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  const iconButton = "rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All pages</h1>
          <p className="mt-1 text-sm text-gray-500">Search, filter and manage every page.</p>
        </div>
        <button
          onClick={() => navigate("/create-page")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
        >
          <FiPlus size={16} /> New page
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <label className="relative block w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              placeholder="Search by title…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span className="whitespace-nowrap text-sm text-gray-500">{pagination.total} pages</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            Status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={selectClass}>
              <option>All</option>
              <option>Published</option>
              <option>Scheduled</option>
              <option>Draft</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Created by
            <select value={author} onChange={(event) => { setAuthor(event.target.value); setPage(1); }} className={selectClass}>
              <option value="All">All</option>
              {authors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b bg-gray-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3">Title</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Last modified</th>
              <th className="px-3 py-3">Publish date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((item) => (
              <tr key={item._id} className="border-b transition last:border-0 hover:bg-gray-50">
                <td className="max-w-xs px-6 py-4">
                  <Link to={`/edit/${item._id}`} className="block truncate font-medium text-gray-900 hover:text-brand-600">
                    {item.title}
                  </Link>
                  <span className="block truncate text-xs text-gray-400">/blog/{item.slug}</span>
                </td>
                <td className="px-3 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-3 py-4 text-gray-600">
                  <span className="block">{personName(item.createdBy) ?? "—"}</span>
                  <span className="text-xs text-gray-400">{formatDate(item.createdAt, true)}</span>
                </td>
                <td className="px-3 py-4 text-gray-600">
                  <span className="block">{personName(item.modifiedBy) ?? "—"}</span>
                  <span className="text-xs text-gray-400">{item.modifiedBy ? formatDate(item.updatedAt, true) : ""}</span>
                </td>
                <td className="px-3 py-4 text-gray-600">{item.publishedAt ? formatDate(item.publishedAt, true) : "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/edit/${item._id}`)} className={iconButton} title="Edit" aria-label="Edit">
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => window.open(item.status === "Published" ? `/blog/${item.slug}` : `/preview/${item._id}`, "_blank", "noopener,noreferrer")}
                      className={iconButton}
                      title={item.status === "Published" ? "Open live page" : "Preview"}
                      aria-label="View"
                    >
                      <FiExternalLink size={15} />
                    </button>
                    <button onClick={() => void deletePage(item)} className={`${iconButton} hover:bg-red-50 hover:text-red-600`} title="Delete" aria-label="Delete">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pages.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-gray-500">
                  No pages found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 hover:bg-gray-50 disabled:opacity-40">
            Previous
          </button>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 hover:bg-gray-50 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
