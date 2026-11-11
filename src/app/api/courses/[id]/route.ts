import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return errorResponse("Invalid course ID");
  }

  try {
    const body = await req.json();
    const { name, code, teacherName, section, semester } = body;

    const db = await getDatabase();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.trim().toUpperCase();
    if (teacherName !== undefined) updateData.teacherName = teacherName.trim();
    if (section !== undefined) updateData.section = section.trim();
    if (semester !== undefined) updateData.semester = semester.trim();

    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(id), userId: user.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return errorResponse("Course not found or unauthorized", 404);
    }

    return successResponse({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("PUT /api/courses/[id] error:", error);
    return errorResponse("Failed to update course", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return errorResponse("Invalid course ID");
  }

  try {
    const db = await getDatabase();
    const result = await db.collection("courses").deleteOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return errorResponse("Course not found or unauthorized", 404);
    }

    return successResponse({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/courses/[id] error:", error);
    return errorResponse("Failed to delete course", 500);
  }
}
