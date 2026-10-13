import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Award, Sparkles, TrendingUp, Star } from "lucide-react";
import { Student } from "../types";

interface TopStudentCelebrationProps {
  topStudents: Student[];
  onSelectStudent?: (student: Student) => void;
}

export const TopStudentCelebration: React.FC<TopStudentCelebrationProps> = ({
  topStudents,
  onSelectStudent,
}) => {
  useEffect(() => {
    // Subtle celebratory confetti on mount if top students exist
    if (topStudents.length > 0) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.25 },
          colors: ["#6366f1", "#eab308", "#10b981", "#3b82f6"],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if canvas is restricted
      }
    }
  }, [topStudents]);

  if (!topStudents || topStudents.length === 0) return null;

  const isTied = topStudents.length > 1;

  return (
    <div
      id="top-student-card"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-emerald-500/10 border border-amber-300/40 p-5 sm:p-6 shadow-sm mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {isTied ? `Tied Rank 1 (${topStudents.length} Students)` : "Top Ranked Student • Rank 1"}
              </span>
              <span className="text-xs text-slate-500 font-medium">Highest Overall Score</span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              {topStudents.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStudent && onSelectStudent(st)}
                  className="text-left group flex items-center gap-2 hover:opacity-90 transition-opacity"
                  title="Click to view student report"
                >
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 underline-offset-4 group-hover:underline">
                    {st.name}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-white/80 rounded border border-slate-200 text-slate-600">
                    Roll: {st.rollNo}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-600 mt-1">
              {isTied
                ? "Multiple students tied for first mark. All highest scorers are honored equally."
                : "Top academic standing with exemplary subject comprehension across the cohort."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/80 shrink-0">
          <div className="text-center px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Marks</p>
            <p className="text-xl font-extrabold text-indigo-700">
              {topStudents[0]?.totalMarks}
              <span className="text-xs font-normal text-slate-400">/{topStudents[0]?.maxMarks}</span>
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Percentage</p>
            <p className="text-xl font-extrabold text-emerald-600">
              {topStudents[0]?.percentage}%
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Grade</p>
            <span className="inline-block px-2.5 py-0.5 rounded-md text-sm font-bold bg-amber-500 text-white shadow-sm">
              {topStudents[0]?.grade}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
