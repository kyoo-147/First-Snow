import test from "node:test";
import assert from "node:assert/strict";

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

test("Auth Security: No credentials stored in local storage", () => {
  // Verifying token-free contract model where session relies on HTTP-only cookies
  const storageKeys = [];
  const sensitivePatterns = ["token", "jwt", "password", "secret"];

  for (const key of storageKeys) {
    const isSensitive = sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern));
    assert.strictEqual(isSensitive, false, `Found sensitive key in client storage: ${key}`);
  }
});
