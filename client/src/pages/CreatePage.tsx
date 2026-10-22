import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill-new";
import { FiMoreVertical } from "react-icons/fi";
import "react-quill-new/dist/quill.snow.css";
import api from "../services/api";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import PublishModal from "../components/PublishModal";
import UpdatePublishModal from "../components/UpdatePublishModal";
import { usePublishedPageEvents } from "../services/publishingContext";
import type { BlogPage, PageAttachmentDraft, PageFormValues, PageStatus } from "../types";
import { mountainDateTimeToUtc } from "../utils/mountainTime";


const quillModules = {
  toolbar: [
    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormats = [
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "align",
  "list",
  "link",
  "image",
];

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function CreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { register, setValue, getValues, reset } = useForm<PageFormValues>({
    defaultValues: {
      title: "",
      subTitle: "",
      slug: "",
      author: "",
      showAuthor: true,
    },
  });

  const [status, setStatus] = useState<PageStatus>("Draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PageAttachmentDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const publishedEvents = usePublishedPageEvents();

  useEffect(() => {
    if (!isEdit) {
      reset();
      setBody("");
      setAttachments([]);
      setStatus("Draft");
      setPublishedAt(null);
      return;
    }

    const fetchPage = async () => {
      try {
        const res = await api.get<BlogPage>(`/pages/${id}`);
        const p = res.data;

        setValue("title", p.title || "");
        setValue("subTitle", p.subTitle || "");
        setValue("slug", p.slug || "");
        setValue("author", p.author || (typeof p.createdBy === "object" ? p.createdBy?.name ?? "" : ""));
        setValue("showAuthor", p.showAuthor ?? true);
        setStatus(p.status || "Draft");
        setPublishedAt(p.publishedAt || null);

        setBody(p.body || "");
        setAttachments(
          (p.attachments || []).map((a) => ({
            id: crypto.randomUUID(),
            file: null,
            preview: a.url,
            uploaded: true,
          })),
        );
      } catch (err) {
        toast.error("Failed to load page");
        console.error("Load page error:", err);
      }
    };

    fetchPage();
  }, [id, isEdit, reset, setValue]);

  useEffect(() => {
    const event = [...publishedEvents].reverse().find((item) => item.pageId === id);
    if (id && event && status !== "Published") {
      setStatus("Published");
      setPublishedAt(event.publishedAt);
      setShowUpdateModal(false);
      toast.success(`“${event.title}” is now published`);
    }
  }, [id, publishedEvents, status]);

  const statusStyles: Record<PageStatus, string> = {
    Draft: "bg-yellow-100 text-yellow-700",
    Scheduled: "bg-blue-100 text-blue-700",
    Published: "bg-green-100 text-green-700",
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files ?? []);
    if (!files.length) return;

    const newFiles: PageAttachmentDraft[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      uploaded: false,
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleSave = async (publish = false) => {
    const { title, subTitle, slug } = getValues();

    if (!title || !slug || !body) {
      toast.error("Title, URL and Body are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subTitle", subTitle || "");
    formData.append("slug", slug);
    formData.append("body", body);
    formData.append("author", getValues("author") || "");
    formData.append("showAuthor", String(getValues("showAuthor")));
    formData.append("status", publish ? "Published" : status);

    attachments.forEach((a) => {
      if (a.file) formData.append("attachments", a.file);
      else if (a.uploaded && a.preview) formData.append("keepAttachments", a.preview);
    });

    try {
      setSaving(true);

      if (isEdit) {
        await api.put(`/pages/${id}`, formData);
        toast.success(publish ? "Page published" : "Page updated");
      } else {
        await api.post("/pages", formData);
        toast.success("Page created successfully!");

        // Clear form
        reset();
        setBody("");
        setAttachments([]);
        setStatus("Draft");
        setPublishedAt(null);

        // Safe navigation after current render cycle
        setTimeout(() => {
          navigate("/pages");
        }, 0);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(getErrorMessage(error, "Failed to save page"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/pages");
  };

  const refreshPageData = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get<BlogPage>(`/pages/${id}`);
      const p = res.data;
      setStatus(p.status || "Draft");
      setPublishedAt(p.publishedAt || null);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const handleSchedulePublish = async (date: string, time: string) => {
    if (!date || !time) {
      toast.error("Please select both date and time");
      return;
    }

    let publishAt: string;
    try {
      publishAt = mountainDateTimeToUtc(date, time).toISOString();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please select a valid Mountain date and time");
      return;
    }

    try {
      await api.put(`/pages/${id}/schedule`, { publishAt });
      toast.success("Page scheduled successfully");
      setShowPublishModal(false);
      await refreshPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to schedule page"));
    }
  };

  const handleUpdateSchedule = async (newPublishAtISO: string) => {
    try {
      await api.put(`/pages/${id}/schedule`, { publishAt: newPublishAtISO });
      toast.success("Schedule updated successfully");
      setShowUpdateModal(false);
      await refreshPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update schedule"));
    }
  };

  const handleCancelSchedule = async () => {
    try {
      await api.put(`/pages/${id}/schedule`, { publishAt: null });
      toast.success("Schedule cancelled – page moved to Draft");
      setShowUpdateModal(false);
      await refreshPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel schedule"));
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit Page" : "Create Page"}
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              statusStyles[status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex gap-3">
          {isEdit && (
            <div className="relative group">
              <FiMoreVertical className="text-gray-600 cursor-pointer" />
              <div className="absolute right-0 top-6 hidden group-hover:block bg-white border rounded-md shadow-lg z-20">
                <button
                  onClick={() => window.open(`/preview/${id}`, "_blank", "noopener,noreferrer")}
                  className="px-4 py-2 text-sm hover:bg-gray-50 w-full text-left"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>

          {!isEdit && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 text-sm bg-[#5B4CF5] text-white rounded-md hover:bg-[#4a3de0] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}

          {isEdit && (
            <>
              <button
                onClick={() => setShowUpdateModal(true)}
                disabled={status !== "Scheduled"}
                className={`px-5 py-2 text-sm rounded-md transition ${
                  status === "Scheduled"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Update
              </button>

              <button
                onClick={() => setShowPublishModal(true)}
                className="px-5 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {status === "Scheduled" ? "Publish" : "Publish"}
              </button>

              <PublishModal
                open={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onPublish={handleSchedulePublish}
              />

              <UpdatePublishModal
                key={`${status}-${publishedAt ?? "none"}`}
                open={showUpdateModal}
                status={status}
                publishedAt={publishedAt}
                onClose={() => setShowUpdateModal(false)}
                onReschedule={handleUpdateSchedule}
                onCancelSchedule={handleCancelSchedule}
              />
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 px-8 py-6 space-y-6 overflow-y-auto bg-white">
          <div>
            <label className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input className="input mt-1" {...register("title")} />
          </div>

          <div>
            <label className="label">Sub Title</label>
            <input className="input mt-1" {...register("subTitle")} />
          </div>

          <div>
            <label className="label">
              Body <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 border rounded-md overflow-hidden">
              <ReactQuill
                value={body}
                onChange={setBody}
                theme="snow"
                className="editor"
                modules={quillModules}
                formats={quillFormats}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <label className="label">Attachments</label>

            <label className="flex items-center justify-between cursor-pointer px-4 py-3 border border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Choose files
                </span>
                <span className="text-xs text-gray-500">
                  Click to upload or select multiple files
                </span>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {attachments.length > 0 && (
              <div className="max-h-64 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                  {attachments.map(({ id, file, preview }) => (
                    <div
                      key={id}
                      className="border rounded-lg p-2 bg-white hover:shadow-sm transition"
                    >
                      <div className="relative h-24 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        {preview ? (
                          <img
                            src={preview}
                            alt={file?.name || "attachment"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">
                            FILE
                          </span>
                        )}

                        <span className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {file?.type?.startsWith("image/")
                            ? "IMAGE"
                            : file?.type === "application/pdf"
                            ? "PDF"
                            : "FILE"}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-700 truncate">
                        {file?.name || "Uploaded file"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Supported: JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l px-6 py-6 space-y-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Configurations
          </h3>

          <div>
            <label className="label">
              URL <span className="text-red-500">*</span>
            </label>
            <input className="input mt-1" {...register("slug")} />
          </div>

          <div>
            <label className="label">Author</label>
            <input className="input mt-1" {...register("author")} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("showAuthor")} />
            <span className="text-sm">Show Author</span>
          </div>
        </div>
      </div>
    </div>
  );
}
