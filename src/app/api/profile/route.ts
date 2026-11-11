import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const db = await getDatabase();
    // In Better Auth, users collection is usually "user"
    const userDoc = await db.collection("user").findOne({
      $or: [
        { id: user.id },
        ...(user.email ? [{ email: user.email }] : []),
        ...(ObjectId.isValid(user.id) ? [{ _id: new ObjectId(user.id) }] : []),
      ],
    });

    let userImage = userDoc?.image || (user as { image?: string })?.image || "";

    if (!userImage) {
      const uId = userDoc?._id || (ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id);
      const googleAcc = await db.collection("account").findOne({
        userId: String(uId),
        providerId: "google",
      });
      if (googleAcc?.idToken) {
        try {
          const parts = googleAcc.idToken.split(".");
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          if (payload.picture) {
            userImage = payload.picture;
            const userFilter = userDoc?._id ? { _id: userDoc._id } : { id: user.id };
            await db.collection("user").updateOne(
              userFilter,
              { $set: { image: userImage } }
            );
          }
        } catch {}
      }
    }

    return successResponse({
      id: user.id,
      name: userDoc?.name || user.name || "Class Representative",
      email: userDoc?.email || user.email || "",
      image: userImage,
      institution: userDoc?.institution || "Manarat International University",
      department: userDoc?.department || "Computer Science & Engineering",
      batch: userDoc?.batch || "66",
      phone: userDoc?.phone || "",
      role: userDoc?.role || "Class Representative",
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return errorResponse("Failed to fetch profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await req.json();
    const { name, institution, department, batch, phone, image } = body;

    const db = await getDatabase();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (name) updateData.name = name.trim();
    if (institution) updateData.institution = institution.trim();
    if (department) updateData.department = department.trim();
    if (batch) updateData.batch = batch.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (image !== undefined) updateData.image = image;

    await db.collection("user").updateOne(
      {
        $or: [
          { id: user.id },
          ...(user.email ? [{ email: user.email }] : []),
          ...(ObjectId.isValid(user.id) ? [{ _id: new ObjectId(user.id) }] : []),
        ],
      },
      { $set: updateData }
    );

    return successResponse({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return errorResponse("Failed to update profile", 500);
  }
}
