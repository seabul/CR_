"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import AttendanceBadge from "@/components/AttendanceBadge";
import {
  ArrowLeft,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { StudentAttendanceProfile } from "@/types";
import { formatDatePretty } from "@/lib/report-generator";
import { toast } from "sonner";

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<StudentAttendanceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/students/${id}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          toast.error("Student profile not found");
        }
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-400">Loading student attendance profile...</div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <p className="text-slate-500 mb-4">Student profile not found.</p>
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Roster</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { student, totalClasses, presentCount, absentCount, lateCount, excusedCount, attendancePercentage, history } = profile;
  const isShortage = attendancePercentage < 75;

  return (
    <AppShell>
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Roster</span>
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center shrink-0 border border-blue-200">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{student.name}</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  Roll: {student.rollNumber}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">Student ID: {student.studentId}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.email}</span>
                  </span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Exam Eligibility Badge */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 shrink-0 ${
              isShortage
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {isShortage ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider">
                {isShortage ? "Attendance Shortage Alert" : "Exam Eligibility: Eligible"}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isShortage
                  ? "Below 75% university requirement"
                  : "Meets >= 75% university attendance threshold"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Classes</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalClasses}</p>
          <span className="text-[11px] text-slate-400">Recorded sessions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Present</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          <span className="text-[11px] text-slate-400">Attended</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-rose-600">Absent</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
          <span className="text-[11px] text-slate-400">Missed classes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600">Late</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{lateCount}</p>
          <span className="text-[11px] text-slate-400">Delayed arrival</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">Excused</span>
          <p className="text-2xl font-black text-slate-700 mt-1">{excusedCount}</p>
          <span className="text-[11px] text-slate-400">Approved leave</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-600">Percentage</span>
          <p
            className={`text-2xl font-black mt-1 ${
              isShortage ? "text-rose-600" : "text-blue-600"
            }`}
          >
            {attendancePercentage}%
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all ${
                isShortage ? "bg-rose-500" : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Date-wise Attendance Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-base font-bold text-slate-900">Date-wise Attendance History</h2>
          <p className="text-xs text-slate-500">Chronological attendance trail across all enrolled courses</p>
        </div>

        {history && history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Date</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-6">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDatePretty(item.date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.courseName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.courseCode}</td>
                    <td className="py-3 px-4">
                      <AttendanceBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-xs text-slate-500">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            No attendance records found for this student yet.
          </div>
        )}
      </div>
    </AppShell>
  );
}
