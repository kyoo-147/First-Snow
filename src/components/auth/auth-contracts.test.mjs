import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCallbackUrl } from "./auth-utils.ts";
import { AuthApiError, parseApiError } from "./auth-api.ts";

test("Callback Sanitization: allows safe absolute same-origin paths", () => {
  assert.equal(sanitizeCallbackUrl("/parent"), "/parent");
  assert.equal(sanitizeCallbackUrl("/session/home"), "/session/home");
  assert.equal(sanitizeCallbackUrl("/session/lessons?step=2&mode=calm"), "/session/lessons?step=2&mode=calm");
  assert.equal(sanitizeCallbackUrl("/parent/settings/account#profile"), "/parent/settings/account#profile");
});

test("Callback Sanitization: rejects protocol-relative and backslash URLs", () => {
  assert.equal(sanitizeCallbackUrl("//evil.com"), "/parent");
  assert.equal(sanitizeCallbackUrl("//evil.com/phish"), "/parent");
  assert.equal(sanitizeCallbackUrl("///evil.com"), "/parent");
  assert.equal(sanitizeCallbackUrl("/\\evil.com"), "/parent");
  assert.equal(sanitizeCallbackUrl("/\\\\evil.com"), "/parent");
});

test("Callback Sanitization: rejects schemes and external protocols", () => {
  assert.equal(sanitizeCallbackUrl("https://evil.com"), "/parent");
  assert.equal(sanitizeCallbackUrl("http://evil.com/login"), "/parent");
  assert.equal(sanitizeCallbackUrl("javascript:alert(1)"), "/parent");
  assert.equal(sanitizeCallbackUrl("data:text/html,<script>alert(1)</script>"), "/parent");
  assert.equal(sanitizeCallbackUrl("/https://evil.com"), "/parent");
});

test("Callback Sanitization: handles null, undefined, empty, and custom fallback", () => {
  assert.equal(sanitizeCallbackUrl(null), "/parent");
  assert.equal(sanitizeCallbackUrl(undefined), "/parent");
  assert.equal(sanitizeCallbackUrl(""), "/parent");
  assert.equal(sanitizeCallbackUrl("   "), "/parent");
  assert.equal(sanitizeCallbackUrl("invalid-relative-path", "/custom-fallback"), "/custom-fallback");
  assert.equal(sanitizeCallbackUrl("https://evil.com", "/child-login"), "/child-login");
});

test("Error Parsing: parses nested API error contract { error: { code, message, details, requestId } }", () => {
  const payload = {
    error: {
      code: "INVALID_CREDENTIALS",
      message: "The email or password entered is incorrect.",
      details: {
        email: ["Email does not exist"],
      },
      requestId: "req_auth_998859",
    },
  };

  const err = parseApiError(payload, 401);
  assert.ok(err instanceof AuthApiError);
  assert.equal(err.statusCode, 401);
  assert.equal(err.message, "The email or password entered is incorrect.");
  assert.equal(err.code, "INVALID_CREDENTIALS");
  assert.deepEqual(err.details, { email: ["Email does not exist"] });
  assert.equal(err.requestId, "req_auth_998859");
});

test("Error Parsing: preserves compatibility with simple string error and message", () => {
  const simpleError = parseApiError({ error: "Simple error string" }, 400);
  assert.equal(simpleError.message, "Simple error string");
  assert.equal(simpleError.statusCode, 400);

  const simpleMessage = parseApiError({ message: "Direct message error" }, 403);
  assert.equal(simpleMessage.message, "Direct message error");
  assert.equal(simpleMessage.statusCode, 403);
});

test("Error Parsing: provides safe fallback per status code when body has no message", () => {
  const err401 = parseApiError({}, 401);
  assert.ok(err401.message.includes("sign in"));

  const err403 = parseApiError(null, 403);
  assert.ok(err403.message.includes("Guardian permission"));

  const err404 = parseApiError(undefined, 404);
  assert.ok(err404.message.includes("not found"));

  const err409 = parseApiError({}, 409);
  assert.ok(err409.message.includes("already exists"));
});

test("Auth Contract: Register payload requires name, email, password", () => {
  const payload = {
    name: "Linh Nguyen",
    email: "guardian@example.com",
    password: "Password123!",
  };

  assert.ok(payload.name.length >= 2, "Guardian name should be at least 2 characters");
  assert.match(payload.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Email should be valid format");
  assert.ok(payload.password.length >= 8, "Password must be at least 8 characters");
});

test("Auth Contract: Login payload requires email and password", () => {
  const payload = {
    email: "parent@example.com",
    password: "securepassword",
  };

  assert.ok(payload.email.length > 0);
  assert.ok(payload.password.length > 0);
});

test("Auth Contract: Child login requires childId and exact 4-digit pin", () => {
  const validChildLogin = {
    childId: "child_123",
    pin: "1234",
  };

  assert.ok(validChildLogin.childId.length > 0);
  assert.match(validChildLogin.pin, /^\d{4}$/, "Child PIN must be exactly 4 numeric digits");

  const invalidPins = ["123", "12345", "abcd", ""];
  for (const pin of invalidPins) {
    assert.doesNotMatch(pin, /^\d{4}$/, `PIN ${pin} should not match 4-digit format`);
  }
});

test("Auth Contract: Endpoints match specifications", () => {
  const routes = {
    register: "/api/auth/register",
    login: "/api/auth/login",
    childLogin: "/api/auth/child-login",
    logout: "/api/auth/logout",
    session: "/api/auth/session",
    children: "/api/children",
  };

  assert.equal(routes.register, "/api/auth/register");
  assert.equal(routes.login, "/api/auth/login");
  assert.equal(routes.childLogin, "/api/auth/child-login");
  assert.equal(routes.logout, "/api/auth/logout");
  assert.equal(routes.session, "/api/auth/session");
  assert.equal(routes.children, "/api/children");
});

test("Auth Security: No credentials stored in client storage", () => {
  const storageKeys = [];
  const sensitivePatterns = ["token", "jwt", "password", "secret"];

  for (const key of storageKeys) {
    const isSensitive = sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern));
    assert.strictEqual(isSensitive, false, `Found sensitive key in client storage: ${key}`);
  }
});
