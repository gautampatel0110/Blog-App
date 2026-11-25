import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill-new";
import { FiArrowLeft, FiEye, FiFile, FiTrash2, FiUploadCloud } from "react-icons/fi";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import api from "../services/api";
import PublishModal from "../components/PublishModal";
import StatusBadge from "../components/StatusBadge";
import UpdatePublishModal from "../components/UpdatePublishModal";
import { usePublishedPageEvents } from "../services/publishingContext";
import type { BlogPage, PageAttachmentDraft, PageFormValues, PageStatus } from "../types";
import { formatDate, slugify } from "../utils/content";
import { mountainDateTimeToUtc } from "../utils/mountainTime";

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormats = [
  "header", "bold", "italic", "underline", "strike", "color", "background",
  "align", "list", "blockquote", "code-block", "link", "image",
  // Not in the toolbar any more, but kept so older posts keep their formatting when edited.
  "font", "size",
];

const ACCEPTED_FILES = ".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function fileNameFromUrl(url: string): string {
  const last = decodeURIComponent(url.split("/").pop() ?? "file");
  // Uploaded names are prefixed with a timestamp ("1712345678901-name.pdf").
  return last.replace(/^\d{10,}-/, "");
}

function fileLabel(type: string): string {
  if (type.startsWith("image/")) return "IMAGE";
  if (type === "application/pdf") return "PDF";
  if (type.includes("word")) return "DOC";
  if (type.includes("sheet") || type.includes("excel")) return "XLS";
  if (type.includes("presentation") || type.includes("powerpoint")) return "PPT";
  return "FILE";
}

/** True when the editor holds nothing but empty markup like "<p><br></p>". */
function isBodyEmpty(html: string): boolean {
  return !html.replace(/<(?!img)[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function CreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { register, setValue, getValues, reset, watch } = useForm<PageFormValues>({
    defaultValues: { title: "", subTitle: "", slug: "", author: "", showAuthor: true },
  });

  const [status, setStatus] = useState<PageStatus>("Draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PageAttachmentDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const publishedEvents = usePublishedPageEvents();

  const applyPage = (page: BlogPage) => {
    setStatus(page.status || "Draft");
    setPublishedAt(page.publishedAt || null);
    setSavedSlug(page.slug);
  };

  useEffect(() => {
    if (!isEdit) {
      reset();
      setBody("");
      setAttachments([]);
      setStatus("Draft");
      setPublishedAt(null);
      setSavedSlug(null);
      setSlugTouched(false);
      return;
    }

    let cancelled = false;
    api
      .get<BlogPage>(`/pages/${id}`)
      .then(({ data: page }) => {
        if (cancelled) return;
        reset({
          title: page.title || "",
          subTitle: page.subTitle || "",
          slug: page.slug || "",
          author: page.author || (typeof page.createdBy === "object" ? page.createdBy?.name ?? "" : ""),
          showAuthor: page.showAuthor ?? true,
        });
        setSlugTouched(true);
        setStatus(page.status || "Draft");
        setPublishedAt(page.publishedAt || null);
        setSavedSlug(page.slug);
        setBody(page.body || "");
        setAttachments(
          (page.attachments || []).map((attachment) => ({
            id: crypto.randomUUID(),
            file: null,
            preview: attachment.type?.startsWith("image/") ? attachment.url : null,
            url: attachment.url,
            name: fileNameFromUrl(attachment.url),
            type: attachment.type || "",
            uploaded: true,
          })),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getErrorMessage(error, "Failed to load page"));
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  // Live update when the scheduler publishes this page while it is open.
  useEffect(() => {
    const event = [...publishedEvents].reverse().find((item) => item.pageId === id);
    if (id && event && status === "Scheduled") {
      setStatus("Published");
      setPublishedAt(event.publishedAt);
      setShowUpdateModal(false);
      toast.success(`“${event.title}” is now published`);
    }
  }, [id, publishedEvents, status]);

  // Keep the URL in sync with the title until the user edits the URL themselves.
  const titleField = register("title");
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    void titleField.onChange(event);
    if (!slugTouched) setValue("slug", slugify(event.target.value));
  };
  const slugField = register("slug");
  const slugValue = watch("slug");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const tooLarge = files.filter((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge.length) toast.error(`${tooLarge.map((file) => file.name).join(", ")} is larger than 10 MB`);

    const accepted: PageAttachmentDraft[] = files
      .filter((file) => file.size <= MAX_FILE_BYTES)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        url: null,
        name: file.name,
        type: file.type,
        uploaded: false,
      }));
    setAttachments((previous) => [...previous, ...accepted]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((previous) => {
      const removed = previous.find((item) => item.id === attachmentId);
      if (removed?.file && removed.preview) URL.revokeObjectURL(removed.preview);
      return previous.filter((item) => item.id !== attachmentId);
    });
  };

  /** Saves the form. Returns the saved page, or null when it failed. */
  const handleSave = async (publish = false, stayOnPage = false): Promise<BlogPage | null> => {
    const { title, subTitle, slug, author, showAuthor } = getValues();
    if (!title.trim() || !slugify(slug) || isBodyEmpty(body)) {
      toast.error("Title, URL and Body are required");
      return null;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subTitle", subTitle || "");
    formData.append("slug", slugify(slug));
    formData.append("body", body);
    formData.append("author", author || "");
    formData.append("showAuthor", String(showAuthor));
    formData.append("status", publish ? "Published" : status);
    attachments.forEach((attachment) => {
      if (attachment.file) formData.append("attachments", attachment.file);
      else if (attachment.url) formData.append("keepAttachments", attachment.url);
    });
    // An empty list must still be sent so the server knows every old file was removed.
    if (isEdit && !attachments.some((attachment) => attachment.url)) formData.append("keepAttachments", "");

    try {
      setSaving(true);
      if (isEdit) {
        const { data } = await api.put<BlogPage>(`/pages/${id}`, formData);
        applyPage(data);
        setValue("slug", data.slug);
        toast.success(publish ? "Page published" : "Changes saved");
        return data;
      }
      const { data } = await api.post<BlogPage>("/pages", formData);
      if (!stayOnPage) {
        toast.success(publish ? "Page published" : "Draft saved");
        navigate(`/edit/${data._id}`, { replace: true });
      }
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save page"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (await handleSave(true)) setShowPublishModal(false);
  };

  const scheduleAt = async (pageId: string, publishAt: string | null, successMessage: string) => {
    try {
      const { data } = await api.put<BlogPage>(`/pages/${pageId}/schedule`, { publishAt });
      applyPage(data);
      toast.success(successMessage);
      setShowPublishModal(false);
      setShowUpdateModal(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update schedule"));
    }
  };

  const handleSchedule = async (date: string, time: string) => {
    let publishAt: string;
    try {
      publishAt = mountainDateTimeToUtc(date, time).toISOString();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please select a valid date and time");
      return;
    }
    if (new Date(publishAt).getTime() <= Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }
    // Save the latest content first so the scheduled version is what the user sees now.
    const saved = await handleSave(false, true);
    if (!saved) return;
    await scheduleAt(saved._id, publishAt, `Scheduled for ${formatDate(publishAt, true)}`);
    if (!isEdit) navigate(`/edit/${saved._id}`, { replace: true });
  };

  const secondaryButton = "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 px-6 py-3 backdrop-blur lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/pages" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Back to pages">
            <FiArrowLeft size={18} />
          </Link>
          <h1 className="truncate text-lg font-semibold text-gray-900">{isEdit ? "Edit page" : "New page"}</h1>
          <StatusBadge status={status} />
          {status === "Scheduled" && publishedAt && (
            <span className="hidden text-xs text-gray-500 md:inline">Goes live {formatDate(publishedAt, true)}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEdit && status === "Published" && savedSlug && (
            <Link to={`/blog/${savedSlug}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
              <FiEye size={15} /> View live
            </Link>
          )}
          {isEdit && status !== "Published" && (
            <button onClick={() => window.open(`/preview/${id}`, "_blank", "noopener,noreferrer")} className={secondaryButton}>
              <FiEye size={15} /> Preview
            </button>
          )}
          {status === "Scheduled" && (
            <button onClick={() => setShowUpdateModal(true)} className={secondaryButton}>
              Reschedule
            </button>
          )}
          <button
            onClick={() => void handleSave(false)}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save draft"}
          </button>
          {status !== "Published" && (
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex-1 space-y-6 bg-white px-6 py-6 lg:px-8">
          <div>
            <label className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className="input mt-1 text-base font-medium"
              placeholder="An eye-catching title"
              {...titleField}
              onChange={handleTitleChange}
            />
          </div>

          <div>
            <label className="label">Subtitle</label>
            <input className="input mt-1" placeholder="A one-line summary shown on cards" {...register("subTitle")} />
          </div>

          <div>
            <label className="label">
              Body <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 overflow-hidden rounded-md border">
              <ReactQuill value={body} onChange={setBody} theme="snow" className="editor" modules={quillModules} formats={quillFormats} />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <label className="label">Attachments</label>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4 transition hover:border-brand-500 hover:bg-brand-50/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm">
                <FiUploadCloud size={20} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">Click to upload files</span>
                <span className="text-xs text-gray-500">Images, PDF, Word, Excel or PowerPoint · up to 10 MB each. The first image becomes the cover.</span>
              </span>
              <input type="file" multiple accept={ACCEPTED_FILES} className="hidden" onChange={handleFileChange} />
            </label>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group relative rounded-xl border bg-white p-2 transition hover:shadow-sm">
                    <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                      {attachment.preview ? (
                        <img src={attachment.preview} alt={attachment.name} className="h-full w-full object-cover" />
                      ) : (
                        <FiFile size={28} className="text-gray-400" />
                      )}
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        {fileLabel(attachment.type)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 opacity-100 shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Remove ${attachment.name}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <p className="mt-2 truncate text-xs text-gray-700" title={attachment.name}>
                      {attachment.name}
                    </p>
                    {!attachment.uploaded && <p className="text-[10px] text-brand-500">Uploads on save</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <aside className="space-y-6 border-t bg-gray-50 px-6 py-6 lg:w-80 lg:border-l lg:border-t-0">
          <h3 className="text-base font-semibold text-gray-900">Page settings</h3>

          <div>
            <label className="label">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              className="input mt-1"
              placeholder="my-first-post"
              {...slugField}
              onChange={(event) => {
                setSlugTouched(true);
                void slugField.onChange(event);
              }}
            />
            <p className="mt-1 break-all text-xs text-gray-500">/blog/{slugify(slugValue || "") || "…"}</p>
          </div>

          <div>
            <label className="label">Author</label>
            <input className="input mt-1" placeholder="Defaults to your name" {...register("author")} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded accent-brand-500" {...register("showAuthor")} />
            Show author on the page
          </label>
        </aside>
      </div>

      <PublishModal
        key={showPublishModal ? "open" : "closed"}
        open={showPublishModal}
        busy={saving}
        onClose={() => setShowPublishModal(false)}
        onPublishNow={() => void handlePublishNow()}
        onSchedule={(date, time) => void handleSchedule(date, time)}
      />

      {isEdit && id && (
        <UpdatePublishModal
          key={`${status}-${publishedAt ?? "none"}`}
          open={showUpdateModal}
          status={status}
          publishedAt={publishedAt}
          onClose={() => setShowUpdateModal(false)}
          onReschedule={(iso) => void scheduleAt(id, iso, `Rescheduled for ${formatDate(iso, true)}`)}
          onCancelSchedule={() => void scheduleAt(id, null, "Schedule cancelled – page moved to Draft")}
        />
      )}
    </div>
  );
}
