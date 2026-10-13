import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  BookOpen,
  Users,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Edit3,
  RotateCcw,
  X,
  GraduationCap,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Student, SystemConfig, ArrearRecord } from "../types";
import { EmptyState } from "./EmptyState";
import {
  extractArrearRecords,
  buildSubjectWiseArrearGroups,
  buildStudentWiseArrearGroups,
  exportSubjectWiseArrearExcel,
  exportStudentWiseArrearExcel,
} from "../utils/arrearEngine";

interface ArrearListTabProps {
  students: Student[];
  config: SystemConfig;
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onUploadClick?: () => void;
  onLoadSampleData?: () => void;
}

export const ArrearListTab: React.FC<ArrearListTabProps> = ({
  students,
  config,
  onSelectStudent,
  onEditStudent,
  onUploadClick,
  onLoadSampleData,
}) => {
  if (students.length === 0) {
    return (
      <EmptyState
        title="No Arrear Records to Display"
        description="The student roster is currently empty. Upload a semester marksheet or exam spreadsheet to automatically identify subject arrears, failed attempts, and generate official university-style arrear registers."
        onUploadClick={onUploadClick}
        onLoadSampleData={onLoadSampleData}
      />
    );
  }

  // View mode: "subject" (Subject-wise) or "student" (Student-wise)
  const [viewMode, setViewMode] = useState<"subject" | "student">("subject");

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Student map for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Extract base arrear records across cohort
  const allArrearRecords = useMemo(() => {
    return extractArrearRecords(students, config);
  }, [students, config]);

  // Filter options derived from actual arrear data
  const filterOptions = useMemo(() => {
    const academicYears = Array.from(new Set(allArrearRecords.map((r) => r.academicYear)));
    const departments = Array.from(new Set(allArrearRecords.map((r) => r.department)));
    const semesters = Array.from(new Set(allArrearRecords.map((r) => r.semester)));
    const subjects = Array.from(new Set(allArrearRecords.map((r) => `${r.subjectCode} - ${r.subjectName}`)));
    const statuses = Array.from(new Set(allArrearRecords.map((r) => r.status)));

    return { academicYears, departments, semesters, subjects, statuses };
  }, [allArrearRecords]);

  // Apply search and filters
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allArrearRecords.filter((rec) => {
      // Search match: Register No, Student Name, Subject Code, Subject Name
      if (query) {
        const matchesQuery =
          rec.registerNo.toLowerCase().includes(query) ||
          rec.studentName.toLowerCase().includes(query) ||
          rec.subjectCode.toLowerCase().includes(query) ||
          rec.subjectName.toLowerCase().includes(query) ||
          rec.department.toLowerCase().includes(query);

        if (!matchesQuery) return false;
      }

      // Filter matches
      if (filterAcademicYear !== "all" && rec.academicYear !== filterAcademicYear) return false;
      if (filterDepartment !== "all" && rec.department !== filterDepartment) return false;
      if (filterSemester !== "all" && rec.semester !== filterSemester) return false;
      if (filterSubject !== "all") {
        const fullSub = `${rec.subjectCode} - ${rec.subjectName}`;
        if (fullSub !== filterSubject && rec.subjectName !== filterSubject) return false;
      }
      if (filterStatus !== "all" && rec.status !== filterStatus) return false;

      return true;
    });
  }, [
    allArrearRecords,
    searchQuery,
    filterAcademicYear,
    filterDepartment,
    filterSemester,
    filterSubject,
    filterStatus,
  ]);

  // Grouped datasets based on active filtered records
  const subjectGroups = useMemo(() => {
    return buildSubjectWiseArrearGroups(filteredRecords);
  }, [filteredRecords]);

  const studentGroups = useMemo(() => {
    return buildStudentWiseArrearGroups(filteredRecords, students);
  }, [filteredRecords, students]);

  // Dynamic Summary Metrics
  const summary = useMemo(() => {
    const uniqueStudentIds = new Set(filteredRecords.map((r) => r.studentId));
    const uniqueSubjects = new Set(filteredRecords.map((r) => r.subjectCode));
    const totalStudentsCount = students.length;
    const arrearStudentsCount = uniqueStudentIds.size;
    const totalArrearPapers = filteredRecords.length;
    const arrearRate = totalStudentsCount > 0 ? ((arrearStudentsCount / totalStudentsCount) * 100).toFixed(1) : "0.0";

    return {
      totalStudentsWithArrears: arrearStudentsCount,
      totalArrearRecords: totalArrearPapers,
      totalSubjectsWithArrears: uniqueSubjects.size,
      arrearRate,
    };
  }, [filteredRecords, students]);

  const hasActiveFilters =
    searchQuery !== "" ||
    filterAcademicYear !== "all" ||
    filterDepartment !== "all" ||
    filterSemester !== "all" ||
    filterSubject !== "all" ||
    filterStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterAcademicYear("all");
    setFilterDepartment("all");
    setFilterSemester("all");
    setFilterSubject("all");
    setFilterStatus("all");
  };

  // Export handlers
  const handleExportExcel = () => {
    if (viewMode === "subject") {
      exportSubjectWiseArrearExcel(subjectGroups, config);
    } else {
      exportStudentWiseArrearExcel(studentGroups, config);
    }
  };

  const handleTriggerPrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header & Primary Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Arrear List
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {allArrearRecords.length} Total Paper Arrears
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Academic examination arrear records and clearance tracking • Passing Mark:{" "}
                  <strong className="text-slate-700">{config.passingMarkPerSubject}/100</strong>
                </p>
              </div>
            </div>
          </div>

          {/* View Selector & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-xs">
              <button
                id="arrear-view-subject-btn"
                onClick={() => setViewMode("subject")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  viewMode === "subject"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Subject-wise</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono">
                  {subjectGroups.length}
                </span>
              </button>

              <button
                id="arrear-view-student-btn"
                onClick={() => setViewMode("student")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  viewMode === "student"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Student-wise</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono">
                  {studentGroups.length}
                </span>
              </button>
            </div>

            {/* Print / PDF Button */}
            <button
              id="arrear-print-btn"
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
              title="Print official academic arrear report or save to PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print / PDF</span>
            </button>

            {/* Excel Export Button */}
            <button
              id="arrear-export-excel-btn"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-all"
              title={`Export current ${viewMode === "subject" ? "Subject-wise" : "Student-wise"} Arrear List to Excel`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export {viewMode === "subject" ? "Subject" : "Student"} Excel</span>
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Students with Arrears
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-600">
                {summary.totalStudentsWithArrears}
              </span>
              <span className="text-xs text-slate-400">
                of {students.length} students
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Arrear Records
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">
                {summary.totalArrearRecords}
              </span>
              <span className="text-xs text-slate-400">
                un-cleared papers
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Subjects with Arrears
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-600">
                {summary.totalSubjectsWithArrears}
              </span>
              <span className="text-xs text-slate-400">
                disciplines affected
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Cohort Arrear Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-600">
                {summary.arrearRate}%
              </span>
              <span className="text-xs text-slate-400">
                requires re-exam
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="arrear-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Register No, Student Name, Subject Code, or Subject..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="arrear-toggle-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              id="arrear-reset-filter-btn"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Collapsible Filter Controls */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 animate-in fade-in duration-150">
            {/* Academic Year */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <select
                id="filter-academic-year"
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-medium"
              >
                <option value="all">All Academic Years</option>
                {filterOptions.academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Department / Course
              </label>
              <select
                id="filter-department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-medium"
              >
                <option value="all">All Departments</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Semester / Year
              </label>
              <select
                id="filter-semester"
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-medium"
              >
                <option value="all">All Semesters</option>
                {filterOptions.semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Subject
              </label>
              <select
                id="filter-subject"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-medium"
              >
                <option value="all">All Subjects</option>
                {filterOptions.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Status / Attempt */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Arrear Status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-medium"
              >
                <option value="all">All Statuses</option>
                {filterOptions.statuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Arrear View Contents */}
      {filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          {allArrearRecords.length === 0 ? (
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-4">
                Zero Arrears Found!
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                All {students.length} students have met or exceeded the academic passing mark of{" "}
                <strong className="text-slate-700">{config.passingMarkPerSubject}/100</strong> across every subject.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Subject Pass Record</span>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-3">
                No matching arrear records
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                No students or subjects match your current search and filter combination.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "subject" ? (
        /* ================= 1. SUBJECT-WISE ARREAR LIST ================= */
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Showing {subjectGroups.length} Subjects with Arrears (Ordered by Subject Code / Name)
            </span>
          </div>

          {subjectGroups.map((group) => (
            <div
              key={group.subjectCode}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Subject Group Header */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-xs">
                    {group.subjectCode}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {group.subjectName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Passing Benchmark: {group.passingMarks} / {group.maxMarks} marks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                    {group.totalArrears} {group.totalArrears === 1 ? "Student" : "Students"} with Arrears
                  </span>
                </div>
              </div>

              {/* Students Table for this Subject */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Register Number</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Department / Course</th>
                      <th className="py-2.5 px-4">Year / Semester</th>
                      <th className="py-2.5 px-4 text-center">Marks Scored</th>
                      <th className="py-2.5 px-4 text-center">Deficit</th>
                      <th className="py-2.5 px-4 text-center">Arrear Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {group.students.map((st, idx) => {
                      const studentObj = studentMap.get(st.studentId);
                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {st.registerNo}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {st.studentName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {st.department}
                            <span className="block text-[11px] text-slate-400">
                              {st.course}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {st.year} • {st.semester}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-rose-600 font-mono text-sm">
                              {st.marksScored}
                            </span>
                            <span className="text-slate-400 text-xs"> / {group.maxMarks}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              -{st.deficit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                st.status === "Critical"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : st.status === "Re-appear"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {st.arrearAttempt}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {studentObj && (
                                <button
                                  id={`arrear-view-student-${st.studentId}`}
                                  onClick={() => onSelectStudent(studentObj)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="View full academic student card"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                              {studentObj && (
                                <button
                                  id={`arrear-edit-student-${st.studentId}`}
                                  onClick={() => onEditStudent(studentObj)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Edit student marks to clear arrear"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= 2. STUDENT-WISE ARREAR LIST ================= */
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Showing {studentGroups.length} Students with Arrears (Ordered by Register Number)
            </span>
          </div>

          {studentGroups.map((group) => {
            const studentObj = studentMap.get(group.studentId);
            return (
              <div
                key={group.studentId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* Student Header */}
                <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-indigo-700 text-sm">
                          {group.registerNo}
                        </span>
                        <span className="text-slate-300">•</span>
                        <h3 className="text-base font-bold text-slate-900">
                          {group.studentName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.department} • {group.year} • {group.semester} ({group.academicYear})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-400 block">Overall Score</span>
                      <span className="text-xs font-bold text-slate-700">
                        {group.overallPercentage}% (Grade {group.grade} • Rank #{group.rank})
                      </span>
                    </div>

                    <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-bold">
                      {group.totalArrears} {group.totalArrears === 1 ? "Arrear Subject" : "Arrear Subjects"}
                    </span>

                    {studentObj && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                        <button
                          onClick={() => onSelectStudent(studentObj)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onEditStudent(studentObj)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrear Subjects Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">#</th>
                        <th className="py-2.5 px-4">Subject Code</th>
                        <th className="py-2.5 px-4">Subject Name</th>
                        <th className="py-2.5 px-4 text-center">Marks Scored</th>
                        <th className="py-2.5 px-4 text-center">Passing Mark</th>
                        <th className="py-2.5 px-4 text-center">Deficit</th>
                        <th className="py-2.5 px-4 text-center">Arrear Attempt / Status</th>
                        <th className="py-2.5 px-4">Remarks & Guidance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {group.arrearSubjects.map((sub, idx) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {sub.subjectCode}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {sub.subjectName}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-rose-600 text-sm">
                            {sub.marksScored} / {sub.maxMarks}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {sub.passingMarks}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              -{sub.deficit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                sub.status === "Critical"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : sub.status === "Re-appear"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {sub.arrearAttempt}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {sub.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= OFFICIAL PRINTABLE REPORT MODAL ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Controls Bar */}
            <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm">
                  Official Academic Arrear Statement — Print Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="p-8 max-h-[75vh] overflow-y-auto text-slate-900 print:p-0 print:max-h-none">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  Office of the Controller of Examinations
                </h2>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mt-0.5">
                  Academic Arrear Clearance & Examination Record
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Academic Year: <strong>{config.academicYear}</strong> • Class:{" "}
                  <strong>{config.className} ({config.section})</strong> • Date of Generation:{" "}
                  <strong>{new Date().toLocaleDateString()}</strong>
                </p>
              </div>

              {/* Meta Parameters */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
                <div>
                  <span className="text-slate-500 block">Report View:</span>
                  <span className="font-bold uppercase">
                    {viewMode === "subject" ? "Subject-wise Statement" : "Student-wise Statement"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Passing Mark:</span>
                  <span className="font-bold">{config.passingMarkPerSubject}/100</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Arrear Students:</span>
                  <span className="font-bold text-rose-600">{summary.totalStudentsWithArrears}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Arrear Papers:</span>
                  <span className="font-bold text-amber-600">{summary.totalArrearRecords}</span>
                </div>
              </div>

              {/* Table rendering based on current viewMode */}
              {viewMode === "subject" ? (
                <div className="space-y-6">
                  {subjectGroups.map((g) => (
                    <div key={g.subjectCode} className="border border-slate-300 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                        <span className="font-bold text-sm">
                          {g.subjectCode} — {g.subjectName}
                        </span>
                        <span className="text-xs font-bold text-rose-700">
                          {g.totalArrears} Candidates with Arrears
                        </span>
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-600">
                            <th className="py-1.5">#</th>
                            <th className="py-1.5">Register No</th>
                            <th className="py-1.5">Student Name</th>
                            <th className="py-1.5">Department</th>
                            <th className="py-1.5">Semester</th>
                            <th className="py-1.5 text-center">Marks</th>
                            <th className="py-1.5 text-center">Deficit</th>
                            <th className="py-1.5 text-right">Attempt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {g.students.map((st, idx) => (
                            <tr key={st.id}>
                              <td className="py-1.5">{idx + 1}</td>
                              <td className="py-1.5 font-mono font-bold">{st.registerNo}</td>
                              <td className="py-1.5 font-semibold">{st.studentName}</td>
                              <td className="py-1.5">{st.department}</td>
                              <td className="py-1.5">{st.semester}</td>
                              <td className="py-1.5 text-center font-bold text-rose-700 font-mono">
                                {st.marksScored}
                              </td>
                              <td className="py-1.5 text-center font-mono">-{st.deficit}</td>
                              <td className="py-1.5 text-right">{st.arrearAttempt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {studentGroups.map((g) => (
                    <div key={g.studentId} className="border border-slate-300 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-mono font-bold text-sm mr-2">{g.registerNo}</span>
                          <span className="font-bold text-sm">{g.studentName}</span>
                          <span className="text-xs text-slate-500 ml-2">({g.department} • {g.semester})</span>
                        </div>
                        <span className="text-xs font-bold text-rose-700">
                          {g.totalArrears} Arrear Subjects
                        </span>
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-600">
                            <th className="py-1">Subject Code</th>
                            <th className="py-1">Subject Name</th>
                            <th className="py-1 text-center">Marks Scored</th>
                            <th className="py-1 text-center">Passing Mark</th>
                            <th className="py-1 text-center">Deficit</th>
                            <th className="py-1 text-right">Attempt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {g.arrearSubjects.map((sub) => (
                            <tr key={sub.id}>
                              <td className="py-1.5 font-mono font-bold">{sub.subjectCode}</td>
                              <td className="py-1.5">{sub.subjectName}</td>
                              <td className="py-1.5 text-center font-mono font-bold text-rose-700">
                                {sub.marksScored}
                              </td>
                              <td className="py-1.5 text-center font-mono">{sub.passingMarks}</td>
                              <td className="py-1.5 text-center font-mono">-{sub.deficit}</td>
                              <td className="py-1.5 text-right">{sub.arrearAttempt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Official Academic Signatures Block */}
              <div className="grid grid-cols-3 gap-8 pt-16 mt-8 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-700">
                    Prepared By (Academic In-Charge)
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-700">
                    Verified By (Head of Department)
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-700">
                    Controller of Examinations
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
