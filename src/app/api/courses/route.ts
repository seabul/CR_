import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const db = await getDatabase();
    const courses = await db
      .collection("courses")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(
      courses.map((c) => ({
        ...c,
        _id: c._id.toString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/courses error:", error);
    return errorResponse("Failed to fetch courses", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const { name, code, teacherName, section, semester } = body;

    if (!name || !code) {
      return errorResponse("Course Name and Course Code are required");
    }

    const db = await getDatabase();
    const newCourse = {
      userId: user.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      teacherName: (teacherName || "").trim(),
      section: (section || "").trim(),
      semester: (semester || "").trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("courses").insertOne(newCourse);
    return successResponse(
      {
        ...newCourse,
        _id: result.insertedId.toString(),
      },
      201
    );
  } catch (error) {
    console.error("POST /api/courses error:", error);
    return errorResponse("Failed to create course", 500);
  }
}
