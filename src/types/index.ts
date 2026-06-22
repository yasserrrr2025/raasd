export interface School {
  schoolName: string;
  ministryNumber: string;
  stage?: string;
  educationType?: string;
  educationAdministration?: string;
  department?: string;
}

export interface StudentRecord {
  id: string; // Unique ID per row
  originalRowIndex: number;
  name: string;
  studentId?: string;
  score: number | null; // Raw score, null if absent or needs review and 0
  originalScoreValue: string | number; // Raw value from Excel
  status: 'مختبر' | 'غائب' | 'يحتاج مراجعة';
  gradeScale: string; // ممتاز، جيد جدا الخ
  percentage: number;
  notes?: string;
}

export interface ProjectData {
  id?: number; // IndexedDB autoincrement ID
  projectId: string; // UUID
  schoolName: string;
  ministryNumber: string;
  stage: string;
  educationType: string;
  educationAdministration: string;
  department: string;
  subject: string;
  grade: string;
  term: string;
  academicYear: string;
  dataEntryName: string;
  students: StudentRecord[];
  importMapping: {
    nameColumn: string;
    scoreColumn: string;
    studentIdColumn?: string;
    statusColumn?: string;
    notesColumn?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Statistics {
  totalStudents: number;
  testedStudents: number;
  absentStudents: number;
  testedPercentage: number;
  absentPercentage: number;
  mean: number | null;
  median: number | null;
  mode: number | null;
  standardDeviation: number | null;
  skewness: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  range: number | null;
  generalPercentage: number | null;
  generalGrade: string;
}

export interface GradeDistribution {
  rangeStart: number;
  rangeEnd: number;
  label: string;
  count: number;
  percentage: number;
}
