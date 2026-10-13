import * as XLSX from "xlsx";
import {
  ArrearRecord,
  Student,
  SubjectWiseArrearGroup,
  StudentWiseArrearGroup,
  SystemConfig,
} from "../types";

/**
 * Standard Subject Code Dictionary
 */
const KNOWN_SUBJECT_CODES: Record<string, string> = {
  mathematics: "MA102",
  maths: "MA102",
  math: "MA102",
  science: "SC101",
  english: "EN101",
  "social studies": "SS103",
  "social science": "SS103",
  "computer science": "CS101",
  programming: "CS102",
  physics: "PH101",
  chemistry: "CY102",
  electronics: "EC103",
  database: "CS201",
  networking: "CS202",
  "data structures": "CS203",
  "web development": "CS204",
};

/**
 * Parses or extracts clean Subject Code and Subject Name
 */
export function getSubjectCodeAndName(rawSubject: string): { code: string; name: string } {
  const trimmed = rawSubject.trim();

  // Pattern: "CS101 - Programming Fundamentals" or "CS101: Mathematics"
  const prefixMatch = trimmed.match(/^([A-Za-z]{2,4}\s*\d{2,4})\s*[-:–]\s*(.*)$/);
  if (prefixMatch) {
    return {
      code: prefixMatch[1].replace(/\s+/g, "").toUpperCase(),
      name: prefixMatch[2].trim(),
    };
  }

  // Reverse pattern: "Programming Fundamentals (CS101)"
  const parenMatch = trimmed.match(/^(.*?)\s*\(([A-Za-z]{2,4}\s*\d{2,4})\)$/);
  if (parenMatch) {
    return {
      code: parenMatch[2].replace(/\s+/g, "").toUpperCase(),
      name: parenMatch[1].trim(),
    };
  }

  // Known dictionary match
  const lower = trimmed.toLowerCase();
  if (KNOWN_SUBJECT_CODES[lower]) {
    return {
      code: KNOWN_SUBJECT_CODES[lower],
      name: trimmed,
    };
  }

  // Fallback: Generate algorithmic code e.g. "Biology" -> "BIO101"
  const words = trimmed.split(/\s+/).filter(Boolean);
  let code = "SUB101";
  if (words.length >= 2) {
    code = (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase() + "101";
  } else if (words.length === 1 && words[0].length >= 2) {
    code = words[0].substring(0, 3).toUpperCase() + "101";
  }

  return {
    code,
    name: trimmed,
  };
}

/**
 * Extracts all valid arrear records across the student cohort
 * Excludes students without arrears.
 */
export function extractArrearRecords(
  students: Student[],
  config: SystemConfig
): ArrearRecord[] {
  const passingThreshold = config.passingMarkPerSubject ?? 40;
  const maxMarks = config.maxMarksPerSubject ?? 100;
  const arrearList: ArrearRecord[] = [];

  students.forEach((student) => {
    // Check subjectMarks for failures (< passingThreshold)
    Object.entries(student.subjectMarks).forEach(([subjName, mark]) => {
      if (typeof mark === "number" && mark < passingThreshold) {
        const { code, name } = getSubjectCodeAndName(subjName);
        const deficit = passingThreshold - mark;

        // Determine attempt count by checking student history
        let previousFailedOccurrences = 0;
        if (student.history && Array.isArray(student.history)) {
          student.history.forEach((hist) => {
            if (hist.subjectMarks && typeof hist.subjectMarks[subjName] === "number") {
              if (hist.subjectMarks[subjName] < passingThreshold) {
                previousFailedOccurrences++;
              }
            }
          });
        }

        const attemptNum = previousFailedOccurrences + 1;
        const arrearAttempt =
          attemptNum === 1
            ? "1st Attempt"
            : attemptNum === 2
            ? "2nd Attempt (Re-appear)"
            : `${attemptNum}rd Attempt (Multiple)`;

        let status: ArrearRecord["status"] = "Arrear";
        if (attemptNum > 1) {
          status = "Re-appear";
        } else if (deficit >= 15 || mark < 25) {
          status = "Critical";
        }

        const department =
          student.extraFields?.department ||
          student.extraFields?.dept ||
          "Computer Science & Engineering";

        const course =
          student.extraFields?.course ||
          student.extraFields?.degree ||
          "B.E. Computer Science";

        const year = student.extraFields?.year || "Year II";
        const semester = student.extraFields?.semester || "Semester 3";
        const academicYear = student.extraFields?.academicYear || config.academicYear || "2025-2026";
        const batch = student.extraFields?.batch || "2024-2028";

        arrearList.push({
          id: `${student.id}_${code}`,
          studentId: student.id,
          registerNo: student.rollNo || student.id,
          studentName: student.name,
          department,
          course,
          year,
          semester,
          academicYear,
          batch,
          subjectCode: code,
          subjectName: name,
          marksScored: mark,
          maxMarks,
          passingMarks: passingThreshold,
          deficit,
          arrearAttempt,
          status,
          remarks:
            deficit > 10
              ? `Deficit of ${deficit} marks. Priority remediation needed.`
              : `Deficit of ${deficit} marks. Eligible for re-examination.`,
        });
      }
    });
  });

  return arrearList;
}

/**
 * Groups arrear records by Subject
 * Ordering: Subject Code / Subject Name in ascending order -> Students in ascending order
 */
export function buildSubjectWiseArrearGroups(
  records: ArrearRecord[]
): SubjectWiseArrearGroup[] {
  const groupMap = new Map<string, ArrearRecord[]>();

  records.forEach((rec) => {
    const key = `${rec.subjectCode}___${rec.subjectName}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(rec);
  });

  const groups: SubjectWiseArrearGroup[] = [];

  groupMap.forEach((students, key) => {
    const [subjectCode, subjectName] = key.split("___");
    
    // Sort students by Register Number ascending, then Student Name
    const sortedStudents = [...students].sort((a, b) => {
      const regCompare = a.registerNo.localeCompare(b.registerNo, undefined, { numeric: true });
      if (regCompare !== 0) return regCompare;
      return a.studentName.localeCompare(b.studentName);
    });

    const maxMarks = students[0]?.maxMarks || 100;
    const passingMarks = students[0]?.passingMarks || 40;

    groups.push({
      subjectCode,
      subjectName,
      maxMarks,
      passingMarks,
      totalArrears: sortedStudents.length,
      students: sortedStudents,
    });
  });

  // Sort groups by Subject Code ascending, then Subject Name
  return groups.sort((a, b) => {
    const codeCompare = a.subjectCode.localeCompare(b.subjectCode, undefined, { numeric: true });
    if (codeCompare !== 0) return codeCompare;
    return a.subjectName.localeCompare(b.subjectName);
  });
}

/**
 * Groups arrear records by Student
 * Ordering: Student Register Number in ascending order -> Arrear Subjects in ascending order
 */
export function buildStudentWiseArrearGroups(
  records: ArrearRecord[],
  allStudents: Student[]
): StudentWiseArrearGroup[] {
  const studentMap = new Map<string, Student>();
  allStudents.forEach((s) => studentMap.set(s.id, s));

  const groupMap = new Map<string, ArrearRecord[]>();

  records.forEach((rec) => {
    if (!groupMap.has(rec.studentId)) {
      groupMap.set(rec.studentId, []);
    }
    groupMap.get(rec.studentId)!.push(rec);
  });

  const groups: StudentWiseArrearGroup[] = [];

  groupMap.forEach((arrearSubjects, studentId) => {
    const originalStudent = studentMap.get(studentId);
    const firstRec = arrearSubjects[0];

    // Sort arrear subjects by Subject Code ascending
    const sortedSubjects = [...arrearSubjects].sort((a, b) => {
      return a.subjectCode.localeCompare(b.subjectCode, undefined, { numeric: true });
    });

    groups.push({
      studentId,
      registerNo: firstRec.registerNo,
      studentName: firstRec.studentName,
      department: firstRec.department,
      course: firstRec.course,
      year: firstRec.year,
      semester: firstRec.semester,
      academicYear: firstRec.academicYear,
      totalArrears: sortedSubjects.length,
      overallPercentage: originalStudent?.percentage ?? 0,
      grade: originalStudent?.grade ?? "F",
      rank: originalStudent?.rank ?? 0,
      arrearSubjects: sortedSubjects,
    });
  });

  // Sort by Register Number in ascending order
  return groups.sort((a, b) => {
    const regCompare = a.registerNo.localeCompare(b.registerNo, undefined, { numeric: true });
    if (regCompare !== 0) return regCompare;
    return a.studentName.localeCompare(b.studentName);
  });
}

/**
 * Exports Subject-wise Arrear List to a formatted Excel workbook
 */
export function exportSubjectWiseArrearExcel(
  groups: SubjectWiseArrearGroup[],
  config: SystemConfig
): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split("T")[0];

  // 1. Flatten into a master subject-wise tabular sheet
  const rows: any[] = [];
  groups.forEach((group) => {
    group.students.forEach((st, idx) => {
      rows.push({
        "S.No": idx + 1,
        "Subject Code": group.subjectCode,
        "Subject Name": group.subjectName,
        "Student Register No": st.registerNo,
        "Student Name": st.studentName,
        "Department": st.department,
        "Semester": st.semester,
        "Marks Scored": st.marksScored,
        "Passing Mark": group.passingMarks,
        "Deficit": `-${st.deficit}`,
        "Arrear Attempt": st.arrearAttempt,
        "Status": st.status,
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 22 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Subject-wise Arrears");

  // 2. Summary sheet
  const summaryRows = groups.map((g, idx) => ({
    "S.No": idx + 1,
    "Subject Code": g.subjectCode,
    "Subject Name": g.subjectName,
    "Passing Criteria": `${g.passingMarks}/${g.maxMarks}`,
    "Total Arrear Candidates": g.totalArrears,
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 18 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Arrear Subjects Summary");

  XLSX.writeFile(wb, `Subject_Wise_Arrear_List_${config.academicYear || dateStr}.xlsx`);
}

/**
 * Exports Student-wise Arrear List to a formatted Excel workbook
 */
export function exportStudentWiseArrearExcel(
  groups: StudentWiseArrearGroup[],
  config: SystemConfig
): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split("T")[0];

  const rows: any[] = [];
  groups.forEach((group, sIdx) => {
    group.arrearSubjects.forEach((sub, subIdx) => {
      rows.push({
        "Student #": sIdx + 1,
        "Register Number": group.registerNo,
        "Student Name": group.studentName,
        "Department": group.department,
        "Semester": group.semester,
        "Total Arrears": group.totalArrears,
        "Subject Code": sub.subjectCode,
        "Subject Name": sub.subjectName,
        "Marks Scored": sub.marksScored,
        "Passing Mark": sub.passingMarks,
        "Deficit": `-${sub.deficit}`,
        "Arrear Attempt": sub.arrearAttempt,
        "Status": sub.status,
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Student-wise Arrears");

  // Summary of Students with Arrears
  const studentSummaryRows = groups.map((g, idx) => ({
    "S.No": idx + 1,
    "Register Number": g.registerNo,
    "Student Name": g.studentName,
    "Department": g.department,
    "Semester": g.semester,
    "Total Arrears": g.totalArrears,
    "Overall Percentage": `${g.overallPercentage}%`,
    "Arrear Subjects": g.arrearSubjects.map((s) => `${s.subjectCode} (${s.marksScored}/${s.passingMarks})`).join(", "),
  }));
  const wsSummary = XLSX.utils.json_to_sheet(studentSummaryRows);
  wsSummary["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Students with Arrears");

  XLSX.writeFile(wb, `Student_Wise_Arrear_List_${config.academicYear || dateStr}.xlsx`);
}
