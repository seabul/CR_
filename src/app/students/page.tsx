"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import StudentModal from "@/components/StudentModal";
import CsvImportModal from "@/components/CsvImportModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  CheckSquare,
  Square,
} from "lucide-react";
import { Student } from "@/types";
import { toast } from "sonner";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rollNumber" | "name">("rollNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state for multi-select delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // Single delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Bulk delete selected modal
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] = useState(false);

  // 1-Click Delete ALL student data modal
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const list = await res.json();
        setStudents(list);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setStudentModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setStudentModalOpen(true);
  };

  // 1. Delete Single Student
  const handleDeleteSingle = async () => {
    if (!studentToDelete) return;
    try {
      const res = await fetch(`/api/students/${studentToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Student ${studentToDelete.name} deleted successfully`);
        fetchStudents();
      } else {
        toast.error("Failed to delete student");
      }
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setStudentToDelete(null);
    }
  };

  // 2. Delete Selected Students in 1 Click
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deleted ${data.deletedCount} students!`);
        fetchStudents();
      } else {
        toast.error(data.error || "Failed to delete selected students");
      }
    } catch {
      toast.error("Error deleting selected students");
    } finally {
      setSelectedIds(new Set());
    }
  };

  // 3. Delete ALL Student Data in 1 Click
  const handleDeleteAll = async () => {
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`All student data deleted! (${data.deletedCount} students removed)`);
        fetchStudents();
      } else {
        toast.error(data.error || "Failed to delete student data");
      }
    } catch {
      toast.error("Error deleting all student data");
    } finally {
      setSelectedIds(new Set());
    }
  };

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const headers = "RollNumber,StudentID,FullName,Email,Phone,Batch\n";
    const rows = students
      .map(
        (s) =>
          `"${s.rollNumber}","${s.studentId}","${s.name.replace(/"/g, '""')}","${s.email || ""}","${s.phone || ""}","Batch 66"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Batch_Students_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exported student roster to CSV");
  };

  const isAllSelected = students.length > 0 && selectedIds.size === students.length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Card matching user design */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2.5 border border-emerald-100">
              <Users className="w-3.5 h-3.5" />
              <span>Class Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {students.length} total students enrolled in this batch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1-Click Delete All Student Data Button */}
            {students.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteAllConfirmOpen(true)}
                className="flex items-center gap-1.5 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl shadow-2xs transition-all active:scale-95"
                title="Delete all student data in 1 click"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete All Data ({students.length})</span>
              </button>
            )}

            {/* Import CSV */}
            <button
              onClick={() => setCsvModalOpen(true)}
              type="button"
              className="flex items-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import CSV</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              type="button"
              className="flex items-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export CSV</span>
            </button>

            {/* + Add Student Button */}
            <button
              onClick={handleOpenAdd}
              type="button"
              className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-sm shadow-emerald-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Floating Bulk Action Bar when items are selected */}
        {selectedIds.size > 0 && (
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold">
                {selectedIds.size} of {students.length} students selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={() => setDeleteSelectedConfirmOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size}) in 1 Click</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Sort Bar matching user screenshot */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
            />
          </div>

          {/* Sort Buttons matching design pills */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Roll */}
            <button
              onClick={() => {
                if (sortBy === "rollNumber") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("rollNumber");
                  setSortOrder("asc");
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                sortBy === "rollNumber"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort Roll ({sortOrder.toUpperCase()})</span>
            </button>

            {/* Sort Name */}
            <button
              onClick={() => {
                if (sortBy === "name") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("name");
                  setSortOrder("asc");
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                sortBy === "name"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>Name ({sortOrder === "asc" ? "A-Z" : "Z-A"})</span>
            </button>
          </div>
        </div>

        {/* Student List Table matching user screenshot */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400">Loading student roster...</div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-100">
                  <tr>
                    {/* Multi-select Checkbox */}
                    <th className="py-4 px-4 w-12 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        title={isAllSelected ? "Deselect all" : "Select all"}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4 w-20">ROLL</th>
                    <th className="py-4 px-4">STUDENT NAME & ID</th>
                    <th className="py-4 px-4">CONTACT</th>
                    <th className="py-4 px-4">BATCH</th>
                    <th className="py-4 px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const isChecked = selectedIds.has(student._id);
                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors ${
                          isChecked ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(student._id)}
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* ROLL badge */}
                        <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                          <span className="inline-block py-1 px-2.5 rounded-lg bg-slate-100/80 text-slate-700 font-bold text-xs">
                            #{student.rollNumber}
                          </span>
                        </td>

                        {/* STUDENT NAME & ID with avatar */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/students/${student._id}`}
                                className="group inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-blue-600 transition-colors"
                              >
                                <span>{student.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                              </Link>
                              <p className="text-xs font-mono text-slate-400 mt-0.5">
                                ID: {student.studentId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="py-4 px-4 text-xs text-slate-500">
                          <div className="space-y-1">
                            {student.email ? (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{student.email}</span>
                              </div>
                            ) : null}
                            {student.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{student.phone}</span>
                              </div>
                            ) : null}
                            {!student.email && !student.phone && (
                              <span className="text-slate-300 italic">No contact info</span>
                            )}
                          </div>
                        </td>

                        {/* BATCH pill */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
                            Batch 66
                          </span>
                        </td>

                        {/* ACTIONS: Edit & Delete */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(student)}
                              title="Edit Student"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setStudentToDelete(student);
                                setDeleteConfirmOpen(true);
                              }}
                              title="Delete Student"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Students in Roster</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No students matching "${searchQuery}"`
                  : "Your roster is empty. Add new students or import via CSV to start tracking attendance."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={handleOpenAdd}
                  className="py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Add Student
                </button>
                <button
                  onClick={() => setCsvModalOpen(true)}
                  className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Import CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSaved={fetchStudents}
        student={selectedStudent}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImportSuccess={fetchStudents}
      />

      {/* 1. Single Student Delete Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteSingle}
        title="Delete Student?"
        message={`Are you sure you want to delete ${studentToDelete?.name} (Roll: ${studentToDelete?.rollNumber})?`}
        confirmLabel="Delete Student"
        isDestructive={true}
      />

      {/* 2. Bulk Delete Selected Students Modal */}
      <ConfirmDialog
        isOpen={deleteSelectedConfirmOpen}
        onClose={() => setDeleteSelectedConfirmOpen(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Selected Students in 1 Click?"
        message={`Are you sure you want to delete the ${selectedIds.size} selected students? This action cannot be undone.`}
        confirmLabel={`Yes, Delete ${selectedIds.size} Students`}
        isDestructive={true}
      />

      {/* 3. 1-Click Delete ALL Student Data Modal */}
      <ConfirmDialog
        isOpen={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete ALL Student Data in 1 Click?"
        message={`Warning: This will permanently delete ALL ${students.length} students from this batch. Are you sure you want to proceed?`}
        confirmLabel="Yes, Delete All Data"
        isDestructive={true}
      />
    </AppShell>
  );
}
