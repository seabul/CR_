import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";

interface CsvRow {
  studentId: string;
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const { students } = body as { students: CsvRow[] };

    if (!Array.isArray(students) || students.length === 0) {
      return errorResponse("No student records provided for import.");
    }

    const db = await getDatabase();
    const existing = await db
      .collection("students")
      .find({ userId: user.id }, { projection: { studentId: 1, rollNumber: 1 } })
      .toArray();

    const existingIds = new Set(existing.map((s) => s.studentId.toLowerCase()));
    const existingRolls = new Set(existing.map((s) => s.rollNumber.toLowerCase()));

    const toInsert = [];
    const errors = [];
    const batchSeenIds = new Set<string>();
    const batchSeenRolls = new Set<string>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;
      const sId = (s.studentId || "").toString().trim();
      const sName = (s.name || "").toString().trim();
      const sRoll = (s.rollNumber || "").toString().trim();

      if (!sId || !sName || !sRoll) {
        errors.push(`Row ${rowNum}: Student ID, Name, and Roll Number are required.`);
        continue;
      }

      const lowerId = sId.toLowerCase();
      const lowerRoll = sRoll.toLowerCase();

      if (existingIds.has(lowerId) || batchSeenIds.has(lowerId)) {
        errors.push(`Row ${rowNum}: Duplicate Student ID "${sId}".`);
        continue;
      }

      if (existingRolls.has(lowerRoll) || batchSeenRolls.has(lowerRoll)) {
        errors.push(`Row ${rowNum}: Duplicate Roll Number "${sRoll}".`);
        continue;
      }

      batchSeenIds.add(lowerId);
      batchSeenRolls.add(lowerRoll);

      toInsert.push({
        userId: user.id,
        studentId: sId,
        name: sName,
        rollNumber: sRoll,
        email: (s.email || "").toString().trim(),
        phone: (s.phone || "").toString().trim(),
        courseIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (toInsert.length > 0) {
      await db.collection("students").insertMany(toInsert);
    }

    return successResponse({
      insertedCount: toInsert.length,
      skippedCount: errors.length,
      errors: errors.slice(0, 10), // return first 10 errors for preview
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error("POST /api/students/bulk error:", error);
    return errorResponse("Failed to import students", 500);
  }
}
