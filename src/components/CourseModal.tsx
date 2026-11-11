"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Save, AlertCircle } from "lucide-react";
import { Course } from "@/types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  course?: Course | null;
}

export default function CourseModal({ isOpen, onClose, onSaved, course }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    teacherName: "",
    section: "",
    semester: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || "",
        code: course.code || "",
        teacherName: course.teacherName || "",
        section: course.section || "",
        semester: course.semester || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        teacherName: "",
        section: "Batch 66",
        semester: "Fall 2026",
      });
    }
    setError("");
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Course Name and Course Code are required.");
      return;
    }

    setLoading(true);
    try {
      const url = course ? `/api/courses/${course._id}` : "/api/courses";
      const method = course ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      toast.success(course ? "Course updated successfully!" : "Course created successfully!");
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {course ? "Edit Course" : "Add New Course"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Course Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Data Structures"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CSE 123"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Section / Batch
              </label>
              <input
                type="text"
                placeholder="e.g. Batch 66"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Teacher / Instructor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Prof. Md. Saiful Islam"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Semester
            </label>
            <input
              type="text"
              placeholder="e.g. Fall 2026"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : course ? "Update Course" : "Save Course"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
