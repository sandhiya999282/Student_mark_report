import React from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  UserPlus,
  Users,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { ComparisonSummary, ValidationIssue } from "../types";

interface UpdateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApply: (mode: "merge" | "replace") => void;
  comparison: ComparisonSummary | null;
  validationIssues: ValidationIssue[];
  fileName?: string;
  existingStudentCount?: number;
}

export const UpdateComparisonModal: React.FC<UpdateComparisonModalProps> = ({
  isOpen,
  onClose,
  onConfirmApply,
  comparison,
  validationIssues,
  fileName,
  existingStudentCount = 0,
}) => {
  if (!isOpen || !comparison) return null;

  const totalChanges =
    comparison.newStudents.length +
    comparison.updatedStudents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Review Detected Excel Updates
              </h3>
              <p className="text-xs text-slate-500">
                {comparison.termTitle} {fileName ? `• ${fileName}` : ""}
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

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Total In File</p>
              <p className="text-xl font-bold text-slate-800">{comparison.totalUploaded}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <p className="text-xs text-indigo-600 font-semibold">Marks Updated</p>
              <p className="text-xl font-bold text-indigo-700">{comparison.updatedStudents.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <p className="text-xs text-blue-600 font-semibold">New Students</p>
              <p className="text-xl font-bold text-blue-700">{comparison.newStudents.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-xs text-emerald-600 font-semibold">Unchanged</p>
              <p className="text-xl font-bold text-emerald-700">{comparison.unchangedStudents.length}</p>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {validationIssues.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{validationIssues.length} Validation Notice(s) Detected</span>
              </div>
              <p className="text-amber-800">
                The file contains minor notices that have been handled cleanly:
              </p>
              <div className="max-h-24 overflow-y-auto space-y-1 pl-1">
                {validationIssues.map((issue) => (
                  <p key={issue.id} className="text-amber-700 font-mono text-[11px]">
                    • Row {issue.row}: {issue.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Marks Differences Table */}
          {comparison.updatedStudents.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2 flex items-center justify-between">
                <span>Students with Changed Marks ({comparison.updatedStudents.length})</span>
                <span className="text-xs font-normal text-slate-500">Historical records preserved</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3 text-right">Previous Marks</th>
                      <th className="py-2.5 px-3 text-right">New Marks</th>
                      <th className="py-2.5 px-3 text-right">Difference</th>
                      <th className="py-2.5 px-3 text-center">Rank Shift</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparison.updatedStudents.map((item) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.student.name}
                          <span className="block font-mono text-[10px] text-slate-400">
                            Roll: {item.student.rollNo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {item.prevMarks} ({item.prevPercentage}%)
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {item.newMarks} ({item.newPercentage}%)
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {item.diff > 0 ? (
                            <span className="text-emerald-600">+{item.diff}</span>
                          ) : (
                            <span className="text-rose-600">{item.diff}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-slate-600">
                            #{item.prevRank} &rarr; #{item.newRank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.status === "Improved"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "Declined"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status === "Improved" && <ArrowUpRight className="w-3 h-3" />}
                            {item.status === "Declined" && <ArrowDownRight className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* New Students Detected */}
          {comparison.newStudents.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2">
                New Students Added ({comparison.newStudents.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {comparison.newStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{st.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Roll: {st.rollNo}</p>
                    </div>
                    <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {st.percentage}% (Grade {st.grade})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Automatic Master Record Synchronization</p>
              <p className="mt-0.5">
                Applying updates will preserve historical assessments, recalculate class rankings, and refresh the dashboard. Existing student history is safely preserved.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors order-last sm:order-first"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {existingStudentCount > 0 && (
              <button
                type="button"
                id="replace-all-records-modal-btn"
                onClick={() => onConfirmApply("replace")}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-300 rounded-xl transition-all"
                title="Wipe previous records and import only this file's students"
              >
                <span>Replace Previous Records ({comparison.totalUploaded})</span>
              </button>
            )}

            <button
              type="button"
              id="confirm-apply-updates-btn"
              onClick={() => onConfirmApply(existingStudentCount > 0 ? "merge" : "replace")}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {existingStudentCount > 0
                  ? "Merge with Existing Records"
                  : `Import ${comparison.totalUploaded} Records`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
