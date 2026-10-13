import React, { useState, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  Settings,
  LayoutDashboard,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Mail,
} from "lucide-react";
import {
  Student,
  SystemConfig,
  ClassStatistics,
  ParsedRawFile,
  ComparisonSummary,
  ValidationIssue,
  AuthUser,
} from "./types";
import {
  DEFAULT_CONFIG,
  SAMPLE_STUDENTS_TERM_1,
  SAMPLE_STUDENTS_TERM_2,
} from "./utils/defaults";
import {
  computeStudentCalculations,
  computeClassStatistics,
  generateMasterExcelWorkbook,
  downloadExcelFile,
  generateSampleExcelFile,
  compareStudentDatasets,
} from "./utils/excelEngine";
import { getCurrentUser, logoutUser } from "./utils/authService";
import { AuthPage } from "./components/AuthPage";
import { Navbar } from "./components/Navbar";
import { DashboardTab } from "./components/DashboardTab";
import { StudentTableTab } from "./components/StudentTableTab";
import { RankingsTab } from "./components/RankingsTab";
import { PredictionTab } from "./components/PredictionTab";
import { UploadTab } from "./components/UploadTab";
import { ArrearListTab } from "./components/ArrearListTab";
import { StudentDetailModal } from "./components/StudentDetailModal";
import { EditStudentModal } from "./components/EditStudentModal";
import { SettingsModal } from "./components/SettingsModal";
import { UpdateComparisonModal } from "./components/UpdateComparisonModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { ClearAllModal } from "./components/ClearAllModal";
import { EmailNotificationModal } from "./components/EmailNotificationModal";
import { UserEmailNotificationBanner } from "./components/UserEmailNotificationBanner";
import { extractArrearRecords } from "./utils/arrearEngine";
import { EmailLog } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  // Initialize with 0 students so all previous existing records are removed
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      // Purge previous existing records and caches across all legacy keys
      localStorage.removeItem("academic_analyzer_students_v1");
      localStorage.removeItem("academic_analyzer_students_v2");
      localStorage.removeItem("academic_analyzer_students_v3");
      localStorage.removeItem("academic_analyzer_students");
      localStorage.removeItem("student_excel_records");

      const saved = localStorage.getItem("academic_analyzer_students_v4");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return computeStudentCalculations(parsed, DEFAULT_CONFIG);
        }
      }
    } catch {
      // fallback to clean empty array
    }
    return [];
  });

  // Sync students state to localStorage
  React.useEffect(() => {
    try {
      if (students.length > 0) {
        localStorage.setItem("academic_analyzer_students_v4", JSON.stringify(students));
      } else {
        localStorage.removeItem("academic_analyzer_students_v4");
      }
    } catch {
      // ignore
    }
  }, [students]);

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [studentTableFilter, setStudentTableFilter] = useState<string>("all");

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailLogForModal, setSelectedEmailLogForModal] = useState<EmailLog | null>(null);

  // Update comparison modal state
  const [comparisonSummary, setComparisonSummary] = useState<ComparisonSummary | null>(null);
  const [pendingExtractedStudents, setPendingExtractedStudents] = useState<Partial<Student>[]>([]);
  const [pendingValidationIssues, setPendingValidationIssues] = useState<ValidationIssue[]>([]);
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Notification toast
  const [notification, setNotification] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "info" | "warning" = "success"
  ) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Derive class-wide statistics automatically whenever students or config changes
  const stats: ClassStatistics = useMemo(() => {
    return computeClassStatistics(students, config);
  }, [students, config]);

  // Total arrear records across cohort
  const arrearRecordsCount = useMemo(() => {
    return extractArrearRecords(students, config).length;
  }, [students, config]);

  // All detected subjects across cohort
  const allSubjects = useMemo(() => {
    return Array.from(new Set(students.flatMap((s) => Object.keys(s.subjectMarks))));
  }, [students]);

  // Handle student selection for detail view
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  // Handle edit student request
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  // Handle add student request
  const handleOpenAddNew = () => {
    setEditingStudent(null);
    setIsEditModalOpen(true);
  };

  // Save student (new or edited) and recalculate
  const handleSaveStudent = (studentData: Partial<Student> & { id?: string }) => {
    let updatedList: Partial<Student>[];

    if (studentData.id) {
      // Editing existing student
      updatedList = students.map((s) => {
        if (s.id === studentData.id) {
          return {
            ...s,
            name: studentData.name || s.name,
            rollNo: studentData.rollNo || s.rollNo,
            subjectMarks: studentData.subjectMarks || s.subjectMarks,
          };
        }
        return s;
      });
      showNotification(`Updated records for ${studentData.name}.`);
    } else {
      // Creating new student
      const newSt: Partial<Student> = {
        id: `stu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: studentData.name || "New Student",
        rollNo: studentData.rollNo || String(students.length + 101),
        subjectMarks: studentData.subjectMarks || {},
        performanceChange: "New",
      };
      updatedList = [...students, newSt];
      showNotification(`Added new student: ${newSt.name}.`);
    }

    const recalculated = computeStudentCalculations(updatedList, config);
    setStudents(recalculated);

    // Refresh selected student if currently viewing in modal
    if (selectedStudent && studentData.id === selectedStudent.id) {
      const refreshed = recalculated.find((s) => s.id === selectedStudent.id);
      if (refreshed) setSelectedStudent(refreshed);
    }
  };

  // Handle delete student
  const handleOpenDelete = (student: Student) => {
    setDeletingStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    const filtered = students.filter((s) => s.id !== deletingStudent.id);
    const recalculated = computeStudentCalculations(filtered, config);
    setStudents(recalculated);
    setIsDeleteModalOpen(false);
    showNotification(`Deleted record for ${deletingStudent.name}. Class ranks recalculated.`);
    setDeletingStudent(null);
    if (selectedStudent && selectedStudent.id === deletingStudent.id) {
      setIsDetailModalOpen(false);
      setSelectedStudent(null);
    }
  };

  // Save updated configuration (pass mark, grading scale, ranking method)
  const handleSaveConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);
    // Recalculate all students with new rules immediately
    const recalculated = computeStudentCalculations(students, newConfig);
    setStudents(recalculated);
    showNotification("Configuration saved. Class ranks, grades, and pass/fail rules updated.");
  };

  // Confirm clearing all student records
  const handleConfirmClearAll = () => {
    setStudents([]);
    try {
      localStorage.removeItem("academic_analyzer_students_v4");
      localStorage.removeItem("academic_analyzer_students_v3");
      localStorage.removeItem("academic_analyzer_students_v2");
    } catch {
      // ignore
    }
    setIsClearAllModalOpen(false);
    setSelectedStudent(null);
    setEditingStudent(null);
    setDeletingStudent(null);
    showNotification("All previous existing student records have been removed.");
  };

  // Download master student Excel file
  const handleDownloadExcel = () => {
    try {
      if (students.length === 0) {
        showNotification(
          "No student records yet. Downloading blank starter student marks template...",
          "info"
        );
        generateSampleExcelFile("template");
        return;
      }
      downloadExcelFile(students, stats, config);
      showNotification("Master student Excel workbook downloaded successfully.");
    } catch (err: any) {
      console.error("Excel download error:", err);
      showNotification("Failed to generate Excel file.", "warning");
    }
  };

  // File parsed callback from UploadTab
  const handleFileParsed = (
    parsed: ParsedRawFile,
    extractedStudents: Partial<Student>[],
    subjects: string[],
    termName: string
  ) => {
    const comparison = compareStudentDatasets(
      students,
      extractedStudents,
      config,
      termName
    );

    setComparisonSummary(comparison);
    setPendingExtractedStudents(extractedStudents);
    setPendingValidationIssues(parsed.validationIssues);
    setPendingFileName(parsed.fileName);
    setIsComparisonModalOpen(true);
  };

  // Confirm applying parsed updates from comparison modal
  const handleApplyUpdates = (mode: "merge" | "replace" = "merge") => {
    if (!comparisonSummary) return;

    // Apply either replaced list or merged list
    let targetList: Partial<Student>[];
    if (mode === "replace" || students.length === 0) {
      targetList = [...pendingExtractedStudents];
    } else {
      targetList = [...(comparisonSummary.mergedStudents || [])];
    }

    const recalculated = computeStudentCalculations(targetList, config);
    setStudents(recalculated);
    setIsComparisonModalOpen(false);
    setActiveTab("students");
    showNotification(
      mode === "replace"
        ? `Replaced previous records. Loaded ${recalculated.length} student record(s) fresh.`
        : `Master records updated! ${comparisonSummary.updatedStudents.length} updated, ${comparisonSummary.newStudents.length} new student(s).`
    );
  };

  // One-click sample test data loader
  const handleLoadSampleData = (sampleType: "term1" | "term2" = "term1") => {
    if (sampleType === "term1") {
      const calculated = computeStudentCalculations(SAMPLE_STUDENTS_TERM_1, config);
      setStudents(calculated);
      setActiveTab("dashboard");
      showNotification("Loaded sample demo student records (10 students).");
    } else {
      // Show comparison flow for Term 2
      const comparison = compareStudentDatasets(
        students,
        SAMPLE_STUDENTS_TERM_2,
        config,
        "Term 2 Final Assessment"
      );
      setComparisonSummary(comparison);
      setPendingExtractedStudents(SAMPLE_STUDENTS_TERM_2);
      setPendingValidationIssues([]);
      setPendingFileName("Sample_Term2_Update.xlsx");
      setIsComparisonModalOpen(true);
    }
  };

  // Filter click handler from dashboard
  const handleDashboardFilterClick = (filterType: string) => {
    setStudentTableFilter(filterType);
    setActiveTab("students");
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showNotification("You have been signed out successfully.", "info");
  };

  // If user is not authenticated, show Login & Register page first
  if (!currentUser) {
    return (
      <div className="selection:bg-indigo-500 selection:text-white">
        <AuthPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showNotification(`Welcome, ${user.name}! Accessing Academic Portal...`, "success");
          }}
        />

        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
                notification.type === "success"
                  ? "bg-emerald-950 text-emerald-100 border-emerald-800"
                  : notification.type === "warning"
                  ? "bg-amber-950 text-amber-100 border-amber-800"
                  : "bg-indigo-950 text-indigo-100 border-indigo-800"
              }`}
            >
              {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {notification.type === "info" && <Info className="w-4 h-4 text-indigo-400" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        onOpenUpload={() => setActiveTab("upload")}
        onDownloadExcel={handleDownloadExcel}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAiAdvisor={() => setActiveTab("predictions")}
        totalStudents={students.length}
        arrearCount={arrearRecordsCount}
        onClearRecords={() => setIsClearAllModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenEmailCenter={() => setIsEmailModalOpen(true)}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === "success"
                ? "bg-emerald-950 text-emerald-100 border-emerald-800"
                : notification.type === "warning"
                ? "bg-amber-950 text-amber-100 border-amber-800"
                : "bg-indigo-950 text-indigo-100 border-indigo-800"
            }`}
          >
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {notification.type === "info" && <Info className="w-4 h-4 text-indigo-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Institutional Welcome & Active Session Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                currentUser.avatarBg || "from-indigo-600 to-violet-700"
              } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Welcome, {currentUser.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentUser.department} • Staff ID: <span className="font-mono text-slate-700 font-semibold">{currentUser.staffId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Quick Email Gateway Status Indicator */}
            <button
              onClick={() => {
                setSelectedEmailLogForModal(null);
                setIsEmailModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              title="Automated email delivery active: Click to view dispatched login emails and sender details"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>User Email: <strong className="font-mono font-bold text-emerald-950">{currentUser.email}</strong> (Auto-Alerts ON)</span>
            </button>

            <span className="text-xs text-slate-500 hidden md:inline">
              Cohort: <strong className="text-slate-800">{config.className} {config.section}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Sign out and return to Login page"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            config={config}
            onSelectStudent={handleSelectStudent}
            onFilterTab={handleDashboardFilterClick}
            onNavigateToArrears={() => setActiveTab("arrears")}
            onUploadClick={() => setActiveTab("upload")}
            onAddNewStudent={handleOpenAddNew}
            onLoadSampleData={() => handleLoadSampleData("term1")}
          />
        )}

        {activeTab === "arrears" && (
          <ArrearListTab
            students={students}
            config={config}
            onSelectStudent={handleSelectStudent}
            onEditStudent={handleOpenEdit}
            onUploadClick={() => setActiveTab("upload")}
            onLoadSampleData={() => handleLoadSampleData("term1")}
          />
        )}

        {activeTab === "students" && (
          <StudentTableTab
            students={students}
            config={config}
            onSelectStudent={handleSelectStudent}
            onEditStudent={handleOpenEdit}
            onDeleteStudent={handleOpenDelete}
            onAddNewStudent={handleOpenAddNew}
            onClearAllRecords={() => setIsClearAllModalOpen(true)}
            onUploadClick={() => setActiveTab("upload")}
            onLoadSampleData={() => handleLoadSampleData("term1")}
            initialFilter={studentTableFilter}
          />
        )}

        {activeTab === "rankings" && (
          <RankingsTab
            students={students}
            config={config}
            onSelectStudent={handleSelectStudent}
            onUploadClick={() => setActiveTab("upload")}
            onLoadSampleData={() => handleLoadSampleData("term1")}
          />
        )}

        {activeTab === "predictions" && (
          <PredictionTab
            students={students}
            stats={stats}
            config={config}
            onSelectStudent={handleSelectStudent}
            onUploadClick={() => setActiveTab("upload")}
            onLoadSampleData={() => handleLoadSampleData("term1")}
          />
        )}

        {activeTab === "upload" && (
          <UploadTab
            config={config}
            onFileParsed={handleFileParsed}
            onLoadSampleData={handleLoadSampleData}
            studentCount={students.length}
            onClearAllRecords={() => setIsClearAllModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudent}
        config={config}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(st) => {
          setIsDetailModalOpen(false);
          handleOpenEdit(st);
        }}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        student={editingStudent}
        allSubjects={allSubjects}
        config={config}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveStudent}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        config={config}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveConfig}
      />

      <UpdateComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        onConfirmApply={handleApplyUpdates}
        comparison={comparisonSummary}
        validationIssues={pendingValidationIssues}
        fileName={pendingFileName}
        existingStudentCount={students.length}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        student={deletingStudent}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <ClearAllModal
        isOpen={isClearAllModalOpen}
        studentCount={students.length}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirmClear={handleConfirmClearAll}
      />

      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedEmailLogForModal(null);
        }}
        currentUser={currentUser}
        initialSelectedLog={selectedEmailLogForModal}
        onNotification={showNotification}
      />

      {/* Floating User-Side Automatic Email Alert Banner */}
      <UserEmailNotificationBanner
        currentUser={currentUser}
        onOpenEmailModal={(log) => {
          setSelectedEmailLogForModal(log || null);
          setIsEmailModalOpen(true);
        }}
      />
    </div>
  );
}
