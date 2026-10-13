import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Sparkles,
  ArrowRight,
  Layers,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { ParsedRawFile, SystemConfig } from "../types";
import {
  parseExcelFile,
  generateSampleExcelFile,
} from "../utils/excelEngine";

interface UploadTabProps {
  config: SystemConfig;
  onFileParsed: (
    parsed: ParsedRawFile,
    extractedStudents: any[],
    subjects: string[],
    termName: string
  ) => void;
  onLoadSampleData: (sampleType: "term1" | "term2") => void;
  studentCount?: number;
  onClearAllRecords?: () => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  config,
  onFileParsed,
  onLoadSampleData,
  studentCount = 0,
  onClearAllRecords,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assessmentTerm, setAssessmentTerm] = useState("Term 2 Final Exam");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);

    // Verify file extension
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid Excel spreadsheet (.xlsx, .xls) or CSV file.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await parseExcelFile(file, config);
      if (result.extractedStudents.length === 0) {
        throw new Error(
          "Could not identify any student records. Ensure your spreadsheet contains a Student Name or Roll Number column and subject mark columns."
        );
      }
      onFileParsed(
        result.parsed,
        result.extractedStudents,
        result.subjects,
        assessmentTerm || file.name.replace(/\.[^/.]+$/, "")
      );
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setErrorMsg(err.message || "Failed to process the uploaded Excel file. Check format and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Workspace Record Status Banner */}
      {studentCount > 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Active Workspace Notice</p>
              <p className="text-amber-800 text-[11px]">
                Currently loaded with <strong className="font-semibold">{studentCount}</strong> student record(s). When uploading, you can replace all previous records or merge updates.
              </p>
            </div>
          </div>
          {onClearAllRecords && (
            <button
              id="upload-clear-all-records-btn"
              onClick={onClearAllRecords}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0 text-xs"
              title="Remove all existing student records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All Records</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Clean Workspace: 0 previous records. Any spreadsheet you upload will be imported fresh into an empty class roster.</span>
        </div>
      )}

      {/* Upload Zone Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Upload Student Excel File
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accepts <span className="font-semibold text-slate-700">.xlsx</span> and{" "}
            <span className="font-semibold text-slate-700">.xls</span> files. Columns, student names, roll numbers,
            and subject marks are detected automatically.
          </p>
        </div>

        {/* Assessment Title Input */}
        <div className="max-w-md mx-auto mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assessment / Examination Name
          </label>
          <input
            type="text"
            value={assessmentTerm}
            onChange={(e) => setAssessmentTerm(e.target.value)}
            placeholder="e.g. Term 2 Final Examination, Unit Test 1"
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Used to tag longitudinal history and compare against previous exams.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileInputChange}
            className="hidden"
            id="excel-file-upload-input"
          />

          <FileSpreadsheet className="w-12 h-12 text-indigo-500 mx-auto mb-3 animate-pulse" />

          <p className="text-sm font-bold text-slate-900">
            {isLoading ? "Reading and analyzing student Excel..." : "Click to select or drag & drop student Excel file"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports both single-row-per-student and normalized subject formats
          </p>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Select Excel File</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Excel Processing Issue</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pre-Loaded Testing Options */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Instant Test Datasets & Sample Files
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Test the automatic comparison, delta calculation, and student update lifecycle without having to prepare an Excel file:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Term 1 Baseline */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white transition-all">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              1. Load Term 1 Baseline Dataset
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Loads 10 realistic students across 5 subjects (Mathematics, Science, English, etc.) as the initial baseline record.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onLoadSampleData("term1")}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Apply Term 1 Data
              </button>
              <button
                onClick={() => generateSampleExcelFile("term1")}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1"
                title="Download as .xlsx"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.xlsx</span>
              </button>
            </div>
          </div>

          {/* Term 2 Update */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white transition-all">
            <p className="font-bold text-slate-900 text-xs sm:text-sm">
              2. Load Term 2 Update (Comparison)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Uploads subsequent exam results. Demonstrates automatic mark change calculation, student rank shift, and new admission detection.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onLoadSampleData("term2")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Apply Term 2 Update
              </button>
              <button
                onClick={() => generateSampleExcelFile("term2")}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1"
                title="Download as .xlsx"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.xlsx</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blank Template Download */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Need a clean starting spreadsheet for your school/class?
          </span>
          <button
            onClick={() => generateSampleExcelFile("template")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Blank Template</span>
          </button>
        </div>
      </div>

      {/* Format Guidelines Card */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          Supported Spreadsheet Structure & Headers
        </h4>
        <p className="text-slate-600">
          The system dynamically detects headers regardless of case or spacing:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>
            <strong className="text-slate-800">Student Identity:</strong> Recognized headers include{" "}
            <code>Student Name</code>, <code>Name</code>, <code>Candidate Name</code>, <code>Roll No</code>,{" "}
            <code>Roll Number</code>, <code>Student ID</code>, <code>ID</code>, or <code>Reg No</code>.
          </li>
          <li>
            <strong className="text-slate-800">Subject Columns:</strong> Any numeric columns (e.g.{" "}
            <code>Mathematics</code>, <code>Science</code>, <code>English</code>, <code>History</code>, etc.)
            are analyzed automatically.
          </li>
          <li>
            <strong className="text-slate-800">Auto Formula Calculation:</strong> Pre-existing total or grade
            columns in your spreadsheet are verified or recalculated cleanly to ensure accurate ranks and pass/fail rules.
          </li>
        </ul>
      </div>
    </div>
  );
};
