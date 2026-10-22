import { useState } from "react";
import type { PageStatus } from "../types";
import { mountainDateTimeParts, mountainDateTimeToUtc, mountainDateToday, SCHEDULE_TIME_ZONE_LABEL } from "../utils/mountainTime";

interface UpdatePublishModalProps {
  open: boolean;
  status: PageStatus;
  publishedAt: string | null;
  onClose: () => void;
  onReschedule: (newPublishAtISO: string) => void;
  onCancelSchedule: () => void;
}

export default function UpdatePublishModal({
  open,
  status,
  publishedAt,          // ISO string from backend
  onClose,
  onReschedule,        // (newPublishAt: ISO string) => void
  onCancelSchedule,    // () => void
}: UpdatePublishModalProps) {
  const [date, setDate] = useState(() => publishedAt ? mountainDateTimeParts(publishedAt).date : "");
  const [time, setTime] = useState(() => publishedAt ? mountainDateTimeParts(publishedAt).time : "");

  if (!open) return null;

  const handleReschedule = () => {
    if (!date || !time) {
      alert("Please select both date and time");
      return;
    }
    let scheduledInstant: Date;
    try {
      scheduledInstant = mountainDateTimeToUtc(date, time);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Please enter a valid Mountain date and time");
      return;
    }
    onReschedule(scheduledInstant.toISOString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-900">
            Update Schedule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {status === "Scheduled" ? (
            <>
              <div>
                <label className="text-sm text-gray-600">
                  Publish Date ({SCHEDULE_TIME_ZONE_LABEL})
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={mountainDateToday()}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Publish Time ({SCHEDULE_TIME_ZONE_LABEL})
                </label>
                <input
                  type="time"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </>
          ) : status === "Published" ? (
            <p className="text-gray-600 text-center py-4">
              This page is already published and cannot be rescheduled.
            </p>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No schedule found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          {status === "Scheduled" && (
            <>
              <button
                onClick={onCancelSchedule}
                className="px-5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Cancel Schedule
              </button>

              <button
                onClick={handleReschedule}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Schedule
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
