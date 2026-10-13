import React, { useState } from "react";
import { X, Save, Sliders, RotateCcw, HelpCircle } from "lucide-react";
import { SystemConfig } from "../types";
import { DEFAULT_CONFIG } from "../utils/defaults";

interface SettingsModalProps {
  isOpen: boolean;
  config: SystemConfig;
  onClose: () => void;
  onSave: (newConfig: SystemConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              Grading, Passing & Ranking Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Class Metadata */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
              Academic Cohort Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade</label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Passing Criteria */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
              Passing Rules & Thresholds
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passing Mark Per Subject
                </label>
                <input
                  type="number"
                  min={1}
                  max={formData.maxMarksPerSubject}
                  value={formData.passingMarkPerSubject}
                  onChange={(e) =>
                    setFormData({ ...formData, passingMarkPerSubject: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">e.g. 40 out of 100</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Passing Percentage (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.passingPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, passingPercentage: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">e.g. 40%</span>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pass / Fail Evaluation Strategy
              </label>
              <select
                value={formData.passingRule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passingRule: e.target.value as "all_subjects" | "overall_percentage" | "both",
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
              >
                <option value="both">Both: Must pass all individual subjects AND reach overall percentage</option>
                <option value="all_subjects">All Subjects: Must pass every subject individually</option>
                <option value="overall_percentage">Overall: Based strictly on total aggregate percentage</option>
              </select>
            </div>
          </div>

          {/* Ranking Algorithm */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
              Ranking Method
            </h4>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="rankingMethod"
                  value="competition"
                  checked={formData.rankingMethod === "competition"}
                  onChange={() => setFormData({ ...formData, rankingMethod: "competition" })}
                  className="mt-0.5 text-indigo-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Standard Competition Ranking (1-2-2-4)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tied students receive identical ranks, and subsequent student skips ranks according to cohort count.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="rankingMethod"
                  value="dense"
                  checked={formData.rankingMethod === "dense"}
                  onChange={() => setFormData({ ...formData, rankingMethod: "dense" })}
                  className="mt-0.5 text-indigo-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Dense Ranking (1-2-2-3)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tied students receive identical ranks, and the next student receives the immediate next sequential rank number.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Grading Scale */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
              Grade Thresholds (% Scale)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {formData.gradeScale.map((item, index) => (
                <div key={item.grade} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">Grade {item.grade}</span>
                    <span className="text-[10px] text-slate-400 font-mono">&ge;</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.minPercentage}
                    onChange={(e) => {
                      const newScale = [...formData.gradeScale];
                      newScale[index] = { ...item, minPercentage: Number(e.target.value) };
                      setFormData({ ...formData, gradeScale: newScale });
                    }}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save & Apply Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
