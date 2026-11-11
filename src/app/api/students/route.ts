import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "rollNumber"; // rollNumber, name, studentId
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const courseId = searchParams.get("courseId");

    const andConditions: Record<string, unknown>[] = [{ userId: user.id }];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { studentId: { $regex: search, $options: "i" } },
          { rollNumber: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (courseId) {
      andConditions.push({
        $or: [
          { courseIds: { $exists: false } },
          { courseIds: { $size: 0 } },
          { courseIds: courseId },
        ],
      });
    }

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    const db = await getDatabase();
    
    // Sort logic
    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === "rollNumber") {
      sortOptions.rollNumber = sortOrder;
    } else if (sortBy === "name") {
      sortOptions.name = sortOrder;
    } else if (sortBy === "studentId") {
      sortOptions.studentId = sortOrder;
    } else {
      sortOptions.rollNumber = 1;
    }

    const students = await db
      .collection("students")
      .find(query)
      .collation({ locale: "en", numericOrdering: true })
      .sort(sortOptions)
      .toArray();

    return successResponse(
      students.map((s) => ({
        ...s,
        _id: s._id.toString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/students error:", error);
    return errorResponse("Failed to fetch students", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const { studentId, name, rollNumber, email, phone, courseIds } = body;

    if (!studentId?.trim() || !name?.trim() || !rollNumber?.trim()) {
      return errorResponse("Student ID, Full Name, and Roll Number are required");
    }

    const trimmedId = studentId.trim();
    const trimmedRoll = rollNumber.trim();
    const trimmedName = name.trim();

    const db = await getDatabase();

    // Check for duplicate Student ID
    const existingId = await db.collection("students").findOne({
      userId: user.id,
      studentId: trimmedId,
    });
    if (existingId) {
      return errorResponse(`A student with ID "${trimmedId}" already exists.`);
    }

    // Check for duplicate Roll Number
    const existingRoll = await db.collection("students").findOne({
      userId: user.id,
      rollNumber: trimmedRoll,
    });
    if (existingRoll) {
      return errorResponse(`A student with Roll Number "${trimmedRoll}" already exists.`);
    }

    const newStudent = {
      userId: user.id,
      studentId: trimmedId,
      name: trimmedName,
      rollNumber: trimmedRoll,
      email: (email || "").trim(),
      phone: (phone || "").trim(),
      courseIds: Array.isArray(courseIds) ? courseIds : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("students").insertOne(newStudent);
    return successResponse(
      {
        ...newStudent,
        _id: result.insertedId.toString(),
      },
      201
    );
  } catch (error) {
    console.error("POST /api/students error:", error);
    return errorResponse("Failed to add student", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json().catch(() => ({}));
    const { all, ids } = body as { all?: boolean; ids?: string[] };

    const db = await getDatabase();

    if (all === true) {
      const result = await db.collection("students").deleteMany({ userId: user.id });
      return successResponse({
        success: true,
        message: `Successfully deleted all ${result.deletedCount} students.`,
        deletedCount: result.deletedCount,
      });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const objectIds = ids
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      const result = await db.collection("students").deleteMany({
        userId: user.id,
        _id: { $in: objectIds },
      });

      return successResponse({
        success: true,
        message: `Successfully deleted ${result.deletedCount} selected students.`,
        deletedCount: result.deletedCount,
      });
    }

    return errorResponse("Please provide ids array or specify all: true for deletion.");
  } catch (error) {
    console.error("DELETE /api/students error:", error);
    return errorResponse("Failed to delete students", 500);
  }
}
