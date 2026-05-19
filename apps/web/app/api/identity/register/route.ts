import type { NextRequest } from "next/server";
import {
  apiError,
  createPrototypeSession,
  identityResponse,
  validateEmail,
  validatePassword
} from "../../../../src/server/identity-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "validation_error", "Request body must be valid JSON.");
  }

  const payload = body as {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
  };
  const email = validateEmail(payload.email);
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";

  if (!email || !validatePassword(payload.password) || !displayName) {
    return apiError(
      400,
      "validation_error",
      "Email hợp lệ, tên hiển thị và mật khẩu tối thiểu 8 ký tự là bắt buộc."
    );
  }

  return identityResponse(createPrototypeSession({ email, displayName }));
}
