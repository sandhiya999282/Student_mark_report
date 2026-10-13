import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Student } from "../types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3 text-rose-600">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Delete Student Record</h3>
            <p className="text-xs text-slate-500">This action will remove the student from the class roster.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-800">{student.name}</p>
          <p className="text-slate-500 font-mono">Roll Number: {student.rollNo} • Current Rank: #{student.rank}</p>
          <p className="text-slate-500">Total Marks: {student.totalMarks} ({student.percentage}%)</p>
        </div>

        <p className="text-xs text-slate-600">
          Class statistics, percentages, and rankings will be automatically recalculated immediately.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
