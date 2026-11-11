import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const db = await getDatabase();

    // 1. Total students count
    const totalStudents = await db.collection("students").countDocuments({ userId: user.id });

    // 2. Total courses count
    const totalCourses = await db.collection("courses").countDocuments({ userId: user.id });

    // 3. Today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // Find attendance sessions for today
    const todaySessions = await db
      .collection("attendance")
      .find({ userId: user.id, date: today })
      .toArray();

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayLate = 0;
    let todayExcused = 0;
    let todayTotal = 0;

    todaySessions.forEach((s) => {
      todayPresent += s.summary?.present || 0;
      todayAbsent += s.summary?.absent || 0;
      todayLate += s.summary?.late || 0;
      todayExcused += s.summary?.excused || 0;
      todayTotal += s.summary?.total || 0;
    });

    // If no attendance today, let's also fetch latest session stats as fallback indicator
    const latestSession = await db
      .collection("attendance")
      .find({ userId: user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(1)
      .toArray();

    const latest = latestSession[0];

    const todayRate =
      todayTotal > 0
        ? Math.round((todayPresent / todayTotal) * 100 * 10) / 10
        : latest
        ? latest.summary?.rate || 0
        : 0;

    // 4. Recent sessions
    const recentSessions = await db
      .collection("attendance")
      .find({ userId: user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    // 5. Courses list with stats
    const courses = await db.collection("courses").find({ userId: user.id }).toArray();
    const courseStats = await Promise.all(
      courses.map(async (c) => {
        const sessionCount = await db
          .collection("attendance")
          .countDocuments({ userId: user.id, courseId: c._id.toString() });

        const latestCourseSession = await db
          .collection("attendance")
          .find({ userId: user.id, courseId: c._id.toString() })
          .sort({ date: -1 })
          .limit(1)
          .toArray();

        return {
          _id: c._id.toString(),
          name: c.name,
          code: c.code,
          teacherName: c.teacherName,
          section: c.section,
          semester: c.semester,
          totalClasses: sessionCount,
          lastRate: latestCourseSession[0]?.summary?.rate ?? null,
          lastDate: latestCourseSession[0]?.date ?? null,
        };
      })
    );

    return successResponse({
      stats: {
        totalStudents,
        totalCourses,
        presentStudents: todayTotal > 0 ? todayPresent : latest?.summary?.present || 0,
        absentStudents: todayTotal > 0 ? todayAbsent : latest?.summary?.absent || 0,
        lateStudents: todayTotal > 0 ? todayLate : latest?.summary?.late || 0,
        excusedStudents: todayTotal > 0 ? todayExcused : latest?.summary?.excused || 0,
        todayAttendancePercentage: todayRate,
        isTodayData: todayTotal > 0,
        lastActiveDate: todayTotal > 0 ? today : latest?.date || null,
      },
      recentHistory: recentSessions.map((r) => ({
        ...r,
        _id: r._id.toString(),
      })),
      courses: courseStats,
    });
  } catch (error) {
    console.error("GET /api/attendance/dashboard error:", error);
    return errorResponse("Failed to fetch dashboard metrics", 500);
  }
}
