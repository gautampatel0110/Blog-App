import { useState } from "react";
import toast from "react-hot-toast";
import { SCHEDULE_TIME_ZONE_LABEL } from "../utils/mountainTime";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (date: string, time: string) => void;
}

export default function PublishModal({ open, onClose, onPublish }: PublishModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!open) return null;

  const handlePublish = () => {
    if (!date || !time) {
      toast.error("Publish date and time are required");
      return;
    }

    onPublish(date, time);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-900">Publish</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600">
              Publish Date ({SCHEDULE_TIME_ZONE_LABEL})<span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Publish Time ({SCHEDULE_TIME_ZONE_LABEL})<span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md"
          >
            Cancel Publish
          </button>

          <button
            onClick={handlePublish}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
