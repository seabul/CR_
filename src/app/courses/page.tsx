"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import CourseModal from "@/components/CourseModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ClipboardCheck,
  Calendar,
  User,
  GraduationCap,
} from "lucide-react";
import { Course } from "@/types";
import { toast } from "sonner";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const list = await res.json();
        setCourses(list);
      }
    } catch (err) {
      console.error("Courses fetch error:", err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenAdd = () => {
    setSelectedCourse(null);
    setCourseModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setSelectedCourse(course);
    setCourseModalOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      const res = await fetch(`/api/courses/${courseToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Course "${courseToDelete.name}" deleted successfully`);
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setCourseToDelete(null);
    }
  };

  return (
    <AppShell>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your semester courses, instructors, and batch sections
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          type="button"
          className="flex items-center gap-1.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading courses...</div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-extrabold border border-blue-200">
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      title="Edit Course"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setCourseToDelete(course);
                        setDeleteConfirmOpen(true);
                      }}
                      title="Delete Course"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{course.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Instructor: {course.teacherName || "Not assigned"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Section: {course.section || "Batch 66"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Semester: {course.semester || "Current"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/attendance/history?courseId=${course._id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  View History
                </Link>

                <Link
                  href={`/attendance/take?courseId=${course._id}`}
                  className="flex items-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Take Attendance</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Courses Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create courses like Data Structures, DBMS, etc. to organize student attendance.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSaved={fetchCourses}
        course={selectedCourse}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Course?"
        message={`Are you sure you want to delete "${courseToDelete?.name}" (${courseToDelete?.code})?`}
        confirmLabel="Delete Course"
        isDestructive={true}
      />
    </AppShell>
  );
}
