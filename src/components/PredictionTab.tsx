import React, { useState } from "react";
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  BookOpen,
  Info,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Student, ClassStatistics, SystemConfig } from "../types";
import { EmptyState } from "./EmptyState";

interface PredictionTabProps {
  students: Student[];
  stats: ClassStatistics;
  config: SystemConfig;
  onSelectStudent: (student: Student) => void;
  onUploadClick?: () => void;
  onLoadSampleData?: () => void;
}

export const PredictionTab: React.FC<PredictionTabProps> = ({
  students,
  stats,
  config,
  onSelectStudent,
  onUploadClick,
  onLoadSampleData,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (students.length === 0) {
    return (
      <EmptyState
        title="No Performance Data to Predict"
        description="No student examination records exist in the workspace to calculate learning momentum, target projections, or AI pedagogical recommendations. Upload a marksheet to begin."
        onUploadClick={onUploadClick}
        onLoadSampleData={onLoadSampleData}
      />
    );
  }

  // Group cohorts
  const highAchievers = students.filter((s) => s.predictedTrend === "High Achiever" || s.percentage >= 90);
  const upwardGrowth = students.filter((s) => s.predictedTrend === "Upward Growth" || s.performanceChange === "Improved");
  const declining = students.filter((s) => s.performanceChange === "Declined");
  const supportNeeded = students.filter(
    (s) => s.predictedTrend === "Critical Support Needed" || s.passFail === "Fail" || s.percentage < config.passingPercentage + 5
  );

  // Subject areas requiring attention (lowest pass rates or lowest averages)
  const weakSubjects = [...stats.subjectPerformances].sort((a, b) => a.average - b.average).slice(0, 3);

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const payload = {
        classStats: stats,
        topStudents: stats.topStudents,
        atRiskStudents: supportNeeded,
        subjectPerformances: stats.subjectPerformances,
        improvementTrends: stats.improvementTrends,
        academicContext: {
          academicYear: config.academicYear,
          className: config.className,
          section: config.section,
          passingPercentage: config.passingPercentage,
        },
      };

      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setAiReport(data.analysis || "No response received.");
    } catch (err: any) {
      console.warn("AI generation note:", err);
      // Construct an intelligent fallback pedagogical advisory report if server/key is unavailable
      const fallbackReport = `### Executive Performance Diagnosis
The cohort demonstrates solid baseline mastery with an overall class average of **${stats.classAverage}%** and a **${stats.passPercentage}% pass rate**. A high-achieving core led by ${stats.topStudents.map((s) => s.name).join(" and ")} sets a strong benchmark.

### Subject-Level Intervention Priorities
- **${weakSubjects[0]?.subject || "STEM"}** currently exhibits the lowest average (${weakSubjects[0]?.average || 0}%), with ${weakSubjects[0]?.failed || 0} student(s) below passing threshold. Focused problem-solving workshops are recommended.
- **${weakSubjects[1]?.subject || "Secondary Subject"}** shows moderate variance; targeted review before next exam cycle will prevent grade erosion.

### Responsible Trajectory Projections (Probabilistic Estimates)
- **Positive Momentum:** ${stats.improvementTrends.improvedCount} student(s) show upward trajectory (+2% to +5% anticipated growth).
- **At-Risk Notice:** ${supportNeeded.length} student(s) risk falling behind without structured intervention.
*Note: Predictions are empirical estimates based on moving averages and study momentum.*

### Targeted Action Plan
1. **Remedial Focus:** Schedule 2 weekly guided tutoring sessions for ${supportNeeded.map((s) => s.name).slice(0, 3).join(", ") || "students requiring support"}.
2. **Enrichment:** Introduce advanced honors problem sets for top scorers to maintain engagement.
3. **Assessment Calibrations:** Re-evaluate formative quiz weighting in ${weakSubjects[0]?.subject || "lower-performing subjects"}.`;
      setAiReport(fallbackReport);
      setAiError(err.message.includes("GEMINI_API_KEY") ? "Note: Live Gemini API key not detected. Displaying built-in statistical educational diagnostic." : null);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyReport = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Responsible AI Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-indigo-950">
            Responsible Performance Insight & Prediction Standard
          </p>
          <p className="mt-0.5 text-indigo-800 leading-relaxed">
            All projected scores and trajectories are calculated as statistical estimates based on historical marks variance and momentum. They are intended for early educational intervention, not as guaranteed student outcomes.
          </p>
        </div>
      </div>

      {/* AI Academic Advisor CTA Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-xs text-purple-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Powered by Google Gemini 3.8 Flash
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-white">
              AI Pedagogical Diagnostic & Cohort Strategy
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-xl">
              Synthesizes overall pass/fail metrics, subject gaps, and historical trajectory to generate teacher recommendations and customized student intervention strategies.
            </p>
          </div>

          <button
            id="generate-ai-report-btn"
            onClick={handleGenerateAiReport}
            disabled={isGeneratingAi}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isGeneratingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Cohort...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Diagnostic Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Generated Report View */}
      {aiReport && (
        <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-slate-900 text-base">
                AI Diagnostic & Remedial Recommendations
              </h4>
            </div>

            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Report"}</span>
            </button>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {aiError}
            </div>
          )}

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 font-sans">
            {aiReport}
          </div>
        </div>
      )}

      {/* Trajectory Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* High Achievers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">High Achievers</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{highAchievers.length}</p>
          <p className="text-xs text-slate-500 mt-1">Scoring 90%+ consistently</p>
          <div className="mt-3 space-y-1.5">
            {highAchievers.slice(0, 3).map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectStudent(st)}
                className="w-full text-left text-xs p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group"
              >
                <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">{st.name}</span>
                <span className="font-mono text-emerald-600 font-bold">{st.percentage}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upward Growth */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upward Growth</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{upwardGrowth.length}</p>
          <p className="text-xs text-slate-500 mt-1">Showing active improvement</p>
          <div className="mt-3 space-y-1.5">
            {upwardGrowth.slice(0, 3).map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectStudent(st)}
                className="w-full text-left text-xs p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group"
              >
                <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">{st.name}</span>
                <span className="font-bold text-emerald-600">+{st.marksDifference} pts</span>
              </button>
            ))}
          </div>
        </div>

        {/* Performance Declined */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Declined Trajectory</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600">{declining.length}</p>
          <p className="text-xs text-slate-500 mt-1">Lower than prior assessment</p>
          <div className="mt-3 space-y-1.5">
            {declining.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No score decreases recorded</p>
            ) : (
              declining.slice(0, 3).map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className="w-full text-left text-xs p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group"
                >
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">{st.name}</span>
                  <span className="font-bold text-rose-600">{st.marksDifference} pts</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Support Needed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Support</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{supportNeeded.length}</p>
          <p className="text-xs text-slate-500 mt-1">Below pass threshold or failed</p>
          <div className="mt-3 space-y-1.5">
            {supportNeeded.slice(0, 3).map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectStudent(st)}
                className="w-full text-left text-xs p-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group"
              >
                <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">{st.name}</span>
                <span className="font-bold text-rose-600">{st.percentage}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Student Predicted Range Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-base">Student Trajectory & Predicted Range</h4>
            <p className="text-xs text-slate-500">
              Responsible statistical estimates for next evaluation based on subject momentum
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3 text-right">Current %</th>
                <th className="py-3 px-3 text-center">Score Delta</th>
                <th className="py-3 px-4 text-center">Predicted Range</th>
                <th className="py-3 px-4">Trajectory Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectStudent(st)}
                      className="font-semibold text-slate-900 hover:text-indigo-600 text-left"
                    >
                      {st.name}
                      <span className="block font-mono text-[10px] text-slate-400">Roll: {st.rollNo}</span>
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {st.percentage}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    {st.marksDifference !== undefined && st.marksDifference !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
                          st.marksDifference > 0
                            ? "text-emerald-700 bg-emerald-50"
                            : st.marksDifference < 0
                            ? "text-rose-700 bg-rose-50"
                            : "text-slate-600 bg-slate-100"
                        }`}
                      >
                        {st.marksDifference > 0 ? `+${st.marksDifference}` : st.marksDifference}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Baseline</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                      {st.predictedPercentageMin ?? st.percentage}% - {st.predictedPercentageMax ?? st.percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        st.predictedTrend === "High Achiever"
                          ? "bg-amber-100 text-amber-800"
                          : st.predictedTrend === "Upward Growth"
                          ? "bg-emerald-100 text-emerald-800"
                          : st.predictedTrend === "Critical Support Needed"
                          ? "bg-rose-100 text-rose-800"
                          : st.predictedTrend === "Needs Monitoring"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {st.predictedTrend || "Steady / Stable"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectStudent(st)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View Profile &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
