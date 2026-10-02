import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// We import from the target lib file
import {
  buildSafeWebSocketUrl,
  calculateBackoff,
  requestWsTicket,
  VoiceClient,
  FAIL_CLOSED_CAPABILITIES,
  VoiceClientError,
} from "../../../lib/voice-client.ts";

describe("voice-client contracts & safety", () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    // Setup mock localStorage
    globalThis.localStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      get length() {
        return Object.keys(mockStorage).length;
      },
      key: (i) => Object.keys(mockStorage)[i] || null,
    };

    // Setup mock window with location
    globalThis.window = {
      location: {
        protocol: "https:",
        host: "agentkid.snow.test",
        origin: "https://agentkid.snow.test",
      },
      localStorage: globalThis.localStorage,
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  });

  describe("URL and Ticket Safety", () => {
    test("buildSafeWebSocketUrl builds secure wss URL with query ticket parameter", () => {
      const url = buildSafeWebSocketUrl("wss://agentkid.snow.test/api/companion/ws", "ticket-abc-123");
      assert.equal(url, "wss://agentkid.snow.test/api/companion/ws?ticket=ticket-abc-123");
    });

    test("buildSafeWebSocketUrl converts relative path to secure wss origin using window.location", () => {
      const url = buildSafeWebSocketUrl("/api/companion/ws", "ticket-xyz-456");
      assert.equal(url, "wss://agentkid.snow.test/api/companion/ws?ticket=ticket-xyz-456");
    });

    test("buildSafeWebSocketUrl encodes special characters in ticket query parameter", () => {
      const rawTicket = "ticket+with/special=chars&more=1";
      const url = buildSafeWebSocketUrl("wss://agentkid.snow.test/api/companion/ws", rawTicket);
      assert.equal(
        url,
        `wss://agentkid.snow.test/api/companion/ws?ticket=${encodeURIComponent(rawTicket)}`
      );
      assert.ok(!url.includes("chars&more=1"), "Ticket parameter must be URI encoded");
    });

    test("buildSafeWebSocketUrl rejects dangerous or invalid schemes", () => {
      assert.throws(() => {
        buildSafeWebSocketUrl("javascript:alert(1)", "ticket-1");
      }, /Invalid or unsafe WebSocket URL/);

      assert.throws(() => {
        buildSafeWebSocketUrl("http://agentkid.snow.test/api/companion/ws", "ticket-1");
      }, /Invalid or unsafe WebSocket URL/);

      assert.throws(() => {
        buildSafeWebSocketUrl("file:///etc/passwd", "ticket-1");
      }, /Invalid or unsafe WebSocket URL/);

      assert.throws(() => {
        buildSafeWebSocketUrl("data:text/html,test", "ticket-1");
      }, /Invalid or unsafe WebSocket URL/);
    });

    test("buildSafeWebSocketUrl rejects empty tickets or empty URLs", () => {
      assert.throws(() => {
        buildSafeWebSocketUrl("wss://agentkid.snow.test/api/companion/ws", "");
      }, /Ticket is required/);

      assert.throws(() => {
        buildSafeWebSocketUrl("", "ticket-1");
      }, /URL is required/);
    });

    test("requestWsTicket sends POST /api/companion/ws-ticket and returns one-time ticket", async () => {
      globalThis.fetch = async (input, init) => {
        assert.equal(input, "/api/companion/ws-ticket");
        assert.equal(init?.method, "POST");
        assert.equal(init?.credentials, "same-origin");
        // Must NOT send credentials or authorization header
        assert.equal(init?.headers?.Authorization, undefined);

        return new Response(
          JSON.stringify({
            ticket: "valid-ticket-777",
            wsUrl: "wss://agentkid.snow.test/api/companion/ws",
            expiresIn: 60,
            capabilities: {
              audio_input: true,
              camera: false,
              screen: false,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const res = await requestWsTicket();
      assert.equal(res.ticket, "valid-ticket-777");
      assert.equal(res.wsUrl, "wss://agentkid.snow.test/api/companion/ws");
      assert.equal(res.capabilities?.audio_input, true);
      assert.equal(res.capabilities?.camera, false);
    });

    test("requestWsTicket throws VoiceClientError on server failure without leaking credentials", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Child session expired or invalid",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      await assert.rejects(
        async () => {
          await requestWsTicket();
        },
        (err) => {
          assert.ok(err instanceof VoiceClientError);
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, "UNAUTHORIZED");
          return true;
        }
      );
    });
  });

  describe("Reconnect Bounds & Exponential Backoff", () => {
    test("calculateBackoff returns exponentially increasing delays", () => {
      const initial = 1000;
      const max = 30000;
      const multiplier = 2;

      assert.equal(calculateBackoff(0, initial, max, multiplier), 1000);
      assert.equal(calculateBackoff(1, initial, max, multiplier), 2000);
      assert.equal(calculateBackoff(2, initial, max, multiplier), 4000);
      assert.equal(calculateBackoff(3, initial, max, multiplier), 8000);
      assert.equal(calculateBackoff(4, initial, max, multiplier), 16000);
    });

    test("calculateBackoff strictly bounds delay to maxBackoffMs", () => {
      const initial = 1000;
      const max = 30000;
      const multiplier = 2;

      assert.equal(calculateBackoff(5, initial, max, multiplier), 30000);
      assert.equal(calculateBackoff(10, initial, max, multiplier), 30000);
      assert.equal(calculateBackoff(100, initial, max, multiplier), 30000);
    });

    test("calculateBackoff handles negative or boundary inputs cleanly", () => {
      assert.equal(calculateBackoff(-1, 1000, 30000, 2), 1000);
    });
  });

  describe("Fail-Closed Capability Grant Gating", () => {
    test("starts with fail-closed capabilities: camera, screen, vision, mic are disabled", () => {
      const client = new VoiceClient();
      const caps = client.getCapabilities();

      assert.equal(caps.audio_input, false, "audio_input must be false by default");
      assert.equal(caps.camera, false, "camera must be false by default");
      assert.equal(caps.screen, false, "screen must be false by default");
      assert.equal(caps.vision, false, "vision must be false by default");
      assert.equal(caps.live2d, false, "live2d must be false by default (absent model)");
    });

    test("camera capture throws error and never invokes getUserMedia without server grant", async () => {
      let getUserMediaCalled = false;
      const originalMediaDevices = globalThis.navigator?.mediaDevices;
      try {
        Object.defineProperty(globalThis.navigator, "mediaDevices", {
          value: {
            getUserMedia: async () => {
              getUserMediaCalled = true;
              return {};
            },
          },
          configurable: true,
          writable: true,
        });
      } catch {
        // In case navigator is not configurable, fallback
      }

      const client = new VoiceClient();
      assert.equal(client.canUseCamera(), false);

      await assert.rejects(async () => {
        await client.requestCameraCapture();
      }, /Camera unavailable: server capability grant required/);

      assert.equal(getUserMediaCalled, false, "getUserMedia must NEVER be invoked without server grant");
    });

    test("screen capture throws error and never invokes getDisplayMedia without server grant", async () => {
      let getDisplayMediaCalled = false;
      try {
        Object.defineProperty(globalThis.navigator, "mediaDevices", {
          value: {
            getDisplayMedia: async () => {
              getDisplayMediaCalled = true;
              return {};
            },
          },
          configurable: true,
          writable: true,
        });
      } catch {
        // In case navigator is not configurable
      }

      const client = new VoiceClient();
      assert.equal(client.canUseScreen(), false);

      await assert.rejects(async () => {
        await client.requestScreenCapture();
      }, /Screen capture unavailable: server capability grant required/);

      assert.equal(getDisplayMediaCalled, false, "getDisplayMedia must NEVER be invoked without server grant");
    });

    test("microphone throws error without server capability grant", async () => {
      let getUserMediaAudioCalled = false;
      try {
        Object.defineProperty(globalThis.navigator, "mediaDevices", {
          value: {
            getUserMedia: async () => {
              getUserMediaAudioCalled = true;
              return {};
            },
          },
          configurable: true,
          writable: true,
        });
      } catch {
        // In case navigator is not configurable
      }

      const client = new VoiceClient();
      assert.equal(client.canUseMic(), false);

      await assert.rejects(async () => {
        await client.startMic();
      }, /Microphone unavailable: server capability grant required/);

      assert.equal(getUserMediaAudioCalled, false, "Audio capture must NOT start without grant");
    });

    test("server capability grant message updates client capabilities", () => {
      const client = new VoiceClient();
      client.handleServerMessage({
        type: "capabilities",
        capabilities: {
          audio_input: true,
          camera: false,
          screen: false,
          live2d: false,
        },
      });

      const updated = client.getCapabilities();
      assert.equal(updated.audio_input, true);
      assert.equal(updated.camera, false);
      assert.equal(updated.screen, false);
    });
  });

  describe("No Credential Storage Security", () => {
    test("VoiceClient operations never write credentials or tickets to localStorage", async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            ticket: "secret-ticket-999",
            wsUrl: "wss://agentkid.snow.test/api/companion/ws",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const client = new VoiceClient();
      await client.connect();

      // Check localStorage
      assert.equal(globalThis.localStorage.getItem("kid_app_users"), null);
      assert.equal(globalThis.localStorage.getItem("kid_app_current_user"), null);
      assert.equal(globalThis.localStorage.getItem("kid_active_profile"), null);
      assert.equal(globalThis.localStorage.getItem("ticket"), null);
      assert.equal(globalThis.localStorage.getItem("wsTicket"), null);
      assert.equal(globalThis.localStorage.getItem("wsUrl"), null);

      client.disconnect();
    });
  });

  describe("Message Deduplication", () => {
    test("deduplicates messages with the same message id", () => {
      const client = new VoiceClient();
      const received = [];

      client.onMessage((msg) => {
        received.push(msg);
      });

      // First time
      client.handleServerMessage({
        id: "msg-001",
        type: "full-text",
        text: "Hello Snow!",
      });

      // Duplicate
      client.handleServerMessage({
        id: "msg-001",
        type: "full-text",
        text: "Hello Snow!",
      });

      // Second unique message
      client.handleServerMessage({
        id: "msg-002",
        type: "full-text",
        text: "How are you?",
      });

      assert.equal(received.length, 2, "Duplicate message should be dropped");
      assert.equal(received[0].id, "msg-001");
      assert.equal(received[1].id, "msg-002");
    });
  });

  describe("Audio Playback Queue & Interruption", () => {
    test("interruption stops audio queue, resets subtitle, and sends interrupt signal", () => {
      const client = new VoiceClient();
      let sentSignal = null;

      client.sendSocketMessage = (msg) => {
        sentSignal = msg;
      };

      // Set subtitle
      client.setSubtitle("AI is speaking something important...");
      assert.equal(client.getSubtitle(), "AI is speaking something important...");

      // Enqueue an audio task
      let taskExecuted = false;
      client.enqueueAudio({
        id: "audio-1",
        audioBase64: "base64audio...",
        displayText: { text: "AI is speaking something important..." },
      });

      // Trigger interrupt
      client.interrupt();

      assert.equal(client.getSubtitle(), "", "Subtitle should be cleared on interrupt");
      assert.equal(client.getAudioQueueLength(), 0, "Queue should be cleared on interrupt");
      assert.ok(sentSignal, "Interrupt signal should be sent to server");
      assert.equal(sentSignal.type, "interrupt-signal");
    });
  });

  describe("Live2D Honest Absent Status", () => {
    test("VoiceClient reports live2d as unavailable and does not invent fake model asset", () => {
      const client = new VoiceClient();
      assert.equal(client.getCapabilities().live2d, false);
      assert.equal(client.getModelStatus().available, false);
      assert.equal(client.getModelStatus().reason, "Model asset absent; operating in voice & subtitle mode");
    });
  });
});
