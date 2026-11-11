export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  institution?: string;
  department?: string;
  batch?: string;
  phone?: string;
  role?: string;
}

export interface Course {
  _id: string;
  userId: string;
  name: string;
  code: string;
  teacherName: string;
  section: string;
  semester: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  _id: string;
  userId: string;
  studentId: string;
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  batch?: string;
  courseIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStudentEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  section?: string;
  date: string; // YYYY-MM-DD
  records: AttendanceStudentEntry[];
  summary: AttendanceSummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendanceProfile {
  student: Student;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  history: Array<{
    date: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}
