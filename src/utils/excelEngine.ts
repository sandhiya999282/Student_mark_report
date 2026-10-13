import * as XLSX from "xlsx";
import {
  ClassStatistics,
  ComparisonSummary,
  ParsedRawFile,
  Student,
  SubjectStats,
  SystemConfig,
  ValidationIssue,
  PerformanceChangeType,
  PredictedTrendType,
} from "../types";
import { extractArrearRecords } from "./arrearEngine";

/**
 * Normalizes text for matching header names
 */
function normalizeHeader(header: string): string {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if a string likely indicates a student name column
 */
function isNameColumn(name: string): boolean {
  const n = normalizeHeader(name);
  return [
    "name",
    "studentname",
    "candidatename",
    "fullname",
    "student",
    "pupil",
    "learner",
  ].includes(n);
}

/**
 * Checks if a string likely indicates a student roll number / ID column
 */
function isRollNoColumn(name: string): boolean {
  const n = normalizeHeader(name);
  return [
    "rollno",
    "rollnumber",
    "roll",
    "studentid",
    "id",
    "regno",
    "registrationno",
    "admissionno",
    "admnno",
    "studentno",
  ].includes(n);
}

/**
 * Checks if a column is a pre-calculated or non-subject metadata column
 */
function isNonSubjectColumn(name: string): boolean {
  const n = normalizeHeader(name);
  return [
    "total",
    "totalmarks",
    "grandtotal",
    "sum",
    "percentage",
    "percent",
    "pct",
    "grade",
    "passfail",
    "result",
    "status",
    "rank",
    "classrank",
    "class",
    "section",
    "remarks",
    "attendance",
    "dob",
    "gender",
    "sno",
    "slno",
    "serialno",
  ].includes(n);
}

/**
 * Parses an uploaded Excel (.xlsx, .xls, .csv) file
 */
export async function parseExcelFile(
  file: File,
  config: SystemConfig
): Promise<{
  parsed: ParsedRawFile;
  extractedStudents: Partial<Student>[];
  subjects: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("The uploaded Excel workbook contains no readable worksheets.");
  }

  const activeSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[activeSheetName];

  // Convert to 2D array of cells to find true header row
  const rawSheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!rawSheetData || rawSheetData.length === 0) {
    throw new Error("The selected worksheet is completely empty.");
  }

  // Find the row that contains headers (looks for name/roll or marks keywords)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rawSheetData.length); i++) {
    const row = rawSheetData[i];
    const hasNameOrRoll = row.some((cell: any) => {
      const str = String(cell || "");
      return isNameColumn(str) || isRollNoColumn(str);
    });
    if (hasNameOrRoll) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders: string[] = (rawSheetData[headerRowIndex] || []).map(
    (cell: any, idx: number) => String(cell || "").trim() || `Column_${idx + 1}`
  );

  // Convert rows to key-value objects
  const rawDataRows = rawSheetData.slice(headerRowIndex + 1).filter((row) =>
    row.some((cell: any) => cell !== "" && cell !== null && cell !== undefined)
  );

  const rawObjects: Record<string, any>[] = rawDataRows.map((row) => {
    const obj: Record<string, any> = {};
    rawHeaders.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });

  // Identify primary columns
  let nameCol: string | undefined = rawHeaders.find(isNameColumn);
  let rollNoCol: string | undefined = rawHeaders.find(isRollNoColumn);
  const totalCol: string | undefined = rawHeaders.find((h) =>
    ["total", "totalmarks", "grandtotal"].includes(normalizeHeader(h))
  );
  const gradeCol: string | undefined = rawHeaders.find((h) =>
    ["grade"].includes(normalizeHeader(h))
  );

  // Fallback heuristics if exact name not found
  if (!nameCol) {
    nameCol = rawHeaders.find((h) => /name/i.test(h));
  }
  if (!rollNoCol) {
    rollNoCol = rawHeaders.find((h) => /roll|id|reg/i.test(h));
  }

  // Detect subject columns
  // All columns that are not name, roll, total, grade, or non-subject metadata
  const candidateSubjectCols = rawHeaders.filter((h) => {
    if (h === nameCol || h === rollNoCol || h === totalCol || h === gradeCol) return false;
    if (isNonSubjectColumn(h)) return false;
    return true;
  });

  // Verify candidate subject columns actually contain numbers in data rows
  const verifiedSubjectCols = candidateSubjectCols.filter((col) => {
    let numericCount = 0;
    let sampleSize = 0;
    for (const row of rawObjects.slice(0, 15)) {
      const val = row[col];
      if (val !== "" && val !== null && val !== undefined) {
        sampleSize++;
        if (!isNaN(Number(val))) {
          numericCount++;
        }
      }
    }
    // If more than 50% of non-empty sample rows are numeric, consider it a subject column
    return sampleSize > 0 && numericCount / sampleSize >= 0.5;
  });

  // Extract raw student records & perform deep validation
  const validationIssues: ValidationIssue[] = [];
  const extractedStudents: Partial<Student>[] = [];
  const seenRollNos = new Map<string, number>();

  rawObjects.forEach((row, rowIndex) => {
    const rowNumber = headerRowIndex + 2 + rowIndex;
    const nameVal = nameCol ? String(row[nameCol] || "").trim() : "";
    const rollNoVal = rollNoCol ? String(row[rollNoCol] || "").trim() : "";

    // Skip empty ghost rows
    if (!nameVal && !rollNoVal && verifiedSubjectCols.every((col) => row[col] === "")) {
      return;
    }

    if (!nameVal && !rollNoVal) {
      validationIssues.push({
        id: `val-missing-identity-${rowNumber}`,
        row: rowNumber,
        field: "Identity",
        message: "Missing both Student Name and Roll Number/ID.",
        severity: "error",
      });
    } else if (!nameVal) {
      validationIssues.push({
        id: `val-missing-name-${rowNumber}`,
        row: rowNumber,
        studentName: `Roll: ${rollNoVal}`,
        field: "Name",
        message: "Student Name is missing.",
        severity: "warning",
      });
    }

    // Check duplicate roll numbers
    const cleanRollNo = rollNoVal || (nameVal ? `NAME-${normalizeHeader(nameVal)}` : `ROW-${rowNumber}`);
    if (seenRollNos.has(cleanRollNo)) {
      validationIssues.push({
        id: `val-duplicate-${rowNumber}`,
        row: rowNumber,
        studentName: nameVal || cleanRollNo,
        field: "Roll Number / ID",
        message: `Duplicate student identifier '${cleanRollNo}' (first appeared in row ${seenRollNos.get(cleanRollNo)}).`,
        severity: "warning",
        value: cleanRollNo,
      });
    } else {
      seenRollNos.set(cleanRollNo, rowNumber);
    }

    // Extract subject marks
    const subjectMarks: Record<string, number> = {};
    verifiedSubjectCols.forEach((subject) => {
      const rawVal = row[subject];
      if (rawVal === "" || rawVal === null || rawVal === undefined) {
        validationIssues.push({
          id: `val-missing-mark-${rowNumber}-${subject}`,
          row: rowNumber,
          studentName: nameVal || cleanRollNo,
          field: subject,
          message: `Missing mark in ${subject}. Set to 0.`,
          severity: "warning",
        });
        subjectMarks[subject] = 0;
      } else {
        const num = Number(rawVal);
        if (isNaN(num)) {
          validationIssues.push({
            id: `val-nan-${rowNumber}-${subject}`,
            row: rowNumber,
            studentName: nameVal || cleanRollNo,
            field: subject,
            message: `Invalid non-numeric mark '${rawVal}' in ${subject}. Treated as 0.`,
            severity: "error",
            value: rawVal,
          });
          subjectMarks[subject] = 0;
        } else if (num < 0) {
          validationIssues.push({
            id: `val-negative-${rowNumber}-${subject}`,
            row: rowNumber,
            studentName: nameVal || cleanRollNo,
            field: subject,
            message: `Negative mark (${num}) in ${subject}. Clamped to 0.`,
            severity: "error",
            value: num,
          });
          subjectMarks[subject] = 0;
        } else if (num > config.maxMarksPerSubject) {
          validationIssues.push({
            id: `val-out-of-bounds-${rowNumber}-${subject}`,
            row: rowNumber,
            studentName: nameVal || cleanRollNo,
            field: subject,
            message: `Mark ${num} in ${subject} exceeds maximum allowed (${config.maxMarksPerSubject}).`,
            severity: "warning",
            value: num,
          });
          subjectMarks[subject] = num;
        } else {
          subjectMarks[subject] = num;
        }
      }
    });

    extractedStudents.push({
      id: cleanRollNo,
      rollNo: rollNoVal || cleanRollNo,
      name: nameVal || `Student ${cleanRollNo}`,
      subjectMarks,
    });
  });

  const parsed: ParsedRawFile = {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: workbook.SheetNames,
    activeSheet: activeSheetName,
    rawHeaders,
    rawRows: rawObjects,
    detectedSubjects: verifiedSubjectCols,
    detectedColumns: {
      nameCol,
      rollNoCol,
      totalCol,
      gradeCol,
      subjectCols: verifiedSubjectCols,
      extraCols: rawHeaders.filter(
        (h) => !verifiedSubjectCols.includes(h) && h !== nameCol && h !== rollNoCol
      ),
    },
    validationIssues,
  };

  return {
    parsed,
    extractedStudents,
    subjects: verifiedSubjectCols,
  };
}

/**
 * Calculates grade based on percentage and configured grade scale
 */
export function calculateGrade(percentage: number, config: SystemConfig): string {
  const sorted = [...config.gradeScale].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const item of sorted) {
    if (percentage >= item.minPercentage) {
      return item.grade;
    }
  }
  return sorted[sorted.length - 1]?.grade || "F";
}

/**
 * Computes individual calculations, rankings, grades, and pass/fail rules for a student cohort
 */
export function computeStudentCalculations(
  rawStudents: Partial<Student>[],
  config: SystemConfig,
  existingMasterStudents: Student[] = [],
  termName: string = "Current Assessment"
): Student[] {
  const currentDate = new Date().toISOString().split("T")[0];

  // Map existing students by unique key (rollNo or id)
  const masterMap = new Map<string, Student>();
  existingMasterStudents.forEach((st) => {
    masterMap.set(st.id.toLowerCase(), st);
    if (st.rollNo) masterMap.set(st.rollNo.toLowerCase(), st);
  });

  // Calculate student totals, percentages, grades, and pass/fail
  const calculated: Student[] = rawStudents.map((raw) => {
    const studentId = raw.id || raw.rollNo || `STU-${Math.random().toString(36).substring(2, 8)}`;
    const rollNo = raw.rollNo || studentId;
    const name = raw.name || `Student ${rollNo}`;
    const subjectMarks = raw.subjectMarks || {};
    const subjectNames = Object.keys(subjectMarks);
    const subjectCount = Math.max(subjectNames.length, 1);

    const totalMarks = subjectNames.reduce((acc, sub) => acc + (subjectMarks[sub] || 0), 0);
    const maxMarks = subjectCount * config.maxMarksPerSubject;
    const percentage = Number(((totalMarks / maxMarks) * 100).toFixed(2));
    const averageMarks = Number((totalMarks / subjectCount).toFixed(2));

    const grade = calculateGrade(percentage, config);

    // Pass / Fail Determination
    const failedSubjects: string[] = [];
    subjectNames.forEach((sub) => {
      const mark = subjectMarks[sub] || 0;
      if (mark < config.passingMarkPerSubject) {
        failedSubjects.push(sub);
      }
    });

    let passFail: "Pass" | "Fail" = "Pass";
    if (config.passingRule === "all_subjects") {
      passFail = failedSubjects.length === 0 ? "Pass" : "Fail";
    } else if (config.passingRule === "overall_percentage") {
      passFail = percentage >= config.passingPercentage ? "Pass" : "Fail";
    } else {
      // "both"
      passFail = failedSubjects.length === 0 && percentage >= config.passingPercentage ? "Pass" : "Fail";
    }

    return {
      id: studentId,
      rollNo,
      name,
      subjectMarks,
      totalMarks,
      maxMarks,
      percentage,
      averageMarks,
      grade,
      passFail,
      failedSubjects,
      rank: 1, // Will be computed in the ranking phase below
      performanceChange: (raw.performanceChange || "New") as PerformanceChangeType,
      history: raw.history || [],
      extraFields: raw.extraFields || {},
      previousMarks: raw.previousMarks,
      previousPercentage: raw.previousPercentage,
      previousGrade: raw.previousGrade,
      previousRank: raw.previousRank,
      marksDifference: raw.marksDifference,
      percentageDifference: raw.percentageDifference,
      rankDifference: raw.rankDifference,
      predictedPercentageMin: raw.predictedPercentageMin,
      predictedPercentageMax: raw.predictedPercentageMax,
      predictedTrend: raw.predictedTrend,
    };
  });

  // Compute Class Rankings
  // Sort descending by totalMarks; secondary sort ascending by name
  calculated.sort((a, b) => {
    if (b.totalMarks !== a.totalMarks) {
      return b.totalMarks - a.totalMarks;
    }
    return a.name.localeCompare(b.name);
  });

  // Assign ranks according to chosen ranking method
  if (config.rankingMethod === "competition") {
    // Standard Competition: 1, 2, 2, 4
    let currentRank = 1;
    for (let i = 0; i < calculated.length; i++) {
      if (i > 0 && calculated[i].totalMarks === calculated[i - 1].totalMarks) {
        calculated[i].rank = calculated[i - 1].rank;
      } else {
        calculated[i].rank = currentRank;
      }
      currentRank++;
    }
  } else {
    // Dense Ranking: 1, 2, 2, 3
    let currentRank = 1;
    for (let i = 0; i < calculated.length; i++) {
      if (i > 0 && calculated[i].totalMarks === calculated[i - 1].totalMarks) {
        calculated[i].rank = calculated[i - 1].rank;
      } else {
        if (i > 0) currentRank++;
        calculated[i].rank = currentRank;
      }
    }
  }

  // Cross-reference with existing records to compute deltas & history if master records exist
  calculated.forEach((st) => {
    const existing = masterMap.get(st.id.toLowerCase()) || (st.rollNo ? masterMap.get(st.rollNo.toLowerCase()) : undefined);

    if (existing) {
      st.previousMarks = existing.totalMarks;
      st.previousPercentage = existing.percentage;
      st.previousGrade = existing.grade;
      st.previousRank = existing.rank;

      st.marksDifference = st.totalMarks - existing.totalMarks;
      st.percentageDifference = Number((st.percentage - existing.percentage).toFixed(2));
      st.rankDifference = existing.rank - st.rank;

      if (st.marksDifference > 0) {
        st.performanceChange = "Improved";
      } else if (st.marksDifference < 0) {
        st.performanceChange = "Declined";
      } else {
        st.performanceChange = "No Change";
      }

      // Prediction calculations based on historical momentum & variance
      const markShift = st.marksDifference;
      const momentum = markShift > 0 ? 0.5 : 0.3;
      const predictedShift = markShift * momentum;
      const predictedEstimatedPercent = Math.min(100, Math.max(0, st.percentage + (predictedShift / (st.maxMarks || 500)) * 100));

      const margin = 2.5;
      st.predictedPercentageMin = Number(Math.max(0, predictedEstimatedPercent - margin).toFixed(1));
      st.predictedPercentageMax = Number(Math.min(100, predictedEstimatedPercent + margin).toFixed(1));

      if (st.passFail === "Fail" || (st.failedSubjects && st.failedSubjects.length > 0)) {
        st.predictedTrend = "Critical Support Needed";
      } else if (st.percentage >= 90) {
        st.predictedTrend = "High Achiever";
      } else if (st.performanceChange === "Improved") {
        st.predictedTrend = "Upward Growth";
      } else if (st.percentage < 55) {
        st.predictedTrend = "Needs Monitoring";
      } else {
        st.predictedTrend = "Steady / Stable";
      }
    } else {
      if (!st.predictedPercentageMin) {
        st.predictedPercentageMin = Number(Math.max(0, st.percentage - 3).toFixed(1));
        st.predictedPercentageMax = Number(Math.min(100, st.percentage + 3).toFixed(1));
        if (st.passFail === "Fail") {
          st.predictedTrend = "Critical Support Needed";
        } else if (st.percentage >= 90) {
          st.predictedTrend = "High Achiever";
        } else if (st.percentage >= 75) {
          st.predictedTrend = "Upward Growth";
        } else if (st.percentage >= 50) {
          st.predictedTrend = "Steady / Stable";
        } else {
          st.predictedTrend = "Needs Monitoring";
        }
      }
    }
  });

  return calculated;
}

/**
 * Computes full class-level statistics and distributions
 */
export function computeClassStatistics(
  students: Student[],
  config: SystemConfig
): ClassStatistics {
  const totalStudents = students.length;
  const passedStudents = students.filter((s) => s.passFail === "Pass").length;
  const failedStudents = totalStudents - passedStudents;
  const passPercentage = totalStudents > 0 ? Number(((passedStudents / totalStudents) * 100).toFixed(1)) : 0;
  const failPercentage = totalStudents > 0 ? Number(((failedStudents / totalStudents) * 100).toFixed(1)) : 0;

  const totalClassMarksSum = students.reduce((acc, s) => acc + s.percentage, 0);
  const classAverage = totalStudents > 0 ? Number((totalClassMarksSum / totalStudents).toFixed(2)) : 0;

  const highestMark = students.length > 0 ? Math.max(...students.map((s) => s.totalMarks)) : 0;
  const lowestMark = students.length > 0 ? Math.min(...students.map((s) => s.totalMarks)) : 0;

  // Top students (handle ties cleanly!)
  const topStudents = students.filter((s) => s.rank === 1);
  const lowestStudents = [...students].sort((a, b) => a.totalMarks - b.totalMarks).slice(0, Math.min(3, students.length));

  // Subject-wise performance metrics
  const allSubjectNames = Array.from(
    new Set(students.flatMap((s) => Object.keys(s.subjectMarks)))
  );

  const subjectPerformances: SubjectStats[] = allSubjectNames.map((subject) => {
    const marks = students.map((s) => s.subjectMarks[subject] ?? 0);
    const sum = marks.reduce((a, b) => a + b, 0);
    const avg = marks.length > 0 ? Number((sum / marks.length).toFixed(1)) : 0;
    const highest = marks.length > 0 ? Math.max(...marks) : 0;
    const lowest = marks.length > 0 ? Math.min(...marks) : 0;

    const passedCount = marks.filter((m) => m >= config.passingMarkPerSubject).length;
    const failedCount = marks.length - passedCount;
    const passRate = marks.length > 0 ? Number(((passedCount / marks.length) * 100).toFixed(1)) : 0;

    const highestScorers = students
      .filter((s) => s.subjectMarks[subject] === highest)
      .map((s) => s.name);

    return {
      subject,
      average: avg,
      highest,
      lowest,
      passed: passedCount,
      failed: failedCount,
      passRate,
      highestScorers,
      maxMarks: config.maxMarksPerSubject,
    };
  });

  // Grade Distribution
  const gradeDistribution = config.gradeScale.map((scale) => {
    const count = students.filter((s) => s.grade === scale.grade).length;
    const pct = totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(1)) : 0;
    return {
      grade: scale.grade,
      count,
      percentage: pct,
      minPercentage: scale.minPercentage,
    };
  });

  // Rank Distribution
  const rankBuckets = [
    { range: "Top 10% (Distinction)", minPct: 90 },
    { range: "75% - 89% (Merit)", minPct: 75 },
    { range: "60% - 74% (Satisfactory)", minPct: 60 },
    { range: "40% - 59% (Passing)", minPct: 40 },
    { range: "Below 40% (Needs Help)", minPct: 0 },
  ];

  const rankDistribution = rankBuckets.map((bucket, idx) => {
    const nextMin = idx > 0 ? rankBuckets[idx - 1].minPct : 101;
    const count = students.filter((s) => s.percentage >= bucket.minPct && s.percentage < nextMin).length;
    return { range: bucket.range, count };
  });

  return {
    totalStudents,
    passedStudents,
    failedStudents,
    passPercentage,
    failPercentage,
    classAverage,
    highestMark,
    lowestMark,
    topStudents,
    lowestStudents,
    subjectPerformances,
    gradeDistribution,
    rankDistribution,
    improvementTrends: {
      improvedCount: students.filter((s) => s.performanceChange === "Improved").length,
      declinedCount: students.filter((s) => s.performanceChange === "Declined").length,
      stableCount: students.filter((s) => s.performanceChange === "No Change").length,
      newCount: students.filter((s) => s.performanceChange === "New").length,
    },
  };
}

/**
 * Compares an incoming upload dataset with current master student records
 */
export function compareStudentDatasets(
  existingMasterStudents: Student[],
  rawIncomingStudents: Partial<Student>[],
  config: SystemConfig,
  termName: string = "Updated Assessment"
): ComparisonSummary & { mergedStudents: Partial<Student>[] } {
  const currentDate = new Date().toISOString().split("T")[0];

  // Calculate incoming student scores individually
  const calculatedIncoming = computeStudentCalculations(
    rawIncomingStudents,
    config,
    existingMasterStudents,
    termName
  );

  const masterMap = new Map<string, Student>();
  existingMasterStudents.forEach((st) => {
    masterMap.set(st.id.toLowerCase(), st);
    if (st.rollNo) masterMap.set(st.rollNo.toLowerCase(), st);
  });

  const updatedStudentsList: ComparisonSummary["updatedStudents"] = [];
  const newStudentsList: Student[] = [];
  const unchangedStudentsList: Student[] = [];
  const matchedMasterIds = new Set<string>();

  const mergedStudents: Partial<Student>[] = [];

  calculatedIncoming.forEach((st) => {
    const existing = masterMap.get(st.id.toLowerCase()) || (st.rollNo ? masterMap.get(st.rollNo.toLowerCase()) : undefined);

    if (existing) {
      matchedMasterIds.add(existing.id.toLowerCase());
      if (existing.rollNo) matchedMasterIds.add(existing.rollNo.toLowerCase());

      const historyArchive = [
        ...(existing.history || []),
        {
          termName: existing.history && existing.history.length > 0 ? "Previous Assessment" : "Baseline",
          date: currentDate,
          subjectMarks: { ...existing.subjectMarks },
          totalMarks: existing.totalMarks,
          maxMarks: existing.maxMarks,
          percentage: existing.percentage,
          grade: existing.grade,
          rank: existing.rank,
          passFail: existing.passFail,
        },
      ];

      mergedStudents.push({
        ...st,
        history: historyArchive,
      });

      if (st.marksDifference !== 0) {
        updatedStudentsList.push({
          student: st,
          prevMarks: existing.totalMarks,
          newMarks: st.totalMarks,
          diff: st.marksDifference || 0,
          prevPercentage: existing.percentage,
          newPercentage: st.percentage,
          prevGrade: existing.grade,
          newGrade: st.grade,
          prevRank: existing.rank,
          newRank: st.rank,
          status: st.performanceChange,
        });
      } else {
        unchangedStudentsList.push(st);
      }
    } else {
      newStudentsList.push(st);
      mergedStudents.push({
        ...st,
        performanceChange: "New",
        history: [],
      });
    }
  });

  // Retain any existing master students not present in incoming file
  const removedStudentsList: Student[] = [];
  existingMasterStudents.forEach((st) => {
    if (!matchedMasterIds.has(st.id.toLowerCase()) && !matchedMasterIds.has(st.rollNo.toLowerCase())) {
      removedStudentsList.push(st);
      mergedStudents.push(st);
    }
  });

  return {
    termTitle: termName,
    totalUploaded: calculatedIncoming.length,
    newStudents: newStudentsList,
    updatedStudents: updatedStudentsList,
    unchangedStudents: unchangedStudentsList,
    removedStudents: removedStudentsList,
    duplicateRecords: [],
    mergedStudents,
  };
}

/**
 * Builds a professionally formatted multi-sheet Excel (.xlsx) file
 * 7 sheets as specified in prompt:
 * 1. Student Records
 * 2. Marks Analysis
 * 3. Rankings
 * 4. Pass Fail Analysis
 * 5. Subject Analysis
 * 6. Performance History
 * 7. Summary Dashboard
 */
export function generateMasterExcelWorkbook(
  students: Student[],
  stats: ClassStatistics,
  config: SystemConfig,
  termName: string = "Updated Assessment"
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const subjects = Array.from(new Set(students.flatMap((s) => Object.keys(s.subjectMarks))));

  // 1. SHEET 1: Student Records
  const recordsData = students.map((s) => {
    const row: Record<string, any> = {
      "Rank": s.rank,
      "Roll Number": s.rollNo,
      "Student Name": s.name,
    };
    subjects.forEach((sub) => {
      row[sub] = s.subjectMarks[sub] ?? 0;
    });
    row["Total Marks"] = s.totalMarks;
    row["Max Marks"] = s.maxMarks;
    row["Percentage (%)"] = s.percentage;
    row["Grade"] = s.grade;
    row["Pass / Fail"] = s.passFail;
    row["Performance Status"] = s.performanceChange;
    return row;
  });
  const ws1 = XLSX.utils.json_to_sheet(recordsData);
  ws1["!cols"] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 25 },
    ...subjects.map(() => ({ wch: 14 })),
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Student Records");

  // 2. SHEET 2: Marks Analysis
  const marksAnalysisData = students.map((s) => ({
    "Roll Number": s.rollNo,
    "Student Name": s.name,
    "Previous Marks": s.previousMarks ?? "N/A",
    "Current Marks": s.totalMarks,
    "Marks Difference": s.marksDifference !== undefined && s.marksDifference !== null ? (s.marksDifference > 0 ? `+${s.marksDifference}` : s.marksDifference) : "New",
    "Previous %": s.previousPercentage !== undefined && s.previousPercentage !== null ? `${s.previousPercentage}%` : "N/A",
    "Current %": `${s.percentage}%`,
    "% Difference": s.percentageDifference !== undefined && s.percentageDifference !== null ? (s.percentageDifference > 0 ? `+${s.percentageDifference}%` : `${s.percentageDifference}%`) : "New",
    "Previous Grade": s.previousGrade ?? "N/A",
    "Current Grade": s.grade,
    "Previous Rank": s.previousRank ?? "N/A",
    "Current Rank": s.rank,
    "Rank Change": s.rankDifference !== undefined && s.rankDifference !== null ? (s.rankDifference > 0 ? `+${s.rankDifference} ranks` : s.rankDifference === 0 ? "Same" : `${s.rankDifference} ranks`) : "New",
    "Status": s.performanceChange,
    "Predicted Range (%)": `${s.predictedPercentageMin ?? s.percentage}% - ${s.predictedPercentageMax ?? s.percentage}%`,
    "Trajectory": s.predictedTrend ?? "Stable",
  }));
  const ws2 = XLSX.utils.json_to_sheet(marksAnalysisData);
  ws2["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Marks Analysis");

  // 3. SHEET 3: Rankings
  const rankingsData = students.map((s) => ({
    "Class Rank": s.rank,
    "Roll Number": s.rollNo,
    "Student Name": s.name,
    "Total Marks": s.totalMarks,
    "Maximum Marks": s.maxMarks,
    "Percentage": `${s.percentage}%`,
    "Grade": s.grade,
    "Honor Designation": s.rank === 1 ? "Top Scorer (Gold Medalist)" : s.rank <= 3 ? "Top 3 Podium" : s.percentage >= 80 ? "Distinction Scholar" : "Standard",
  }));
  const ws3 = XLSX.utils.json_to_sheet(rankingsData);
  ws3["!cols"] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Rankings");

  // 4. SHEET 4: Pass Fail Analysis
  const passFailData = students.map((s) => ({
    "Roll Number": s.rollNo,
    "Student Name": s.name,
    "Status": s.passFail,
    "Failed Subject Count": s.failedSubjects.length,
    "Failed Subjects": s.failedSubjects.join(", ") || "None",
    "Overall Percentage": `${s.percentage}%`,
    "Meets Overall Pass Threshold": s.percentage >= config.passingPercentage ? "Yes" : "No",
    "Requires Intervention": s.passFail === "Fail" || s.percentage < config.passingPercentage + 10 ? "YES - Priority" : "No",
  }));
  const ws4 = XLSX.utils.json_to_sheet(passFailData);
  ws4["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 22 },
    { wch: 30 },
    { wch: 20 },
    { wch: 26 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "Pass Fail Analysis");

  // 5. SHEET 5: Subject Analysis
  const subjectData = stats.subjectPerformances.map((sub) => ({
    "Subject": sub.subject,
    "Class Average (%)": sub.average,
    "Highest Mark": sub.highest,
    "Lowest Mark": sub.lowest,
    "Passed Students": sub.passed,
    "Failed Students": sub.failed,
    "Subject Pass Rate (%)": `${sub.passRate}%`,
    "Top Scorers": sub.highestScorers.join(", "),
    "Max Marks": sub.maxMarks,
  }));
  const ws5 = XLSX.utils.json_to_sheet(subjectData);
  ws5["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 35 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, "Subject Analysis");

  // 6. SHEET 6: Performance History
  const historyRows: any[] = [];
  students.forEach((s) => {
    (s.history || []).forEach((h) => {
      historyRows.push({
        "Roll Number": s.rollNo,
        "Student Name": s.name,
        "Assessment / Term": h.termName,
        "Date of Record": h.date,
        "Total Marks": h.totalMarks,
        "Percentage (%)": h.percentage,
        "Grade": h.grade,
        "Rank": h.rank,
        "Status": h.passFail,
      });
    });
  });
  const ws6 = XLSX.utils.json_to_sheet(historyRows);
  ws6["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws6, "Performance History");

  // 7. SHEET 7: Summary Dashboard
  const summaryRows = [
    { "Metric": "Assessment Term", "Value": termName },
    { "Metric": "Academic Year", "Value": config.academicYear },
    { "Metric": "Class & Section", "Value": `${config.className} - ${config.section}` },
    { "Metric": "Report Generated On", "Value": new Date().toLocaleString() },
    { "Metric": "--------------------------", "Value": "--------------------------" },
    { "Metric": "Total Students Enrolled", "Value": stats.totalStudents },
    { "Metric": "Total Passed Students", "Value": stats.passedStudents },
    { "Metric": "Total Failed Students", "Value": stats.failedStudents },
    { "Metric": "Overall Pass Rate", "Value": `${stats.passPercentage}%` },
    { "Metric": "Overall Fail Rate", "Value": `${stats.failPercentage}%` },
    { "Metric": "Class Average Percentage", "Value": `${stats.classAverage}%` },
    { "Metric": "Highest Overall Score", "Value": stats.highestMark },
    { "Metric": "Top Scorer(s) (Rank 1)", "Value": stats.topStudents.map((t) => `${t.name} (${t.totalMarks} marks, ${t.percentage}%)`).join("; ") },
    { "Metric": "Lowest Overall Score", "Value": stats.lowestMark },
    { "Metric": "--------------------------", "Value": "--------------------------" },
    { "Metric": "Configured Passing Mark per Subject", "Value": config.passingMarkPerSubject },
    { "Metric": "Configured Passing Percentage", "Value": `${config.passingPercentage}%` },
    { "Metric": "Passing Rule Mode", "Value": config.passingRule },
    { "Metric": "Ranking Calculation Algorithm", "Value": config.rankingMethod === "competition" ? "Standard Competition (1-2-2-4)" : "Dense (1-2-2-3)" },
    { "Metric": "Students Showing Improvement", "Value": stats.improvementTrends.improvedCount },
    { "Metric": "Students Showing Decline", "Value": stats.improvementTrends.declinedCount },
    { "Metric": "Students Stable", "Value": stats.improvementTrends.stableCount },
  ];
  const ws7 = XLSX.utils.json_to_sheet(summaryRows);
  ws7["!cols"] = [{ wch: 38 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws7, "Summary Dashboard");

  // 8. SHEET 8: Arrear List
  const arrearList = extractArrearRecords(students, config);
  const arrearRows = arrearList.map((a, idx) => ({
    "S.No": idx + 1,
    "Register Number": a.registerNo,
    "Student Name": a.studentName,
    "Department": a.department,
    "Semester": a.semester,
    "Subject Code": a.subjectCode,
    "Subject Name": a.subjectName,
    "Marks Scored": a.marksScored,
    "Passing Mark": a.passingMarks,
    "Deficit": `-${a.deficit}`,
    "Arrear Attempt": a.arrearAttempt,
    "Status": a.status,
  }));
  const ws8 = XLSX.utils.json_to_sheet(
    arrearRows.length > 0
      ? arrearRows
      : [{ "Status": "Zero Arrears - All students meet or exceed passing thresholds" }]
  );
  ws8["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws8, "Arrear List");

  return wb;
}

/**
 * Robustly trigger browser download of an XLSX workbook using binary Blob and anchor click
 */
export function saveWorkbook(wb: XLSX.WorkBook, filename: string): void {
  try {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    if (typeof window !== "undefined") {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch {
          // ignore cleanup errors
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn("Direct blob save failed, attempting XLSX.writeFile fallback:", err);
  }

  // Fallback to SheetJS native writeFile
  try {
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error("XLSX.writeFile fallback also encountered error:", err);
  }
}

/**
 * Downloads the master Excel workbook in browser
 */
export function downloadExcelFile(
  students: Student[],
  stats: ClassStatistics,
  config: SystemConfig,
  termName?: string
) {
  const wb = generateMasterExcelWorkbook(students, stats, config, termName);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Student_Records_Updated_${dateStr}.xlsx`;
  saveWorkbook(wb, filename);
}

/**
 * Generates sample Excel templates for users to test or download
 */
export function generateSampleExcelFile(type: "term1" | "term2" | "template"): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split("T")[0];

  if (type === "term1") {
    const data = [
      { "Roll No": "1001", "Student Name": "Aarav Sharma", Mathematics: 94, Science: 92, English: 90, "Social Studies": 91, "Computer Science": 95 },
      { "Roll No": "1002", "Student Name": "Ananya Patel", Mathematics: 95, Science: 93, English: 94, "Social Studies": 94, "Computer Science": 94 },
      { "Roll No": "1003", "Student Name": "Rohan Verma", Mathematics: 85, Science: 82, English: 83, "Social Studies": 78, "Computer Science": 87 },
      { "Roll No": "1004", "Student Name": "Ishita Roy", Mathematics: 84, Science: 85, English: 88, "Social Studies": 84, "Computer Science": 84 },
      { "Roll No": "1005", "Student Name": "Vikram Malhotra", Mathematics: 68, Science: 65, English: 70, "Social Studies": 68, "Computer Science": 74 },
      { "Roll No": "1006", "Student Name": "Sneha Mukherjee", Mathematics: 66, Science: 64, English: 76, "Social Studies": 74, "Computer Science": 70 },
      { "Roll No": "1007", "Student Name": "Kabir Das", Mathematics: 58, Science: 60, English: 64, "Social Studies": 62, "Computer Science": 66 },
      { "Roll No": "1008", "Student Name": "Pooja Hegde", Mathematics: 42, Science: 48, English: 54, "Social Studies": 50, "Computer Science": 56 },
      { "Roll No": "1009", "Student Name": "Tanya Sen", Mathematics: 45, Science: 56, English: 62, "Social Studies": 60, "Computer Science": 62 },
      { "Roll No": "1010", "Student Name": "Devendra Nair", Mathematics: 40, Science: 41, English: 43, "Social Studies": 42, "Computer Science": 44 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Mid-Term Examination");
    saveWorkbook(wb, `Sample_Student_Data_Term1_${dateStr}.xlsx`);
  } else if (type === "term2") {
    // Shows changes, improvements, declines, and a new student (Meera Kapoor)!
    const data = [
      { "Roll No": "1001", "Student Name": "Aarav Sharma", Mathematics: 98, Science: 95, English: 92, "Social Studies": 94, "Computer Science": 99 },
      { "Roll No": "1002", "Student Name": "Ananya Patel", Mathematics: 96, Science: 94, English: 95, "Social Studies": 96, "Computer Science": 97 },
      { "Roll No": "1003", "Student Name": "Rohan Verma", Mathematics: 88, Science: 84, English: 86, "Social Studies": 82, "Computer Science": 90 },
      { "Roll No": "1004", "Student Name": "Ishita Roy", Mathematics: 82, Science: 80, English: 89, "Social Studies": 85, "Computer Science": 84 },
      { "Roll No": "1005", "Student Name": "Vikram Malhotra", Mathematics: 72, Science: 68, English: 74, "Social Studies": 70, "Computer Science": 76 },
      { "Roll No": "1006", "Student Name": "Sneha Mukherjee", Mathematics: 65, Science: 62, English: 78, "Social Studies": 75, "Computer Science": 70 },
      { "Roll No": "1007", "Student Name": "Kabir Das", Mathematics: 54, Science: 58, English: 64, "Social Studies": 60, "Computer Science": 64 },
      { "Roll No": "1008", "Student Name": "Pooja Hegde", Mathematics: 48, Science: 52, English: 58, "Social Studies": 54, "Computer Science": 58 },
      { "Roll No": "1009", "Student Name": "Tanya Sen", Mathematics: 34, Science: 55, English: 62, "Social Studies": 58, "Computer Science": 61 },
      { "Roll No": "1010", "Student Name": "Devendra Nair", Mathematics: 30, Science: 32, English: 44, "Social Studies": 42, "Computer Science": 46 },
      { "Roll No": "1011", "Student Name": "Meera Kapoor", Mathematics: 91, Science: 89, English: 92, "Social Studies": 88, "Computer Science": 93 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Final Examination Update");
    saveWorkbook(wb, `Sample_Student_Data_Term2_Update_${dateStr}.xlsx`);
  } else {
    // Blank starter template
    const templateData = [
      { "Roll No": "1001", "Student Name": "John Doe", Mathematics: 85, Science: 78, English: 92, "Social Studies": 80, "Computer Science": 88 },
      { "Roll No": "1002", "Student Name": "Jane Smith", Mathematics: 90, Science: 88, English: 94, "Social Studies": 86, "Computer Science": 92 },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Student Marks Template");
    saveWorkbook(wb, `Student_Excel_Upload_Template_${dateStr}.xlsx`);
  }
}
