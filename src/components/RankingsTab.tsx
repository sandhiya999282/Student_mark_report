import React from "react";
import {
  Award,
  Sparkles,
  Trophy,
  Medal,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
} from "lucide-react";
import { Student, SystemConfig } from "../types";
import { EmptyState } from "./EmptyState";

interface RankingsTabProps {
  students: Student[];
  config: SystemConfig;
  onSelectStudent: (student: Student) => void;
  onUploadClick?: () => void;
  onLoadSampleData?: () => void;
}

export const RankingsTab: React.FC<RankingsTabProps> = ({
  students,
  config,
  onSelectStudent,
  onUploadClick,
  onLoadSampleData,
}) => {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No Rankings Available"
        description="No student records exist to calculate class rankings. Upload your examination marksheet to compute standings, distinguish top performers, and review score distribution."
        onUploadClick={onUploadClick}
        onLoadSampleData={onLoadSampleData}
      />
    );
  }

  // Sort students strictly by rank ascending
  const rankedStudents = [...students].sort((a, b) => a.rank - b.rank);
  const topScorers = rankedStudents.filter((s) => s.rank === 1);
  const isTiedRank1 = topScorers.length > 1;

  return (
    <div className="space-y-6">
      {/* Top Scorer Hero Banner */}
      <div className="bg-gradient-to-br from-amber-500/15 via-indigo-500/10 to-amber-500/5 rounded-2xl border border-amber-300/50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {isTiedRank1 ? `Rank 1 Co-Champions (${topScorers.length} Tied)` : "Class Valedictorian • Rank 1"}
                </span>
                <span className="text-xs text-slate-500">Gold Honor Roll</span>
              </div>

              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                {topScorers.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectStudent(st)}
                    className="group flex items-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <span className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 underline-offset-4 group-hover:underline">
                      {st.name}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                      Roll: {st.rollNo}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-600 mt-1">
                Highest aggregated score:{" "}
                <strong className="text-slate-900 font-bold">{topScorers[0]?.totalMarks} marks</strong> ({topScorers[0]?.percentage}%) • Grade {topScorers[0]?.grade}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 text-xs text-slate-600 shrink-0 max-w-xs">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Ranking Algorithm Applied
            </p>
            <p className="mt-1 text-[11px] leading-normal text-slate-500">
              {config.rankingMethod === "competition"
                ? "Standard Competition Ranking (1-2-2-4): Tied scores share the higher rank; subsequent rank skips positions."
                : "Dense Ranking (1-2-2-3): Tied scores share the rank; subsequent rank continues sequentially without gaps."}
            </p>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rankedStudents.slice(0, 3).map((st, idx) => {
          const medalColors = [
            { bg: "from-amber-500 to-yellow-400", border: "border-amber-300", text: "text-amber-700", label: "1st Place (Gold)" },
            { bg: "from-slate-400 to-slate-300", border: "border-slate-300", text: "text-slate-700", label: "2nd Place (Silver)" },
            { bg: "from-amber-700 to-amber-600", border: "border-amber-700/30", text: "text-amber-800", label: "3rd Place (Bronze)" },
          ][idx] || { bg: "from-indigo-500 to-indigo-400", border: "border-indigo-200", text: "text-indigo-700", label: "Top Scholar" };

          return (
            <div
              key={st.id}
              onClick={() => onSelectStudent(st)}
              className={`p-5 rounded-2xl bg-white border ${medalColors.border} shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${medalColors.text}`}>
                  {medalColors.label}
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-100 font-extrabold text-slate-800 flex items-center justify-center text-sm">
                  #{st.rank}
                </span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                {st.name}
              </h4>
              <p className="font-mono text-xs text-slate-500">Roll Number: {st.rollNo}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Marks</p>
                  <p className="font-bold text-slate-900 text-base">{st.totalMarks} / {st.maxMarks}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Percentage</p>
                  <p className="font-extrabold text-emerald-600 text-base">{st.percentage}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-base">Class Leaderboard</h4>
            <p className="text-xs text-slate-500">
              Ordered by overall marks according to {config.rankingMethod} ranking rule
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {rankedStudents.length} Students Ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-20">Rank</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3 font-mono">Roll Number</th>
                <th className="py-3 px-4 text-right">Total Marks</th>
                <th className="py-3 px-4 text-right">Percentage</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Previous Rank</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedStudents.map((st) => {
                const isTopScorer = st.rank === 1;
                return (
                  <tr
                    key={st.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isTopScorer ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold">
                      {isTopScorer ? (
                        <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                          1
                        </span>
                      ) : st.rank <= 3 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs">
                          {st.rank}
                        </span>
                      ) : (
                        <span className="text-slate-600 pl-2">#{st.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectStudent(st)}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-left flex items-center gap-1.5"
                      >
                        <span>{st.name}</span>
                        {isTopScorer && <Award className="w-3.5 h-3.5 text-amber-500" />}
                      </button>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {st.rollNo}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {st.totalMarks} <span className="font-normal text-slate-400 text-xs">/{st.maxMarks}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {st.percentage}%
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {st.grade}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {st.previousRank ? (
                        <span className="text-xs text-slate-600 flex items-center justify-center gap-1">
                          #{st.previousRank}
                          {st.rankDifference !== undefined && st.rankDifference !== null && (
                            <span
                              className={`text-[11px] font-bold ${
                                st.rankDifference > 0
                                  ? "text-emerald-600"
                                  : st.rankDifference < 0
                                  ? "text-rose-600"
                                  : "text-slate-400"
                              }`}
                            >
                              ({st.rankDifference > 0 ? `+${st.rankDifference}` : st.rankDifference === 0 ? "=" : st.rankDifference})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(st)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Profile &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
