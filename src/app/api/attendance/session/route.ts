import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const date = searchParams.get("date");

    if (!courseId || !date) {
      return errorResponse("Both courseId and date are required");
    }

    const db = await getDatabase();
    const existing = await db.collection("attendance").findOne({
      userId: user.id,
      courseId,
      date,
    });

    if (!existing) {
      return successResponse(null);
    }

    return successResponse({
      ...existing,
      _id: existing._id.toString(),
    });
  } catch (error) {
    console.error("GET /api/attendance/session error:", error);
    return errorResponse("Failed to fetch attendance session", 500);
  }
}
