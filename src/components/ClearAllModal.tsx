import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ClearAllModalProps {
  isOpen: boolean;
  studentCount: number;
  onClose: () => void;
  onConfirmClear: () => void;
}

export const ClearAllModal: React.FC<ClearAllModalProps> = ({
  isOpen,
  studentCount,
  onClose,
  onConfirmClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Remove All Existing Records
              </h3>
              <p className="text-xs text-slate-500">
                Wipe class roster & reset data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Are you sure you want to clear all {studentCount} records?</span>
          </p>
          <p className="text-rose-800 leading-relaxed text-[11px]">
            This will permanently remove all previous student marks, rankings, and arrear registrations from the active workspace. You can start fresh or upload a new spreadsheet.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Tip: You can export your master records as an Excel workbook before clearing if you want to keep a local backup.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-remove-all-records-btn"
            onClick={onConfirmClear}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Remove All Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
