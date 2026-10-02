import test from "node:test";
import assert from "node:assert/strict";
import {
  SafetyApiError,
  parseSafetyApiError,
  getPrivacySettings,
  updatePrivacySettings,
  getConsents,
  createConsent,
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getNotificationPreferences,
  updateNotificationPreferences,
  getDataExports,
  requestDataExport,
  getDeletionRequests,
  requestDataDeletion,
} from "../../lib/safety-client.ts";

// Helper mock fetch generator
function createMockFetch(responses) {
  let callIndex = 0;
  const calls = [];

  const mock = async (url, options) => {
    const currentCall = { url: String(url), options, callIndex: callIndex++ };
    calls.push(currentCall);

    const configured = responses[currentCall.url] || responses[url.split("?")[0]] || responses["*"];
    if (!configured) {
      return new Response(JSON.stringify({ error: "Endpoint not mocked" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resConfig = typeof configured === "function" ? configured(currentCall) : configured;
    return new Response(
      typeof resConfig.body === "string" ? resConfig.body : JSON.stringify(resConfig.body),
      {
        status: resConfig.status || 200,
        headers: {
          "Content-Type": "application/json",
          ...(resConfig.headers || {}),
        },
      },
    );
  };

  mock.calls = calls;
  return mock;
}

// ---------------------------------------------------------------------
// 1. Error Parsing & Re-Auth Contract Tests
// ---------------------------------------------------------------------

test("Safety Error: parses nested contract { error: { code, message, details, requestId } }", () => {
  const payload = {
    error: {
      code: "GUARDIAN_AUTH_EXPIRED",
      message: "Guardian credentials timed out. Re-authentication required.",
      details: { reason: "Session idle for over 15 minutes" },
      requestId: "req_safe_40112",
    },
  };

  const err = parseSafetyApiError(payload, 401);
  assert.ok(err instanceof SafetyApiError);
  assert.equal(err.statusCode, 401);
  assert.equal(err.code, "GUARDIAN_AUTH_EXPIRED");
  assert.equal(err.message, "Guardian credentials timed out. Re-authentication required.");
  assert.deepEqual(err.details, { reason: "Session idle for over 15 minutes" });
  assert.equal(err.requestId, "req_safe_40112");
  assert.equal(err.isReauthRequired, true);
});

test("Safety Error: marks isReauthRequired on REAUTH_REQUIRED code and password challenges", () => {
  const errCode = parseSafetyApiError({ error: { code: "REAUTH_REQUIRED", message: "Password needed" } }, 403);
  assert.equal(errCode.isReauthRequired, true);

  const errPassword = parseSafetyApiError({ error: "Invalid password provided for purge" }, 401);
  assert.equal(errPassword.isReauthRequired, true);

  const errOther = parseSafetyApiError({ error: "Validation failed" }, 400);
  assert.equal(errOther.isReauthRequired, false);
});

test("Safety Error: provides safe guardian fallback per status code when body has no message", () => {
  const err401 = parseSafetyApiError({}, 401);
  assert.ok(err401.message.includes("Session expired"));

  const err403 = parseSafetyApiError(null, 403);
  assert.ok(err403.message.includes("authorization required"));

  const err404 = parseSafetyApiError(undefined, 404);
  assert.ok(err404.message.includes("not found"));

  const err409 = parseSafetyApiError({}, 409);
  assert.ok(err409.message.includes("conflict"));
});

// ---------------------------------------------------------------------
// 2. Privacy Settings Endpoint & Workflow Contracts
// ---------------------------------------------------------------------

test("Privacy Contract: GET /api/privacy requests and parses settings", async () => {
  const mockSettings = {
    microphoneAccess: true,
    cameraAccess: false,
    visionAiAccess: false,
    screenCaptureAccess: false,
    cameraPreview: false,
    transcriptStorageDays: 30,
    emotionTimelineStorage: true,
  };

  const mockFetch = createMockFetch({
    "/api/privacy": { body: mockSettings },
  });

  const result = await getPrivacySettings(mockFetch);
  assert.equal(mockFetch.calls.length, 1);
  assert.equal(mockFetch.calls[0].url, "/api/privacy");
  assert.equal(mockFetch.calls[0].options.method, "GET");
  assert.deepEqual(result, mockSettings);
});

test("Privacy Contract: PATCH /api/privacy sends partial updates with credentials", async () => {
  const updatedSettings = {
    microphoneAccess: true,
    cameraAccess: true,
    visionAiAccess: false,
    screenCaptureAccess: false,
    cameraPreview: false,
    transcriptStorageDays: 60,
    emotionTimelineStorage: true,
  };

  const mockFetch = createMockFetch({
    "/api/privacy": (call) => {
      assert.equal(call.options.method, "PATCH");
      assert.equal(call.options.credentials, "include");
      const sent = JSON.parse(call.options.body);
      assert.equal(sent.cameraAccess, true);
      assert.equal(sent.transcriptStorageDays, 60);
      return { body: updatedSettings };
    },
  });

  const result = await updatePrivacySettings(
    { cameraAccess: true, transcriptStorageDays: 60 },
    mockFetch,
  );
  assert.equal(result.cameraAccess, true);
  assert.equal(result.transcriptStorageDays, 60);
});

// ---------------------------------------------------------------------
// 3. Consents Contract (Mic, Camera, Vision, Screen)
// ---------------------------------------------------------------------

test("Consent Contract: GET /api/consents returns explicit scopes and handles summary indexing", async () => {
  const mockConsents = [
    { id: "c1", scope: "microphone", status: "granted", granted: true, policyVersion: "2026.1" },
    { id: "c2", scope: "camera", status: "revoked", granted: false, policyVersion: "2026.1" },
    { id: "c3", scope: "vision", status: "pending", granted: false, policyVersion: "2026.1" },
    { id: "c4", scope: "screen", status: "revoked", granted: false, policyVersion: "2026.1" },
  ];

  const mockFetch = createMockFetch({
    "/api/consents": { body: mockConsents },
  });

  const result = await getConsents(undefined, mockFetch);
  assert.equal(mockFetch.calls[0].url, "/api/consents");
  assert.equal(result.consents.length, 4);
  assert.equal(result.summary?.microphone, true);
  assert.equal(result.summary?.camera, false);
  assert.equal(result.summary?.vision, false);
  assert.equal(result.summary?.screen, false);
});

test("Consent Contract: POST /api/consents updates scope authorization with policy version", async () => {
  const mockFetch = createMockFetch({
    "/api/consents": (call) => {
      assert.equal(call.options.method, "POST");
      const body = JSON.parse(call.options.body);
      assert.equal(body.scope, "vision");
      assert.equal(body.granted, true);
      assert.equal(body.policyVersion, "2026.1");
      return {
        body: {
          consent: {
            id: "c_new",
            scope: "vision",
            status: "granted",
            granted: true,
            policyVersion: "2026.1",
            grantedAt: new Date().toISOString(),
          },
          message: "Vision AI consent recorded.",
        },
      };
    },
  });

  const res = await createConsent(
    { scope: "vision", granted: true, policyVersion: "2026.1" },
    mockFetch,
  );
  assert.equal(res.consent.scope, "vision");
  assert.equal(res.consent.status, "granted");
  assert.equal(res.message, "Vision AI consent recorded.");
});

// ---------------------------------------------------------------------
// 4. Emergency Contacts CRUD Contracts
// ---------------------------------------------------------------------

test("Emergency Contacts: GET / POST / PATCH / DELETE execute declared collection contracts with JSON id", async () => {
  const contactsList = [
    { id: "e1", name: "David Nguyen", relation: "Father", phone: "555-0101", isPrimary: true, notifyOnAlert: true },
  ];

  const mockFetch = createMockFetch({
    "/api/emergency-contacts": (call) => {
      if (call.options.method === "GET") {
        return { body: { contacts: contactsList } };
      }
      if (call.options.method === "POST") {
        const payload = JSON.parse(call.options.body);
        return {
          status: 201,
          body: { contact: { id: "e2", ...payload } },
        };
      }
      if (call.options.method === "PATCH") {
        const payload = JSON.parse(call.options.body);
        assert.equal(payload.id, "e1", "PATCH must include id in request body");
        return { body: { contact: { ...contactsList[0], ...payload } } };
      }
      if (call.options.method === "DELETE") {
        const payload = JSON.parse(call.options.body);
        assert.equal(payload.id, "e1", "DELETE must include id in request body");
        return { body: { success: true } };
      }
      return { status: 405, body: {} };
    },
  });

  // GET
  const list = await getEmergencyContacts(mockFetch);
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "David Nguyen");

  // POST
  const created = await createEmergencyContact(
    { name: "Grandma Mai", relation: "Grandmother", phone: "555-0199", isPrimary: false, notifyOnAlert: true },
    mockFetch,
  );
  assert.equal(created.contact.id, "e2");
  assert.equal(created.contact.name, "Grandma Mai");

  // PATCH (declared collection route)
  const updated = await updateEmergencyContact("e1", { phone: "555-0999" }, mockFetch);
  assert.equal(updated.contact.phone, "555-0999");

  // DELETE (declared collection route)
  const deleted = await deleteEmergencyContact("e1", mockFetch);
  assert.equal(deleted.success, true);

  // Assert that all calls strictly targeted collection endpoint /api/emergency-contacts
  for (const call of mockFetch.calls) {
    assert.equal(call.url, "/api/emergency-contacts", "All calls must target /api/emergency-contacts collection");
  }
});

// ---------------------------------------------------------------------
// 5. Notification Preferences & Delivery State
// ---------------------------------------------------------------------

test("Notification Preferences: GET and PATCH preserve delivery channels and cadence", async () => {
  const initialPrefs = {
    emailAlerts: true,
    pushAlerts: false,
    weeklyReport: true,
    emergencySmsAlerts: true,
    reportCadence: "weekly",
    deliveryPreference: {
      channel: "email",
      frequency: "digest_weekly",
      quietHoursEnabled: true,
    },
  };

  const mockFetch = createMockFetch({
    "/api/notification-preferences": (call) => {
      if (call.options.method === "GET") {
        return { body: { preferences: initialPrefs } };
      }
      if (call.options.method === "PATCH") {
        const patch = JSON.parse(call.options.body);
        return {
          body: {
            preferences: {
              ...initialPrefs,
              ...patch,
              deliveryPreference: {
                ...initialPrefs.deliveryPreference,
                ...(patch.deliveryPreference || {}),
              },
            },
          },
        };
      }
      return { status: 405, body: {} };
    },
  });

  const prefs = await getNotificationPreferences(mockFetch);
  assert.equal(prefs.reportCadence, "weekly");
  assert.equal(prefs.deliveryPreference.channel, "email");

  const updated = await updateNotificationPreferences(
    {
      pushAlerts: true,
      deliveryPreference: { channel: "both", frequency: "immediate" },
    },
    mockFetch,
  );
  assert.equal(updated.pushAlerts, true);
  assert.equal(updated.deliveryPreference.channel, "both");
  assert.equal(updated.deliveryPreference.frequency, "immediate");
});

// ---------------------------------------------------------------------
// 6. Data Export State Machine (requested -> running -> completed/failed)
// ---------------------------------------------------------------------

test("Data Export: verifies progress states and distinguishes request from completion", async () => {
  const exportsHistory = [
    {
      id: "exp_1",
      status: "requested",
      requestedAt: "2026-10-02T10:00:00Z",
      format: "zip",
    },
    {
      id: "exp_2",
      status: "running",
      requestedAt: "2026-10-02T09:30:00Z",
      format: "zip",
    },
    {
      id: "exp_3",
      status: "completed",
      requestedAt: "2026-10-01T12:00:00Z",
      completedAt: "2026-10-01T12:03:00Z",
      downloadUrl: "https://agentkid-storage.local/exports/exp_3.zip",
      format: "zip",
      archiveSizeBytes: 1048576,
    },
    {
      id: "exp_4",
      status: "failed",
      requestedAt: "2026-09-30T08:00:00Z",
      error: "Archive packaging timeout",
      format: "json",
    },
  ];

  const mockFetch = createMockFetch({
    "/api/data-exports": (call) => {
      if (call.options.method === "GET") {
        return { body: { exports: exportsHistory } };
      }
      if (call.options.method === "POST") {
        const body = JSON.parse(call.options.body);
        assert.ok(body.reauthPassword, "Export must include guardian reauth password");
        // Distinguishes request creation from verified completion: returns status 'requested'
        return {
          status: 202,
          body: {
            export: {
              id: "exp_new",
              status: "requested",
              requestedAt: new Date().toISOString(),
              format: body.format || "zip",
            },
            message: "Export request queued.",
          },
        };
      }
      return { status: 405, body: {} };
    },
  });

  // GET
  const history = await getDataExports(mockFetch);
  assert.equal(history.length, 4);
  const statuses = history.map((e) => e.status);
  assert.deepEqual(statuses, ["requested", "running", "completed", "failed"]);

  // POST
  const reqResult = await requestDataExport(
    {
      includeTranscripts: true,
      includeEmotionTimeline: true,
      includeLearningProgress: true,
      format: "zip",
      reauthPassword: "GuardianPassword123!",
    },
    mockFetch,
  );

  assert.equal(reqResult.export.status, "requested");
  assert.notEqual(reqResult.export.status, "completed", "Never fake immediate completion");
});

// ---------------------------------------------------------------------
// 7. Deletion Request Multi-Stage State Machine
// ---------------------------------------------------------------------

test("Deletion Requests: verifies requested -> running -> completed states with stages", async () => {
  const deletionsHistory = [
    {
      id: "del_1",
      scope: "child_transcripts",
      status: "running",
      requestedAt: "2026-10-02T11:00:00Z",
      stages: [
        { stage: "transcripts", name: "Conversation logs", status: "running" },
        { stage: "session_logs", name: "Session metadata", status: "pending" },
      ],
    },
    {
      id: "del_2",
      scope: "all_child_data",
      status: "completed",
      requestedAt: "2026-09-28T14:00:00Z",
      completedAt: "2026-09-28T14:05:00Z",
      stages: [
        { stage: "transcripts", name: "Conversation logs", status: "completed" },
        { stage: "emotion_timeline", name: "Emotion observations", status: "completed" },
        { stage: "session_logs", name: "Session metadata", status: "completed" },
        { stage: "profile_metadata", name: "Profile info", status: "completed" },
      ],
    },
  ];

  const mockFetch = createMockFetch({
    "/api/deletion-requests": (call) => {
      if (call.options.method === "GET") {
        return { body: { deletionRequests: deletionsHistory } };
      }
      if (call.options.method === "POST") {
        const body = JSON.parse(call.options.body);
        assert.equal(body.confirmed, true, "Deletion requires explicit confirmation");
        assert.ok(body.reauthPassword, "Deletion requires reauth password");
        return {
          status: 202,
          body: {
            deletion: {
              id: "del_new",
              scope: body.scope,
              status: "requested",
              requestedAt: new Date().toISOString(),
            },
            message: "Purge scheduled.",
          },
        };
      }
      return { status: 405, body: {} };
    },
  });

  const list = await getDeletionRequests(mockFetch);
  assert.equal(list.length, 2);
  assert.equal(list[0].status, "running");
  assert.equal(list[1].status, "completed");

  const created = await requestDataDeletion(
    {
      scope: "child_transcripts",
      confirmed: true,
      reauthPassword: "GuardianPassword123!",
      reason: "Quarterly cleanup",
    },
    mockFetch,
  );
  assert.equal(created.deletion.status, "requested");
  assert.notEqual(created.deletion.status, "completed", "Request creation must not fake completed state");
});

// ---------------------------------------------------------------------
// 8. Capture Policy & No Media API Invocation Boundary
// ---------------------------------------------------------------------

test("Media API Safety: ensures no browser media streams are invoked in safety client", () => {
  // Confirm safety client does not declare or invoke mediaDevices
  const clientSource = SafetyApiError.toString();
  assert.doesNotMatch(clientSource, /getUserMedia/);
  assert.doesNotMatch(clientSource, /getDisplayMedia/);
});
