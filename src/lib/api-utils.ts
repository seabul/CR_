import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
