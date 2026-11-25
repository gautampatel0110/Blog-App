import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { IconType } from "react-icons";
import { FiCalendar, FiCheckCircle, FiClock, FiEdit2, FiEdit3, FiExternalLink, FiLayers, FiPlus, FiSearch } from "react-icons/fi";
import api from "../services/api";
import emptyIllustration from "../assets/web-design.svg";
import StatusBadge from "../components/StatusBadge";
import { useCurrentUser } from "../services/authContext";
import { usePublishedPageEvents } from "../services/publishingContext";
import type { BlogPage, PageListResponse, PageStats, PageStatus } from "../types";
import { coverImage, displayAuthor, excerpt, formatDate, gradientFor, initials, readingMinutes } from "../utils/content";

type Filter = "All" | PageStatus;

const PAGE_SIZE = 9;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Published", label: "Published" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Draft", label: "Drafts" },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Where a card leads: the live article when published, otherwise the editor. */
function pageHref(page: BlogPage): string {
  return page.status === "Published" ? `/blog/${page.slug}` : `/edit/${page._id}`;
}

function dateLine(page: BlogPage): string {
  if (page.status === "Published") return formatDate(page.publishedAt ?? page.updatedAt);
  if (page.status === "Scheduled") return `Goes live ${formatDate(page.publishedAt, true)}`;
  return `Edited ${formatDate(page.updatedAt)}`;
}

function StatCard({ label, value, icon: Icon, tone, active, onClick }: {
  label: string;
  value: number | undefined;
  icon: IconType;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-brand-500 ring-2 ring-brand-500/15" : "border-gray-200"
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </span>
      <span>
        <span className="block text-2xl font-semibold text-gray-900">
          {value ?? <span className="inline-block h-6 w-8 animate-pulse rounded bg-gray-200 align-middle" />}
        </span>
        <span className="text-sm text-gray-500">{label}</span>
      </span>
    </button>
  );
}

function Cover({ page, className = "" }: { page: BlogPage; className?: string }) {
  const image = coverImage(page);
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(page._id)}`}>
          <span className="text-5xl font-bold text-white/90 drop-shadow-sm">{page.title.trim().charAt(0).toUpperCase() || "B"}</span>
        </div>
      )}
      <StatusBadge status={page.status} className="absolute left-3 top-3 bg-white/95 shadow-sm backdrop-blur" />
    </div>
  );
}

function CardActions({ page }: { page: BlogPage }) {
  const navigate = useNavigate();
  const stop = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };
  return (
    <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
      <button
        onClick={(event) => stop(event, () => navigate(`/edit/${page._id}`))}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Edit page"
        title="Edit"
      >
        <FiEdit2 size={15} />
      </button>
      <button
        onClick={(event) => stop(event, () => window.open(page.status === "Published" ? `/blog/${page.slug}` : `/preview/${page._id}`, "_blank", "noopener,noreferrer"))}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label={page.status === "Published" ? "Open live page" : "Preview page"}
        title={page.status === "Published" ? "Open live page" : "Preview"}
      >
        <FiExternalLink size={15} />
      </button>
    </div>
  );
}

function AuthorLine({ page }: { page: BlogPage }) {
  const author = displayAuthor(page);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
        {initials(author)}
      </span>
      <span className="truncate text-sm font-medium text-gray-700">{author}</span>
    </div>
  );
}

function MetaLine({ page }: { page: BlogPage }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
      <span className="inline-flex items-center gap-1">
        <FiCalendar size={12} /> {dateLine(page)}
      </span>
      <span className="text-gray-300">•</span>
      <span className="inline-flex items-center gap-1">
        <FiClock size={12} /> {readingMinutes(page.body)} min read
      </span>
    </div>
  );
}

function FeaturedCard({ page }: { page: BlogPage }) {
  return (
    <Link
      to={pageHref(page)}
      className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-xl md:grid-cols-2"
    >
      <Cover page={page} className="aspect-[16/10] md:aspect-auto md:min-h-[300px]" />
      <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">Latest post</span>
          <h2 className="text-2xl font-bold leading-tight text-gray-900 transition group-hover:text-brand-600 md:text-3xl">
            {page.title}
          </h2>
          <p className="line-clamp-3 text-[15px] leading-relaxed text-gray-600">{excerpt(page, 220)}</p>
          <MetaLine page={page} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <AuthorLine page={page} />
          <CardActions page={page} />
        </div>
      </div>
    </Link>
  );
}

function PostCard({ page }: { page: BlogPage }) {
  return (
    <Link
      to={pageHref(page)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      <Cover page={page} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <MetaLine page={page} />
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-900 transition group-hover:text-brand-600">
          {page.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{excerpt(page)}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <AuthorLine page={page} />
          <CardActions page={page} />
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[16/9] animate-pulse bg-gray-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const publishedEvents = usePublishedPageEvents();

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pages, setPages] = useState<BlogPage[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [stats, setStats] = useState<PageStats | null>(null);

  const lastEvent = publishedEvents.at(-1);
  const eventKey = lastEvent ? `${lastEvent.pageId}@${lastEvent.publishedAt}` : "";
  const requestKey = `${filter}|${debouncedSearch}|${pageNumber}|${eventKey}`;
  const loading = loadedKey !== requestKey;

  const changeFilter = (value: Filter) => {
    setFilter(value);
    setPageNumber(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    api
      .get<PageStats>("/pages/stats")
      .then((response) => setStats(response.data))
      .catch(() => setStats(null));
  }, [eventKey]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PageListResponse>("/pages", {
        params: { status: filter, search: debouncedSearch, page: pageNumber, limit: PAGE_SIZE },
      })
      .then((response) => {
        if (cancelled) return;
        const incoming = response.data.data;
        setPages((previous) => {
          if (pageNumber === 1) return incoming;
          const seen = new Set(previous.map((page) => page._id));
          return [...previous, ...incoming.filter((page) => !seen.has(page._id))];
        });
        setTotalPages(response.data.pagination.totalPages);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load pages");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, debouncedSearch, pageNumber, requestKey]);

  const firstName = user?.name.split(" ")[0];
  const showFeatured = !debouncedSearch && pages.length > 2;
  const [featured, ...rest] = pages;
  const gridPages = showFeatured ? rest : pages;
  const initialLoad = loading && pageNumber === 1;
  const noPagesAtAll = stats?.total === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">{greeting()}{firstName ? `, ${firstName}` : ""} 👋</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Your blog</h1>
          <p className="mt-1 text-sm text-gray-500">Write, schedule and publish stories from one place.</p>
        </div>
        <button
          onClick={() => navigate("/create-page")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          <FiPlus size={16} /> New page
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total pages" value={stats?.total} icon={FiLayers} tone="bg-brand-50 text-brand-500" active={filter === "All"} onClick={() => changeFilter("All")} />
        <StatCard label="Published" value={stats?.published} icon={FiCheckCircle} tone="bg-emerald-50 text-emerald-600" active={filter === "Published"} onClick={() => changeFilter("Published")} />
        <StatCard label="Scheduled" value={stats?.scheduled} icon={FiClock} tone="bg-sky-50 text-sky-600" active={filter === "Scheduled"} onClick={() => changeFilter("Scheduled")} />
        <StatCard label="Drafts" value={stats?.drafts} icon={FiEdit3} tone="bg-amber-50 text-amber-600" active={filter === "Draft"} onClick={() => changeFilter("Draft")} />
      </div>

      {noPagesAtAll ? (
        <div className="mt-10 flex flex-col items-center justify-between gap-8 rounded-2xl border border-gray-200 bg-white p-10 md:flex-row">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Start your first story</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              You don’t have any pages yet. Create one, save it as a draft, and publish it when it’s ready.
            </p>
            <button
              onClick={() => navigate("/create-page")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <FiPlus size={16} /> Create a page
            </button>
          </div>
          <img src={emptyIllustration} alt="" className="h-48" />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => changeFilter(value)}
                  className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    filter === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative block md:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
          </div>

          {/* Content */}
          <div className="mt-6 space-y-6">
            {initialLoad ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} />)}
              </div>
            ) : pages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-base font-medium text-gray-900">No pages match</p>
                <p className="mt-1 text-sm text-gray-500">
                  {debouncedSearch ? `Nothing found for “${debouncedSearch}”.` : `You have no ${filter === "Draft" ? "drafts" : filter.toLowerCase()} pages.`}
                </p>
              </div>
            ) : (
              <>
                {showFeatured && featured && <FeaturedCard page={featured} />}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPages.map((page) => <PostCard key={page._id} page={page} />)}
                </div>
                {pageNumber < totalPages && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setPageNumber((current) => current + 1)}
                      disabled={loading}
                      className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      {loading ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
