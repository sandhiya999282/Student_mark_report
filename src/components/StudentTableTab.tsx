import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit3,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
} from "lucide-react";
import { Student, SystemConfig, PerformanceChangeType } from "../types";
import { EmptyState } from "./EmptyState";

interface StudentTableTabProps {
  students: Student[];
  config: SystemConfig;
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onAddNewStudent: () => void;
  onClearAllRecords?: () => void;
  onUploadClick?: () => void;
  onLoadSampleData?: () => void;
  initialFilter?: string;
}

export const StudentTableTab: React.FC<StudentTableTabProps> = ({
  students,
  config,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
  onAddNewStudent,
  onClearAllRecords,
  onUploadClick,
  onLoadSampleData,
  initialFilter = "all",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>(initialFilter);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Extract all available subjects across students
  const subjects = useMemo(() => {
    return Array.from(new Set(students.flatMap((s) => Object.keys(s.subjectMarks))));
  }, [students]);

  // Handle column header sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // Default numeric rankings to ascending, totals to descending
      setSortOrder(field === "rank" || field === "rollNo" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  // Filtered and sorted dataset
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((s) => {
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesRoll = s.rollNo.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        const matchesGrade = s.grade.toLowerCase() === q;
        const matchesStatus = s.passFail.toLowerCase() === q || s.performanceChange.toLowerCase() === q;
        const matchesRank = String(s.rank) === q;
        const matchesSubject = Object.entries(s.subjectMarks).some(([sub, mark]) =>
          sub.toLowerCase().includes(q) || String(mark) === q
        );
        return matchesName || matchesRoll || matchesGrade || matchesStatus || matchesRank || matchesSubject;
      });
    }

    // Status filter
    if (filterType === "passed") {
      list = list.filter((s) => s.passFail === "Pass");
    } else if (filterType === "failed") {
      list = list.filter((s) => s.passFail === "Fail");
    } else if (filterType === "improved") {
      list = list.filter((s) => s.performanceChange === "Improved");
    } else if (filterType === "declined") {
      list = list.filter((s) => s.performanceChange === "Declined");
    } else if (filterType === "top10") {
      list = list.filter((s) => s.percentage >= 90 || s.rank <= 3);
    } else if (filterType === "support") {
      list = list.filter((s) => s.passFail === "Fail" || s.percentage < config.passingPercentage + 10);
    }

    // Grade filter
    if (gradeFilter !== "all") {
      list = list.filter((s) => s.grade === gradeFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let aVal: any = a[sortField as keyof Student];
      let bVal: any = b[sortField as keyof Student];

      // Subject specific sorting
      if (sortField.startsWith("sub_")) {
        const sub = sortField.replace("sub_", "");
        aVal = a.subjectMarks[sub] ?? 0;
        bVal = b.subjectMarks[sub] ?? 0;
      }

      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [students, searchTerm, filterType, gradeFilter, sortField, sortOrder, config.passingPercentage]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setGradeFilter("all");
    setSortField("rank");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  if (students.length === 0) {
    return (
      <EmptyState
        title="Student Records Table is Empty"
        description="No previous existing records are active in this workspace. Upload an Excel or CSV marksheet or manually add student marks to populate the roster."
        onUploadClick={onUploadClick}
        onAddNewStudent={onAddNewStudent}
        onLoadSampleData={onLoadSampleData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Header: Search, Filters, Add */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="student-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, roll number, rank, or grade..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Status: All ({students.length})</option>
              <option value="passed">Passed Students</option>
              <option value="failed">Failed Students</option>
              <option value="top10">Top Performers</option>
              <option value="improved">Performance Improved</option>
              <option value="declined">Performance Declined</option>
              <option value="support">Needs Academic Support</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Grade: All</option>
              {config.gradeScale.map((g) => (
                <option key={g.grade} value={g.grade}>
                  Grade {g.grade}
                </option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="add-student-btn"
              onClick={onAddNewStudent}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            {students.length > 0 && onClearAllRecords && (
              <button
                id="clear-all-records-btn"
                onClick={onClearAllRecords}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl transition-colors shrink-0"
                title="Remove all existing student records from the workspace"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Remove All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredStudents.length}</span> of{" "}
            <span className="font-bold text-slate-900">{students.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th
                  onClick={() => handleSort("rank")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-16"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("rollNo")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                >
                  <div className="flex items-center gap-1">
                    <span>Roll No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors min-w-[180px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Dynamic Subject Columns */}
                {subjects.map((sub) => (
                  <th
                    key={sub}
                    onClick={() => handleSort(`sub_${sub}`)}
                    className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="truncate max-w-[90px]">{sub}</span>
                      <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  </th>
                ))}

                <th
                  onClick={() => handleSort("totalMarks")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("percentage")}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>%</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("grade")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Grade</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("passFail")}
                  className="py-3.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Result</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Change</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8 + subjects.length} className="text-center py-12 text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">No student records match your query.</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st) => {
                  const isTopOne = st.rank === 1;
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTopOne ? "bg-amber-50/30 font-medium" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isTopOne ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              1
                            </span>
                          ) : st.rank <= 3 ? (
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                              {st.rank}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-semibold pl-1.5">
                              #{st.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Roll No */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {st.rollNo}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectStudent(st)}
                          className="text-left font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5 transition-colors group"
                        >
                          <span className="group-hover:underline">{st.name}</span>
                          {isTopOne && <Award className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      </td>

                      {/* Subject Marks */}
                      {subjects.map((sub) => {
                        const mark = st.subjectMarks[sub];
                        const isFailing = mark !== undefined && mark < config.passingMarkPerSubject;
                        return (
                          <td
                            key={sub}
                            className={`py-3.5 px-3 text-right font-medium ${
                              isFailing ? "text-rose-600 font-bold bg-rose-50/50" : "text-slate-700"
                            }`}
                          >
                            {mark !== undefined ? mark : "-"}
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {st.totalMarks}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          /{st.maxMarks}
                        </span>
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {st.percentage}%
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            st.grade.startsWith("A")
                              ? "bg-indigo-100 text-indigo-800"
                              : st.grade === "B"
                              ? "bg-emerald-100 text-emerald-800"
                              : st.grade === "C"
                              ? "bg-amber-100 text-amber-800"
                              : st.grade === "D"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {st.grade}
                        </span>
                      </td>

                      {/* Pass / Fail */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            st.passFail === "Pass"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {st.passFail === "Pass" ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          {st.passFail}
                        </span>
                      </td>

                      {/* Performance Change */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {st.performanceChange === "Improved" && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{st.marksDifference}
                          </span>
                        )}
                        {st.performanceChange === "Declined" && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {st.marksDifference}
                          </span>
                        )}
                        {st.performanceChange === "No Change" && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <Minus className="w-3 h-3" />
                            Stable
                          </span>
                        )}
                        {st.performanceChange === "New" && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            New
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onSelectStudent(st)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View comprehensive student profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(st)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit student marks"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(st)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete student record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs">
            <div className="text-slate-500">
              Page <span className="font-bold text-slate-900">{currentPage}</span> of{" "}
              <span className="font-bold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg font-semibold transition-colors ${
                          currentPage === p
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
