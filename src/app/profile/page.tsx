"use client";

import React, { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  ShieldCheck,
  Save,
  Calendar,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  Camera,
  Trash2,
  Upload,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";

interface ProfileData {
  name: string;
  email: string;
  image: string;
  institution: string;
  department: string;
  batch: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    email: "",
    image: "",
    institution: "Manarat International University",
    department: "Computer Science & Engineering",
    batch: "66",
    phone: "",
    role: "Class Representative",
  });

  const [stats, setStats] = useState({
    studentsCount: 0,
    coursesCount: 0,
    attendanceCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, dashRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/attendance/dashboard"),
        ]);

        if (profileRes.ok) {
          const p = await profileRes.json();
          setFormData({
            name: p.name || session?.user?.name || "",
            email: p.email || session?.user?.email || "",
            image: p.image || session?.user?.image || "",
            institution: p.institution || "Manarat International University",
            department: p.department || "Computer Science & Engineering",
            batch: p.batch || "66",
            phone: p.phone || "",
            role: p.role || "Class Representative",
          });
        }

        if (dashRes.ok) {
          const d = await dashRes.json();
          setStats({
            studentsCount: d.stats?.totalStudents || 0,
            coursesCount: d.stats?.totalCourses || 0,
            attendanceCount: d.recentHistory?.length || 0,
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

        setFormData((prev) => ({ ...prev, image: dataUrl }));
        toast.success("Photo selected! Click 'Save Profile Details' to save permanently.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    toast.success("Profile photo removed. Remember to save changes.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Profile information updated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update profile");
      }
    } catch {
      toast.error("Network error while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Error signing out");
    }
  };

  const initial = formData.name ? formData.name.charAt(0).toUpperCase() : "C";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-up">
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Profile Hero Header Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Profile Photo Avatar with Hover Camera Button */}
              <div className="relative group shrink-0">
                <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 text-white font-black text-2xl sm:text-3xl shadow-md shadow-teal-600/20 overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt={formData.name || "Profile Photo"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}

                  {/* Dark overlay on hover with Camera */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change Profile Photo"
                    className="absolute inset-0 bg-black/55 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-1">Change</span>
                  </button>
                </div>

                {/* Mobile / Always visible Camera Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Profile Photo"
                  className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white ring-2 ring-white dark:ring-[#0c1322] flex items-center justify-center shadow-sm cursor-pointer transition active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* User Identity Details */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {loading ? "Loading..." : formData.name || "Class Representative"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/50">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {formData.role}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {formData.institution} • {formData.department} (Batch {formData.batch})
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {formData.email}
                </p>

                {/* Quick Photo Upload & Remove Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Upload className="h-3.5 w-3.5 text-teal-600" />
                    <span>Upload Photo</span>
                  </button>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Class Roster Active</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Batch 66 Portal
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* CR Statistics Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 sm:p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Enrolled</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.studentsCount} Students
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 sm:p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Active Courses</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.coursesCount} Courses
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 sm:p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Recorded Sessions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.attendanceCount} Sessions
              </p>
            </div>
          </div>
        </div>

        {/* Profile Edit Form Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-6 sm:p-8 shadow-xs">
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Class Representative Profile Information
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Update your personal and university credentials used in WhatsApp attendance reports
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-semibold">
              <Award className="h-4 w-4" />
              <span>Verified CR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CR Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Md. Seabul Islam"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                  />
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Account authentication email (linked to your sign-in).
                </span>
              </div>

              {/* University / Institution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  University / Institution Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="Manarat International University"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                  />
                  <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Computer Science & Engineering"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                  />
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Batch / Section
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="Batch 66"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                  />
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Contact / WhatsApp Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp Contact Phone (For Reports)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none transition"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition active:scale-95 shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile Details"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
