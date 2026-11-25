import { useState } from "react";
import toast from "react-hot-toast";
import { FiCalendar, FiSend, FiX } from "react-icons/fi";
import { mountainDateToday, SCHEDULE_TIME_ZONE_LABEL } from "../utils/mountainTime";

interface PublishModalProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onPublishNow: () => void;
  onSchedule: (date: string, time: string) => void;
}

export default function PublishModal({ open, busy = false, onClose, onPublishNow, onSchedule }: PublishModalProps) {
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (mode === "now") {
      onPublishNow();
      return;
    }
    if (!date || !time) {
      toast.error("Choose a publish date and time");
      return;
    }
    onSchedule(date, time);
  };

  const option = (value: "now" | "schedule", title: string, description: string, Icon: typeof FiSend) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
        mode === value ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/15" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${mode === value ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
        <Icon size={16} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Publish page</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          {option("now", "Publish now", "Your changes are saved and the page goes live immediately.", FiSend)}
          {option("schedule", "Schedule for later", `Pick a date and time (${SCHEDULE_TIME_ZONE_LABEL}).`, FiCalendar)}

          {mode === "schedule" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="block">
                <span className="label">Date</span>
                <input type="date" className="input mt-1" min={mountainDateToday()} value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="block">
                <span className="label">Time</span>
                <input type="time" className="input mt-1" value={time} onChange={(event) => setTime(event.target.value)} />
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Working…" : mode === "now" ? "Publish now" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
