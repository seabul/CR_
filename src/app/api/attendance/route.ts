import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";
import { AttendanceStudentEntry, AttendanceSummary } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const date = searchParams.get("date");
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = { userId: user.id };
    if (courseId) query.courseId = courseId;
    if (date) query.date = date;

    const db = await getDatabase();
    const records = await db
      .collection("attendance")
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    // Fetch course details to enrich records
    const courses = await db.collection("courses").find({ userId: user.id }).toArray();
    const courseMap = new Map();
    courses.forEach((c) => {
      courseMap.set(c._id.toString(), c);
    });

    let formatted = records.map((r) => {
      const course = courseMap.get(r.courseId);
      return {
        ...r,
        _id: r._id.toString(),
        date: (r.date || "") as string,
        courseName: (r.courseName || course?.name || "Unknown Course") as string,
        courseCode: (r.courseCode || course?.code || "N/A") as string,
        section: (r.section || course?.section || "Batch 66") as string,
      };
    });

    if (search) {
      const lower = search.toLowerCase();
      formatted = formatted.filter(
        (r) =>
          r.courseName.toLowerCase().includes(lower) ||
          r.courseCode.toLowerCase().includes(lower) ||
          r.date.includes(lower) ||
          r.section?.toLowerCase().includes(lower)
      );
    }

    return successResponse(formatted);
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return errorResponse("Failed to fetch attendance records", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const { courseId, date, records } = body as {
      courseId: string;
      date: string;
      records: AttendanceStudentEntry[];
    };

    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return errorResponse("Course ID, Date, and at least one student record are required");
    }

    const db = await getDatabase();

    // Find course details
    let course = null;
    if (ObjectId.isValid(courseId)) {
      course = await db.collection("courses").findOne({ _id: new ObjectId(courseId), userId: user.id });
    }

    // Compute summary
    const total = records.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    records.forEach((r) => {
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else if (r.status === "late") late++;
      else if (r.status === "excused") excused++;
    });

    const rate = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

    const summary: AttendanceSummary = {
      total,
      present,
      absent,
      late,
      excused,
      rate,
    };

    const attendanceDoc = {
      userId: user.id,
      courseId,
      courseName: course?.name || "Data Structures",
      courseCode: course?.code || "CSE 123",
      section: course?.section || "Batch 66",
      date,
      records,
      summary,
      updatedAt: new Date(),
    };

    // Upsert to prevent duplicate attendance records for the same course and date
    const result = await db.collection("attendance").findOneAndUpdate(
      { userId: user.id, courseId, date },
      {
        $set: attendanceDoc,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: "after" }
    );

    const savedDoc = result ? { ...result, _id: result._id.toString() } : attendanceDoc;

    return successResponse(
      {
        message: "Attendance saved successfully",
        record: savedDoc,
      },
      200
    );
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return errorResponse("Failed to save attendance", 500);
  }
}
