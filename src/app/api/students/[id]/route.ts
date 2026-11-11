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
    return errorResponse("Invalid student ID");
  }

  try {
    const body = await req.json();
    const { studentId, name, rollNumber, email, phone, courseIds } = body;

    const db = await getDatabase();

    // Check if updating studentId or rollNumber conflicts with another student
    if (studentId || rollNumber) {
      const conflictQuery: Record<string, unknown> = {
        userId: user.id,
        _id: { $ne: new ObjectId(id) },
        $or: [],
      };

      const orConditions = [];
      if (studentId) orConditions.push({ studentId: studentId.trim() });
      if (rollNumber) orConditions.push({ rollNumber: rollNumber.trim() });
      conflictQuery.$or = orConditions;

      const conflict = await db.collection("students").findOne(conflictQuery);
      if (conflict) {
        if (conflict.studentId === studentId?.trim()) {
          return errorResponse(`Another student with ID "${studentId.trim()}" already exists.`);
        }
        if (conflict.rollNumber === rollNumber?.trim()) {
          return errorResponse(`Another student with Roll Number "${rollNumber.trim()}" already exists.`);
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (studentId) updateData.studentId = studentId.trim();
    if (name) updateData.name = name.trim();
    if (rollNumber) updateData.rollNumber = rollNumber.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (courseIds !== undefined) updateData.courseIds = courseIds;

    const result = await db.collection("students").updateOne(
      { _id: new ObjectId(id), userId: user.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return errorResponse("Student not found or unauthorized", 404);
    }

    return successResponse({ success: true, message: "Student updated successfully" });
  } catch (error) {
    console.error("PUT /api/students/[id] error:", error);
    return errorResponse("Failed to update student", 500);
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
    return errorResponse("Invalid student ID");
  }

  try {
    const db = await getDatabase();
    const result = await db.collection("students").deleteOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return errorResponse("Student not found or unauthorized", 404);
    }

    return successResponse({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return errorResponse("Failed to delete student", 500);
  }
}
