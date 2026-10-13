import React from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  BookOpen,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { ClassStatistics, Student, SystemConfig } from "../types";
import { TopStudentCelebration } from "./TopStudentCelebration";
import { EmptyState } from "./EmptyState";

interface DashboardTabProps {
  stats: ClassStatistics;
  config: SystemConfig;
  onSelectStudent: (student: Student) => void;
  onFilterTab: (filterType: string) => void;
  onNavigateToArrears?: () => void;
  onUploadClick?: () => void;
  onAddNewStudent?: () => void;
  onLoadSampleData?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  config,
  onSelectStudent,
  onFilterTab,
  onNavigateToArrears,
  onUploadClick,
  onAddNewStudent,
  onLoadSampleData,
}) => {
  const GRADE_COLORS: Record<string, string> = {
    "A+": "#4f46e5",
    A: "#06b6d4",
    B: "#10b981",
    C: "#f59e0b",
    D: "#f97316",
    F: "#ef4444",
  };

  if (stats.totalStudents === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Student Records in Workspace"
          description="Your class workspace is currently clean with zero records. Upload an Excel or CSV marksheet to analyze student marks, class ranks, performance predictions, and arrear lists."
          onUploadClick={onUploadClick}
          onAddNewStudent={onAddNewStudent}
          onLoadSampleData={onLoadSampleData}
        />
      </div>
    );
  }

  const passFailChartData = [
    { name: "Passed", value: stats.passedStudents, color: "#10b981" },
    { name: "Failed", value: stats.failedStudents, color: "#ef4444" },
  ];

  const atRiskStudents = stats.lowestStudents.filter((s) => s.passFail === "Fail" || s.percentage < config.passingPercentage + 10);

  return (
    <div className="space-y-6">
      {/* 1. Top Student Celebration Showcase */}
      <TopStudentCelebration
        topStudents={stats.topStudents}
        onSelectStudent={onSelectStudent}
      />

      {/* 2. Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          id="kpi-total-students"
          onClick={() => onFilterTab("all")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">Enrolled</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Active cohort in {config.className}
          </p>
        </div>

        {/* Pass Rate */}
        <div
          id="kpi-pass-rate"
          onClick={() => onFilterTab("passed")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.passPercentage}%</span>
            <span className="text-xs font-medium text-slate-500">
              ({stats.passedStudents} passed)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.passPercentage)}%` }}
            />
          </div>
        </div>

        {/* Fail Rate */}
        <div
          id="kpi-fail-rate"
          onClick={() => onFilterTab("failed")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-rose-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Need Support</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{stats.failedStudents}</span>
            <span className="text-xs font-medium text-slate-500">
              ({stats.failPercentage}%)
            </span>
          </div>
          <p className="text-xs text-rose-600 mt-2 font-medium">
            Passing threshold: {config.passingPercentage}%
          </p>
        </div>

        {/* Class Average */}
        <div
          id="kpi-class-average"
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Class Average</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.classAverage}%</span>
            <span className="text-xs text-slate-500 font-medium">Mean Score</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Low: {stats.lowestMark}</span>
            <span>High: {stats.highestMark}</span>
          </div>
        </div>
      </div>

      {/* 3. Performance Trends & Subject Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Performance Bars */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Subject Performance Overview</h3>
              <p className="text-xs text-slate-500">Class averages and highest scores across subjects</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {stats.subjectPerformances.length} Subjects Analyzed
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.subjectPerformances}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  domain={[0, config.maxMarksPerSubject]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-800 space-y-1">
                          <p className="font-bold text-sm text-indigo-300">{data.subject}</p>
                          <p>Average: <span className="font-semibold">{data.average} / {data.maxMarks}</span></p>
                          <p>Highest Mark: <span className="font-semibold text-emerald-400">{data.highest}</span> ({data.highestScorers?.join(", ") || "N/A"})</p>
                          <p>Lowest Mark: <span className="font-semibold text-rose-400">{data.lowest}</span></p>
                          <p>Pass Rate: <span className="font-semibold text-amber-300">{data.passRate}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="average"
                  name="Class Average"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Mini Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            {stats.subjectPerformances.map((sub) => (
              <div
                key={sub.subject}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 truncate max-w-[120px]">{sub.subject}</p>
                  <p className="text-[11px] text-slate-500">Pass: {sub.passRate}%</p>
                </div>
                <span className="font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {sub.average}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Grade Distribution</h3>
                <p className="text-xs text-slate-500">Cohort marks categorized by scale</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.gradeDistribution.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: GRADE_COLORS[item.grade] || "#94a3b8" }}
                      />
                      Grade {item.grade}
                      <span className="font-normal text-slate-400">(&ge;{item.minPercentage}%)</span>
                    </span>
                    <span className="text-slate-800">
                      {item.count} <span className="font-normal text-slate-500">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: GRADE_COLORS[item.grade] || "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pass vs Fail Summary Donut */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFailChartData}
                      dataKey="value"
                      innerRadius={15}
                      outerRadius={24}
                      paddingAngle={4}
                    >
                      {passFailChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pass / Fail Ratio</p>
                <p className="text-[11px] text-slate-500">
                  {stats.passedStudents} passed • {stats.failedStudents} failed
                </p>
              </div>
            </div>

            <button
              onClick={() => onFilterTab("failed")}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              View At-Risk ({stats.failedStudents})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Update Momentum & Students Requiring Support Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Momentum / Update Shift */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-1">Performance Dynamics</h3>
          <p className="text-xs text-slate-500 mb-4">Trajectory compared to prior assessment records</p>

          <div className="grid grid-cols-3 gap-3">
            <div
              onClick={() => onFilterTab("improved")}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center cursor-pointer hover:bg-emerald-100/70 transition-colors"
            >
              <div className="flex items-center justify-center text-emerald-600 mb-1">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <p className="text-xl font-extrabold text-emerald-700">
                {stats.improvementTrends.improvedCount}
              </p>
              <p className="text-[11px] font-semibold text-emerald-800">Improved</p>
            </div>

            <div
              onClick={() => onFilterTab("declined")}
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center justify-center text-rose-600 mb-1">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <p className="text-xl font-extrabold text-rose-700">
                {stats.improvementTrends.declinedCount}
              </p>
              <p className="text-[11px] font-semibold text-rose-800">Declined</p>
            </div>

            <div
              onClick={() => onFilterTab("all")}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xl font-extrabold text-slate-700">
                {stats.improvementTrends.stableCount + stats.improvementTrends.newCount}
              </p>
              <p className="text-[11px] font-semibold text-slate-600">Stable / New</p>
            </div>
          </div>
        </div>

        {/* Priority Academic Support Roster */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">Academic Support Alert</h3>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToArrears && (
                <button
                  id="dashboard-open-arrear-list-btn"
                  onClick={onNavigateToArrears}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                  title="Open Subject-wise and Student-wise Arrear List"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Arrear List ({stats.failedStudents}) &rarr;</span>
                </button>
              )}
              <button
                onClick={() => onFilterTab("failed")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                View In Table &rarr;
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Students who scored below the {config.passingPercentage}% passing threshold or failed specific subjects:
          </p>

          {atRiskStudents.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Great news! Every enrolled student is currently meeting or exceeding passing standards.
            </div>
          ) : (
            <div className="space-y-2">
              {atRiskStudents.slice(0, 3).map((st) => (
                <div
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{st.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">Roll: {st.rollNo}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                        {st.passFail}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Failed Subjects:{" "}
                      <span className="font-medium text-rose-600">
                        {st.failedSubjects.length > 0 ? st.failedSubjects.join(", ") : "Low aggregate"}
                      </span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-900">{st.percentage}%</p>
                    <p className="text-[10px] text-slate-400">Rank #{st.rank}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
