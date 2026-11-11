"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import WhatsAppReportModal from "@/components/WhatsAppReportModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Calendar,
  BookOpen,
  Search,
  Send,
  Edit3,
  Trash2,
} from "lucide-react";
import { AttendanceRecord, Course } from "@/types";
import { formatDatePretty } from "@/lib/report-generator";
import { toast } from "sonner";

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Fetch courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const list = await res.json();
          setCourses(list);
        }
      } catch (err) {
        console.error("Courses load error:", err);
      }
    }
    loadCourses();
  }, []);

  // Fetch attendance records
  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.append("courseId", selectedCourseId);
      if (selectedDate) params.append("date", selectedDate);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const list = await res.json();
        setRecords(list);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedDate, searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await fetch(`/api/attendance/${recordToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Attendance record deleted successfully");
        fetchRecords();
      } else {
        toast.error("Failed to delete record");
      }
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setRecordToDelete(null);
    }
  };

  const openReport = (rec: AttendanceRecord) => {
    setActiveRecord(rec);
    setReportModalOpen(true);
  };

  const confirmDelete = (rec: AttendanceRecord) => {
    setRecordToDelete(rec);
    setDeleteConfirmOpen(true);
  };

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Attendance History & Archives
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review past classroom sessions, generate WhatsApp reports, and manage records
          </p>
        </div>

        <Link
          href="/attendance/take"
          className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <span>Take Attendance</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course, code, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          {/* Filter by Course */}
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Date */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading history records...</div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Session Date</th>
                  <th className="py-3.5 px-4">Course Details</th>
                  <th className="py-3.5 px-4 text-center">Batch</th>
                  <th className="py-3.5 px-4 text-center">Total</th>
                  <th className="py-3.5 px-4 text-center">Present</th>
                  <th className="py-3.5 px-4 text-center">Absent</th>
                  <th className="py-3.5 px-4 text-center">Rate</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDatePretty(rec.date)}
                    </td>

                    {/* Course */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.courseName}</div>
                      <span className="text-xs font-mono font-semibold text-blue-600">
                        {rec.courseCode}
                      </span>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4 text-center text-xs font-medium text-slate-600">
                      {rec.section || "Batch 66"}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {rec.summary?.total || rec.records?.length || 0}
                    </td>

                    {/* Present */}
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-600">
                      {rec.summary?.present || 0}
                    </td>

                    {/* Absent */}
                    <td className="py-3 px-4 text-center font-extrabold text-rose-600">
                      {rec.summary?.absent || 0}
                    </td>

                    {/* Rate */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (rec.summary?.rate || 0) >= 75
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {rec.summary?.rate || 0}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReport(rec)}
                          title="Generate WhatsApp Report"
                          className="flex items-center gap-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-200"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>

                        <Link
                          href={`/attendance/take?courseId=${rec.courseId}&date=${rec.date}`}
                          title="Edit Saved Attendance"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center justify-center"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => confirmDelete(rec)}
                          title="Delete Attendance Record"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors inline-flex items-center justify-center border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No attendance records matching your filter criteria.
          </div>
        )}
      </div>

      {/* WhatsApp Report Modal */}
      <WhatsAppReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        record={activeRecord}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Attendance Session?"
        message={`Are you sure you want to delete the attendance record for ${
          recordToDelete?.courseName || "this course"
        } on ${formatDatePretty(recordToDelete?.date || "")}? This action cannot be undone.`}
        confirmLabel="Delete Record"
        isDestructive={true}
      />
    </AppShell>
  );
}
