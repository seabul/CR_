import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return errorResponse("Invalid attendance ID");
  }

  try {
    const db = await getDatabase();
    const result = await db.collection("attendance").deleteOne({
      _id: new ObjectId(id),
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return errorResponse("Attendance record not found or unauthorized", 404);
    }

    return successResponse({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return errorResponse("Failed to delete attendance record", 500);
  }
}
