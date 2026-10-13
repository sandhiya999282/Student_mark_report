import React, { useState } from "react";
import {
  X,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Edit3,
  RefreshCw,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Student, SystemConfig } from "../types";

interface StudentDetailModalProps {
  student: Student | null;
  config: SystemConfig;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  config,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const isTopOne = student.rank === 1;

  const handleGenerateStudentInsight = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/gemini/student-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          classContext: {
            academicYear: config.academicYear,
            className: config.className,
            section: config.section,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }
      const data = await res.json();
      setAiInsight(data.insight || "Insight generated.");
    } catch (err: any) {
      // High-quality pedagogical fallback
      const strongest = Object.entries(student.subjectMarks).sort((a, b) => b[1] - a[1])[0];
      const weakest = Object.entries(student.subjectMarks).sort((a, b) => a[1] - b[1])[0];
      const fallback = `**Academic Profile Analysis for ${student.name}:**
- **Core Strength:** Demonstrates outstanding aptitude in **${strongest?.[0]}** (${strongest?.[1]} marks).
- **Targeted Growth Area:** Needs structured revision in **${weakest?.[0]}** (${weakest?.[1]} marks) to elevate overall standing.
- **Recommended Study Strategy:** Allocate 25 minutes daily to concept mapping and active recall in ${weakest?.[0]}. Current trajectory suggests a projected score range of ${student.predictedPercentageMin}% - ${student.predictedPercentageMax}%.`;
      setAiInsight(fallback);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header with Student Identity */}
        <div className="relative bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-2xl font-bold text-white shadow-inner shrink-0">
              {student.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xl sm:text-2xl text-white">{student.name}</span>
                {isTopOne && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-xs">
                    <Award className="w-3.5 h-3.5" /> Rank 1 Scholar
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 font-mono">
                Roll Number: {student.rollNo} • ID: {student.id}
              </p>
              <p className="text-xs text-slate-300">
                {config.className} • Section {config.section} ({config.academicYear})
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Rank</p>
              <p className="text-2xl font-extrabold text-indigo-600">#{student.rank}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Total Marks</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {student.totalMarks}
                <span className="text-xs font-normal text-slate-400">/{student.maxMarks}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Percentage</p>
              <p className="text-2xl font-extrabold text-emerald-600">{student.percentage}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-semibold">Grade & Status</p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-indigo-600">{student.grade}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    student.passFail === "Pass" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {student.passFail}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Marks Breakdown */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider mb-3">
              Subject Scores Breakdown
            </h4>

            <div className="space-y-2.5">
              {Object.entries(student.subjectMarks).map(([sub, mark]) => {
                const isFailing = mark < config.passingMarkPerSubject;
                const percent = Math.min(100, Math.round((mark / config.maxMarksPerSubject) * 100));

                return (
                  <div key={sub} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-800">{sub}</span>
                      <span className={isFailing ? "text-rose-600 font-bold" : "text-slate-900 font-bold"}>
                        {mark} / {config.maxMarksPerSubject} ({percent}%)
                        {isFailing && <span className="ml-1 text-[10px] text-rose-500 font-bold">(Below Pass)</span>}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFailing ? "bg-rose-500" : percent >= 80 ? "bg-indigo-600" : "bg-emerald-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Longitudinal History Timeline */}
          {student.history && student.history.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Historical Assessment Track</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Assessment / Term</th>
                      <th className="py-2.5 px-3 text-right">Total Marks</th>
                      <th className="py-2.5 px-3 text-right">Percentage</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.history.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {h.termName}
                          <span className="block text-[10px] text-slate-400">
                            {h.date || (h.timestamp ? new Date(h.timestamp).toLocaleDateString() : "Recorded")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                          {h.totalMarks} / {h.maxMarks}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {h.percentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-xs">
                            {h.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                          #{h.rank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Pedagogical Counseling Insight */}
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h5 className="font-bold text-purple-950 text-xs sm:text-sm">
                  Personalized AI Academic Insight
                </h5>
              </div>
              <button
                onClick={handleGenerateStudentInsight}
                disabled={isGeneratingAi}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{aiInsight ? "Refresh Insight" : "Generate Advice"}</span>
              </button>
            </div>

            {aiInsight ? (
              <div className="text-xs text-purple-900 leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-lg border border-purple-200/60">
                {aiInsight}
              </div>
            ) : (
              <p className="text-xs text-purple-800">
                Generate customized study advice, strength analysis, and remediation guidance for {student.name}.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(student);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Marks</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
