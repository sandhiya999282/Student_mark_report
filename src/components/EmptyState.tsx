import React from "react";
import { Upload, Plus, FileSpreadsheet, Sparkles } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  onUploadClick?: () => void;
  onAddNewStudent?: () => void;
  onLoadSampleData?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  onUploadClick,
  onAddNewStudent,
  onLoadSampleData,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
        <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
      </div>

      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Excel / CSV</span>
          </button>
        )}

        {onAddNewStudent && (
          <button
            onClick={onAddNewStudent}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Manually</span>
          </button>
        )}

        {onLoadSampleData && (
          <button
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200/70 transition-colors"
            title="Load sample demo records to preview features"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Demo Data</span>
          </button>
        )}
      </div>
    </div>
  );
};
