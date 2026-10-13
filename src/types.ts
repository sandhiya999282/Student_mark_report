export interface StudentHistoryEntry {
  termName: string;
  date: string;
  timestamp?: string;
  subjectMarks: Record<string, number>;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  passFail: "Pass" | "Fail";
}

export type PerformanceChangeType = "Improved" | "Declined" | "No Change" | "New";

export type PredictedTrendType = 
  | "High Achiever"
  | "Upward Growth"
  | "Steady / Stable"
  | "Needs Monitoring"
  | "Critical Support Needed";

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  subjectMarks: Record<string, number>;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  averageMarks: number;
  grade: string;
  passFail: "Pass" | "Fail";
  failedSubjects: string[];
  rank: number;
  previousMarks?: number | null;
  previousPercentage?: number | null;
  previousGrade?: string | null;
  previousRank?: number | null;
  marksDifference?: number | null;
  percentageDifference?: number | null;
  rankDifference?: number | null;
  performanceChange: PerformanceChangeType;
  predictedPercentageMin?: number;
  predictedPercentageMax?: number;
  predictedTrend?: PredictedTrendType;
  academicRemarks?: string;
  history: StudentHistoryEntry[];
  extraFields?: Record<string, any>;
}

export interface SubjectStats {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
  passed: number;
  failed: number;
  passRate: number;
  highestScorers: string[];
  maxMarks: number;
}

export interface GradeDistributionItem {
  grade: string;
  count: number;
  percentage: number;
  minPercentage: number;
}

export interface ClassStatistics {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage: number;
  failPercentage: number;
  classAverage: number;
  highestMark: number;
  lowestMark: number;
  topStudents: Student[];
  lowestStudents: Student[];
  subjectPerformances: SubjectStats[];
  gradeDistribution: GradeDistributionItem[];
  rankDistribution: { range: string; count: number }[];
  improvementTrends: {
    improvedCount: number;
    declinedCount: number;
    stableCount: number;
    newCount: number;
  };
}

export interface ValidationIssue {
  id: string;
  row: number;
  studentName?: string;
  field: string;
  message: string;
  severity: "error" | "warning";
  value?: any;
}

export interface ComparisonSummary {
  termTitle: string;
  totalUploaded: number;
  newStudents: Student[];
  updatedStudents: {
    student: Student;
    prevMarks: number;
    newMarks: number;
    diff: number;
    prevPercentage: number;
    newPercentage: number;
    prevGrade: string;
    newGrade: string;
    prevRank: number;
    newRank: number;
    status: PerformanceChangeType;
  }[];
  unchangedStudents: Student[];
  removedStudents: Student[];
  duplicateRecords: { key: string; rows: number[] }[];
  mergedStudents?: Partial<Student>[];
}

export interface GradeScaleSetting {
  grade: string;
  minPercentage: number;
  description: string;
}

export interface SystemConfig {
  passingPercentage: number;
  passingMarkPerSubject: number;
  passingRule: "all_subjects" | "overall_percentage" | "both";
  maxMarksPerSubject: number;
  rankingMethod: "competition" | "dense";
  gradeScale: GradeScaleSetting[];
  academicYear: string;
  className: string;
  section: string;
  primaryIdField: "rollNo" | "name" | "auto";
}

export interface ParsedRawFile {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheet: string;
  rawHeaders: string[];
  rawRows: Record<string, any>[];
  detectedSubjects: string[];
  detectedColumns: {
    nameCol?: string;
    rollNoCol?: string;
    totalCol?: string;
    gradeCol?: string;
    classCol?: string;
    sectionCol?: string;
    subjectCols: string[];
    extraCols: string[];
  };
  validationIssues: ValidationIssue[];
}

export interface ArrearRecord {
  id: string;
  studentId: string;
  registerNo: string;
  studentName: string;
  department: string;
  course: string;
  year: string;
  semester: string;
  academicYear: string;
  batch: string;
  subjectCode: string;
  subjectName: string;
  marksScored: number;
  maxMarks: number;
  passingMarks: number;
  deficit: number;
  arrearAttempt: string;
  status: "Arrear" | "Pending Clearance" | "Re-appear" | "Critical";
  remarks?: string;
}

export interface SubjectWiseArrearGroup {
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  totalArrears: number;
  students: ArrearRecord[];
}

export interface StudentWiseArrearGroup {
  studentId: string;
  registerNo: string;
  studentName: string;
  department: string;
  course: string;
  year: string;
  semester: string;
  academicYear: string;
  totalArrears: number;
  overallPercentage: number;
  grade: string;
  rank: number;
  arrearSubjects: ArrearRecord[];
}

export interface ArrearFilterState {
  academicYear: string;
  department: string;
  course: string;
  batch: string;
  year: string;
  semester: string;
  subject: string;
  status: string;
  searchQuery: string;
}

export type UserRole = 
  | "Dean / Administrator"
  | "Faculty / Professor"
  | "Examination Controller"
  | "Department Coordinator";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  staffId: string;
  password?: string;
  avatarBg?: string;
  registeredAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  department: string;
  staffId: string;
}

export interface EmailNotificationConfig {
  senderEmail: string;
  senderName: string;
  replyToEmail: string;
  smtpServer: string;
  enableLoginAlerts: boolean;
  enableRegistrationWelcome: boolean;
  securityNotice: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  recipientName: string;
  subject: string;
  category: "LOGIN_VERIFICATION" | "REGISTRATION_WELCOME" | "SECURITY_ALERT";
  bodySnippet: string;
  htmlContent: string;
  status: "DELIVERED" | "QUEUED";
  messageId?: string;
  backendDelivered?: boolean;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    role?: string;
    staffId?: string;
    loginTime?: string;
  };
}
