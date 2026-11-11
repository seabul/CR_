"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import WhatsAppReportModal from "@/components/WhatsAppReportModal";
import {
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  Save,
  CheckCheck,
  Send,
  RotateCcw,
} from "lucide-react";
import { Course, Student, AttendanceStatus, AttendanceRecord } from "@/types";
import { toast } from "sonner";

interface StudentState {
  studentId: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
  notes: string;
}

function TakeAttendanceContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "";
  const initialDate = searchParams.get("date") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [selectedDate, setSelectedDate] = useState(
    () => initialDate || new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // WhatsApp Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [savedRecordForReport, setSavedRecordForReport] = useState<AttendanceRecord | null>(null);

  // 1. Fetch courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const list: Course[] = await res.json();
          setCourses(list);
          if (list.length > 0 && !selectedCourseId) {
            setSelectedCourseId(list[0]._id);
          }
        }
      } catch (err) {
        console.error("Courses fetch error:", err);
      }
    }
    fetchCourses();
  }, [selectedCourseId]);

  // 2. Fetch students
  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const res = await fetch("/api/students?sortBy=rollNumber&sortOrder=asc");
        if (res.ok) {
          const list: Student[] = await res.json();
          setStudents(list);
        }
      } catch (err) {
        console.error("Students fetch error:", err);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, []);

  // 3. Check for existing session when course or date changes
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;

    async function checkExistingSession() {
      try {
        const res = await fetch(
          `/api/attendance/session?courseId=${selectedCourseId}&date=${selectedDate}`
        );
        if (res.ok) {
          const data: AttendanceRecord | null = await res.json();
          if (data && data.records && data.records.length > 0) {
            setExistingRecord(data);
            const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
            data.records.forEach((r) => {
              map[r.studentId] = {
                status: r.status,
                notes: r.notes || "",
              };
            });
            setAttendanceMap(map);
            toast.info(`Loaded previously saved attendance for ${data.date}`);
            return;
          }
        }
        // If no existing record, set all to present by default!
        setExistingRecord(null);
        setAttendanceMap((prev) => {
          const newMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
          students.forEach((s) => {
            newMap[s.studentId] = prev[s.studentId] || {
              status: "present",
              notes: "",
            };
          });
          return newMap;
        });
      } catch (err) {
        console.error("Check session error:", err);
      }
    }

    if (students.length > 0) {
      checkExistingSession();
    }
  }, [selectedCourseId, selectedDate, students]);

  // Selected Course Object
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c._id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Prepare full list with current attendance status
  const studentRows: StudentState[] = useMemo(() => {
    return students.map((s) => {
      const state = attendanceMap[s.studentId] || { status: "present", notes: "" };
      return {
        studentId: s.studentId,
        name: s.name,
        rollNumber: s.rollNumber,
        status: state.status,
        notes: state.notes,
      };
    });
  }, [students, attendanceMap]);

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    return studentRows.filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [studentRows, searchQuery, statusFilter]);

  // Real-time Live Statistics
  const stats = useMemo(() => {
    const total = studentRows.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    studentRows.forEach((r) => {
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else if (r.status === "late") late++;
      else if (r.status === "excused") excused++;
    });

    const rate = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;
    return { total, present, absent, late, excused, rate };
  }, [studentRows]);

  // Quick Action: Update single student status
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: "" }),
        status,
      },
    }));
  };

  // Quick Action: Update single student notes
  const updateNotes = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "present" }),
        notes,
      },
    }));
  };

  // Bulk: Mark All Present
  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.studentId] = {
          ...(updated[s.studentId] || { notes: "" }),
          status: "present",
        };
      });
      return updated;
    });
    toast.success("Marked all students as Present");
  };

  // Bulk: Mark All Absent
  const markAllAbsent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.studentId] = {
          ...(updated[s.studentId] || { notes: "" }),
          status: "absent",
        };
      });
      return updated;
    });
    toast.warning("Marked all students as Absent");
  };

  // Save Attendance to Database
  const handleSaveAttendance = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (studentRows.length === 0) {
      toast.error("No students found to mark attendance. Please add or import students first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        courseId: selectedCourseId,
        date: selectedDate,
        records: studentRows.map((r) => ({
          studentId: r.studentId,
          studentName: r.name,
          rollNumber: r.rollNumber,
          status: r.status,
          notes: r.notes,
        })),
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save attendance");
      }

      toast.success("Attendance saved successfully!");
      setExistingRecord(data.record);
      // Auto-open WhatsApp Report Modal
      setSavedRecordForReport(data.record);
      setReportModalOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      {/* Page Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Take Attendance</span>
            {existingRecord && (
              <span className="text-xs font-semibold py-1 px-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                Editing Saved Record
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mark student attendance with 1-click status toggles and instantly generate WhatsApp reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {existingRecord && (
            <button
              onClick={() => {
                setSavedRecordForReport(existingRecord);
                setReportModalOpen(true);
              }}
              className="flex items-center gap-1.5 py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Report</span>
            </button>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={saving || studentRows.length === 0}
            className="flex items-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* Top Header Card: Course Selector, Date Picker, Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Course <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name} ({course.section || "Batch 66"})
                  </option>
                ))}
              </select>
            </div>
            {selectedCourse && (
              <p className="text-[11px] text-slate-400 mt-1">
                Instructor: {selectedCourse.teacherName || "Not assigned"} • {selectedCourse.semester}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Today
              </button>
              <span className="text-slate-300 text-xs">•</span>
              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split("T")[0]);
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Batch & Total Info Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Target Section
              </span>
              <span className="text-sm font-extrabold text-slate-800">
                {selectedCourse?.section || "Batch 66"}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Manarat Int. University</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Enrolled
              </span>
              <span className="text-xl font-black text-blue-600">
                {studentRows.length} Students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Statistics Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Present Count */}
            <div className="flex items-center gap-2 py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">
                Present: <span className="text-sm font-extrabold">{stats.present}</span>
              </span>
            </div>

            {/* Absent Count */}
            <div className="flex items-center gap-2 py-1.5 px-3 bg-rose-50 border border-rose-200 rounded-xl">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-900">
                Absent: <span className="text-sm font-extrabold">{stats.absent}</span>
              </span>
            </div>

            {/* Late Count */}
            <div className="flex items-center gap-2 py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900">
                Late: <span className="text-sm font-extrabold">{stats.late}</span>
              </span>
            </div>

            {/* Excused Count */}
            <div className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 border border-slate-200 rounded-xl">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800">
                Excused: <span className="text-sm font-extrabold">{stats.excused}</span>
              </span>
            </div>
          </div>

          {/* Rate Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Live Attendance Rate:
            </span>
            <span
              className={`text-sm font-black py-1 px-3 rounded-full border ${
                stats.rate >= 75
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {stats.rate}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, ID, or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
        </div>

        {/* Filter Pills & Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: "all", label: "All" },
              { id: "present", label: "Present" },
              { id: "absent", label: "Absent" },
              { id: "late", label: "Late" },
              { id: "excused", label: "Excused" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`py-1 px-2.5 rounded-lg transition-colors ${
                  statusFilter === f.id
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Mark All Buttons */}
          <button
            type="button"
            onClick={markAllPresent}
            className="flex items-center gap-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>
          <button
            type="button"
            onClick={markAllAbsent}
            className="flex items-center gap-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      {/* Student Attendance List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingStudents ? (
          <div className="p-12 text-center text-slate-400">Loading roster...</div>
        ) : filteredRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Roll</th>
                  <th className="py-3.5 px-4 w-28">Student ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4 min-w-[320px] text-center">Attendance Status</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className={`transition-colors ${
                      row.status === "absent"
                        ? "bg-rose-50/30 hover:bg-rose-50/50"
                        : row.status === "late"
                        ? "bg-amber-50/30 hover:bg-amber-50/50"
                        : row.status === "excused"
                        ? "bg-slate-100/40 hover:bg-slate-100/60"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Roll */}
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      <span className="inline-block w-8 h-8 rounded-lg bg-slate-100 text-slate-700 leading-8 text-xs font-extrabold border border-slate-200">
                        {row.rollNumber}
                      </span>
                    </td>

                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {row.studentId}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {row.name}
                    </td>

                    {/* 4 Status Toggle Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5 max-w-sm mx-auto">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => updateStatus(row.studentId, "present")}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                            row.status === "present"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                          }`}
                        >
                          Present
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => updateStatus(row.studentId, "absent")}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                            row.status === "absent"
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          }`}
                        >
                          Absent
                        </button>

                        {/* Late */}
                        <button
                          type="button"
                          onClick={() => updateStatus(row.studentId, "late")}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                            row.status === "late"
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                          }`}
                        >
                          Late
                        </button>

                        {/* Excused */}
                        <button
                          type="button"
                          onClick={() => updateStatus(row.studentId, "excused")}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                            row.status === "excused"
                              ? "bg-slate-600 text-white border-slate-600 shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder={
                          row.status === "late"
                            ? "Reason (e.g. 15 min late)"
                            : row.status === "excused"
                            ? "Leave note (e.g. Medical)"
                            : "Optional remark"
                        }
                        value={row.notes}
                        onChange={(e) => updateNotes(row.studentId, e.target.value)}
                        className="w-full py-1 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 bg-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Students Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No students matching "${searchQuery}"`
                : "You don't have any students in your roster yet. Import or add students to take attendance."}
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Sticky Bar for Quick Save */}
      {studentRows.length > 0 && (
        <div className="sticky bottom-4 mt-6 z-20">
          <div className="bg-slate-900 text-white rounded-2xl shadow-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-slate-300">
                {studentRows.length} Students Total
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-bold text-emerald-400">{stats.present} Present</span>
              <span className="text-slate-600">•</span>
              <span className="font-bold text-rose-400">{stats.absent} Absent</span>
              <span className="text-slate-600">•</span>
              <span className="font-bold text-blue-400">{stats.rate}% Rate</span>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save & Generate WhatsApp Report"}</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Report Modal */}
      <WhatsAppReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        record={savedRecordForReport}
      />
    </AppShell>
  );
}

export default function TakeAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading attendance sheet...</div>}>
      <TakeAttendanceContent />
    </Suspense>
  );
}
