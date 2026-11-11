"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  History,
  Plus,
  Calendar,
  Sparkles,
  GraduationCap,
  ChevronRight,
  Award,
} from "lucide-react";
import { formatDatePretty } from "@/lib/report-generator";
import { AttendanceRecord } from "@/types";
import { useSession } from "@/lib/auth-client";

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  excusedStudents: number;
  todayAttendancePercentage: number;
  isTodayData: boolean;
  lastActiveDate: string | null;
}

interface CourseStat {
  _id: string;
  name: string;
  code: string;
  teacherName?: string;
  section?: string;
  semester?: string;
  totalClasses: number;
  lastRate: number | null;
  lastDate: string | null;
}

interface ProfileInfo {
  name: string;
  institution: string;
  department: string;
  batch: string;
  role: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    presentStudents: 0,
    absentStudents: 0,
    lateStudents: 0,
    excusedStudents: 0,
    todayAttendancePercentage: 0,
    isTodayData: false,
    lastActiveDate: null,
  });
  const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [profile, setProfile] = useState<ProfileInfo>({
    name: "Class Representative",
    institution: "Manarat International University",
    department: "Computer Science & Engineering",
    batch: "66",
    role: "Class Representative",
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, profileRes] = await Promise.all([
          fetch("/api/attendance/dashboard"),
          fetch("/api/profile"),
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData.stats) setStats(dashData.stats);
          if (Array.isArray(dashData.recentHistory)) setRecentHistory(dashData.recentHistory);
          if (Array.isArray(dashData.courses)) setCourses(dashData.courses);
        }

        if (profileRes.ok) {
          const profData = await profileRes.json();
          setProfile({
            name: profData.name || session?.user?.name || "Class Representative",
            institution: profData.institution || "Manarat International University",
            department: profData.department || "Computer Science & Engineering",
            batch: profData.batch || "66",
            role: profData.role || "Class Representative",
          });
        }
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [session]);

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = profile.name || session?.user?.name || "CR";

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-teal-900/40">
          {/* Subtle background glow effect */}
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>CR Attendance Control Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {getGreeting()}, <span className="text-teal-400">{displayName}</span> 👋
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
                {profile.department} • Batch {profile.batch} • {profile.institution}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/attendance/take"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-3 text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Take Attendance</span>
              </Link>

              <Link
                href="/attendance/history"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-4 py-3 text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Total Students */}
          <Link
            href="/students"
            className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Students
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : stats.totalStudents}
              </span>
              <span className="text-xs text-slate-500">enrolled</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              <span>Manage roster</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Enrolled Courses */}
          <Link
            href="/courses"
            className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Courses
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : stats.totalCourses}
              </span>
              <span className="text-xs text-slate-500">active</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              <span>View subjects</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Present Today / Last Session */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stats.isTodayData ? "Present Today" : "Last Session Present"}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : stats.presentStudents}
              </span>
              <span className="text-xs text-rose-500 font-semibold">
                ({loading ? "..." : stats.absentStudents} absent)
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {stats.isTodayData
                  ? "Recorded for today"
                  : stats.lastActiveDate
                  ? `On ${formatDatePretty(stats.lastActiveDate)}`
                  : "No attendance yet"}
              </span>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Attendance Rate
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                {loading ? "..." : `${stats.todayAttendancePercentage}%`}
              </span>
              <span className="text-xs text-slate-500">average</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.todayAttendancePercentage >= 75
                    ? "bg-teal-500"
                    : stats.todayAttendancePercentage >= 50
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stats.todayAttendancePercentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Section: Courses Quick Grid & Recent History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Course Cards (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <span>Enrolled Courses</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  1-Click direct attendance take for your batch
                </p>
              </div>

              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 animate-pulse p-5"
                  />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No courses added yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your courses/subjects to start taking batch attendance quickly.
                </p>
                <Link
                  href="/courses"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Course</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-5 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-xs font-extrabold px-2.5 py-1 border border-teal-200/60 dark:border-teal-800">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {course.totalClasses} {course.totalClasses === 1 ? "class" : "classes"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2.5 line-clamp-1">
                        {course.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Instructor: {course.teacherName || "Not assigned"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        {course.lastRate !== null ? (
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                            {course.lastRate}% attendance
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No classes yet</span>
                        )}
                      </div>

                      <Link
                        href={`/attendance/take?courseId=${course._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 transition shadow-xs"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Take</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Sessions (Span 1) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <span>Recent Sessions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest attendance logs</p>
              </div>

              <Link
                href="/attendance/history"
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline"
              >
                All Logs
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1322] p-4 shadow-xs">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : recentHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No attendance recorded yet</p>
                  <Link
                    href="/attendance/take"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <span>Take attendance now</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentHistory.slice(0, 5).map((record) => (
                    <div
                      key={record._id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 rounded-lg px-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {record.courseCode || "Course"}
                          </span>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {formatDatePretty(record.date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {record.courseName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            record.summary?.rate >= 75
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : record.summary?.rate >= 50
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {record.summary?.rate}%
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {record.summary?.present || 0}/{record.summary?.total || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick CR Shortcuts Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 p-5 border-dashed">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Award className="h-4 w-4" />
                <span>CR Quick Shortcuts</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Save hours managing Batch 66 attendance with automated WhatsApp reports.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/students"
                  className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    <span>Upload CSV Student Roster</span>
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/attendance/history"
                  className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-teal-600" />
                    <span>Generate WhatsApp Daily Summary</span>
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
