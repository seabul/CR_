import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";
import { AttendanceStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return errorResponse("Invalid student ID");
  }

  try {
    const db = await getDatabase();
    const student = await db.collection("students").findOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }

    // Fetch all courses for name lookup
    const courses = await db.collection("courses").find({ userId: user.id }).toArray();
    const courseMap = new Map<string, { name: string; code: string }>();
    courses.forEach((c) => {
      courseMap.set(c._id.toString(), { name: c.name, code: c.code });
    });

    // Find all attendance records where this student is present in `records`
    const attendanceRecords = await db
      .collection("attendance")
      .find({
        userId: user.id,
        "records.studentId": student.studentId,
      })
      .sort({ date: -1 })
      .toArray();

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    const history: Array<{
      date: string;
      courseId: string;
      courseName: string;
      courseCode: string;
      status: AttendanceStatus;
      notes?: string;
    }> = [];

    for (const att of attendanceRecords) {
      const studentEntry = att.records.find((r: { studentId: string }) => r.studentId === student.studentId);
      if (studentEntry) {
        const status = studentEntry.status as AttendanceStatus;
        if (status === "present") presentCount++;
        else if (status === "absent") absentCount++;
        else if (status === "late") lateCount++;
        else if (status === "excused") excusedCount++;

        const courseInfo = courseMap.get(att.courseId) || {
          name: att.courseName || "Unknown Course",
          code: att.courseCode || "N/A",
        };

        history.push({
          date: att.date,
          courseId: att.courseId,
          courseName: courseInfo.name,
          courseCode: courseInfo.code,
          status,
          notes: studentEntry.notes,
        });
      }
    }

    const totalClasses = attendanceRecords.length;
    // Calculate attendance percentage: (Present + Late * 0.5 or standard present count)
    // Standard university formula: (Present / Total) * 100 or present count
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100 * 10) / 10 : 100;

    return successResponse({
      student: {
        ...student,
        _id: student._id.toString(),
      },
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage,
      history,
    });
  } catch (error) {
    console.error("GET /api/students/[id]/profile error:", error);
    return errorResponse("Failed to fetch student attendance profile", 500);
  }
}
