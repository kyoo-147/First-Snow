import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParentShell } from "@/components/parent/parent-shell";
import { ParentPrivacyScreen } from "@/components/pages/parent-privacy-screen";
import { ParentAlertDetailScreen } from "@/components/pages/parent-alert-detail-screen";
import { ParentAlertsScreen } from "@/components/pages/parent-alerts-screen";
import { ParentTranscriptsScreen } from "@/components/pages/parent-transcripts-screen";
import { TalkShell } from "@/components/companion/talk-shell";
import { AppShell } from "@/components/app-shell/app-shell";

// Mock next/image and next/link
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));

let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

// Mock safety-client
vi.mock("@/lib/safety-client", () => ({
  getPrivacySettings: vi.fn().mockResolvedValue({
    microphoneAccess: true,
    cameraAccess: false,
    cameraPreview: false,
    visionAiAccess: false,
    screenCaptureAccess: false,
    transcriptStorageDays: 30,
    emotionTimelineStorage: true,
  }),
  getConsents: vi.fn().mockResolvedValue({ consents: [] }),
  updatePrivacySettings: vi.fn().mockResolvedValue({
    microphoneAccess: false,
    cameraAccess: false,
    cameraPreview: false,
    visionAiAccess: false,
    screenCaptureAccess: false,
    transcriptStorageDays: 30,
    emotionTimelineStorage: true,
  }),
  SafetyApiError: class SafetyApiError extends Error {
    code = "SAFETY_ERROR";
    requestId = "req-123";
    isReauthRequired = false;
  },
}));

// Mock dashboard-client
vi.mock("@/lib/dashboard-client", () => ({
  fetchHouseholdChildren: vi.fn().mockResolvedValue([
    { id: "child-1", name: "Minh", grade: "Lớp 1", active: true },
  ]),
  fetchDashboardAlert: vi.fn().mockResolvedValue({
    id: "alert-1",
    childId: "child-1",
    title: "Cảnh báo cảm xúc",
    description: "Trẻ có biểu hiện buồn bã kéo dài.",
    severity: "high",
    createdAt: "2026-10-09T08:00:00.000Z",
    readAt: null,
    linkedSessionId: "sess-linked-123",
  }),
  fetchDashboardAlerts: vi.fn().mockResolvedValue([]),
  fetchDashboardAttempts: vi.fn().mockResolvedValue([]),
  fetchDashboardProgress: vi.fn().mockResolvedValue(null),
  fetchDashboardRoutines: vi.fn().mockResolvedValue([]),
  markDashboardAlertRead: vi.fn().mockResolvedValue({}),
  getErrorMessage: (e: any) => e?.message ?? "Error",
  localDateKey: () => "2026-10-10",
  formatSnowDate: () => "10/10/2026",
  formatSnowTime: () => "08:00",
}));

// Mock companion-client
vi.mock("@/lib/companion-client", () => ({
  createSession: vi.fn().mockResolvedValue({ id: "sess-abc", childId: "child-1" }),
  getSession: vi.fn().mockResolvedValue({ id: "sess-abc", childId: "child-1" }),
  getMessages: vi.fn().mockResolvedValue([]),
  sendMessage: vi.fn().mockResolvedValue({
    id: "msg-1",
    sessionId: "sess-abc",
    role: "child",
    content: "Chào bạn",
    createdAt: "2026-10-09T08:00:00.000Z",
  }),
  getTranscripts: vi.fn().mockResolvedValue([
    {
      id: "msg-1",
      sessionId: "sess-linked-123",
      role: "assistant",
      content: "Hôm nay bạn thế nào?",
      createdAt: "2026-10-09T08:00:00.000Z",
    },
  ]),
  getAlerts: vi.fn().mockResolvedValue([
    {
      id: "alert-1",
      childId: "child-1",
      title: "Cảnh báo an toàn",
      description: "Cần chú ý",
      severity: "high",
      createdAt: "2026-10-09T08:00:00.000Z",
      readAt: null,
      linkedSessionId: "sess-linked-123",
    },
  ]),
  CompanionApiError: class CompanionApiError extends Error {
    status = 500;
  },
}));

describe("UI Text Mapping & Rendering Defects", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it("ParentShell renders localized group titles, not unmapped sentinel keys", () => {
    const html = renderToStaticMarkup(
      <ParentShell activeNav="dashboard">
        <div>Content</div>
      </ParentShell>
    );
    // Must NOT contain unmapped sentinel keys
    expect(html).not.toContain("parent:nav.chính");
    expect(html).not.toContain("parent:nav.antoàn");
    expect(html).not.toContain("parent:nav.hệthống");

    // Must contain human-readable Vietnamese group headers
    expect(html).toContain("Chính");
    expect(html).toContain("An toàn");
    expect(html).toContain("Hệ thống");
  });

  it("ParentAlertDetailScreen renders localized severity and uses standard ?session= link", async () => {
    const testAlert = {
      id: "alert-1",
      childId: "child-1",
      title: "Cảnh báo cảm xúc",
      description: "Trẻ có biểu hiện buồn bã kéo dài.",
      severity: "high" as const,
      createdAt: "2026-10-09T08:00:00.000Z",
      readAt: null,
      linkedSessionId: "sess-linked-123",
    };
    const testChild = {
      id: "child-1",
      name: "Minh",
      age: 7,
      grade: "Lớp 1",
      avatarUrl: null,
      isActive: true,
    };
    const html = renderToStaticMarkup(
      <ParentAlertDetailScreen
        alertId="alert-1"
        initialAlert={testAlert}
        initialChild={testChild}
      />
    );
    // Severity should not be raw English "high" in priority tile
    expect(html).not.toContain('<div class="text-2xl font-black text-snow-primary-dark">high</div>');
    // Should render Vietnamese "Cao" instead of "high"
    expect(html).toContain("Cao");
    // Navigation to transcript should use ?session= to match parent-alerts-screen
    expect(html).toContain("transcripts?session=sess-linked-123");
  });

  it("ParentAlertsScreen renders localized severity instead of 'high ưu tiên'", () => {
    const html = renderToStaticMarkup(<ParentAlertsScreen />);
    // Should not render English "high ưu tiên" or "high" raw enum
    expect(html).not.toContain("high ưu tiên");
  });

  it("ParentTranscriptsScreen supports ?sessionId query param and does not display raw childId slug", () => {
    mockSearchParams = new URLSearchParams("sessionId=sess-linked-123");
    const html = renderToStaticMarkup(<ParentTranscriptsScreen childId="child-1" />);
    // Should not display raw "Trẻ em (child-1)" in status tile value
    expect(html).not.toContain("Trẻ em (child-1)");
  });

  it("AppShell renders correct navigation aria-label and signedIn status", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="companion">
        <div>Chat</div>
      </AppShell>
    );
    // Navigation should not be labeled "Tìm kiếm"
    expect(html).not.toContain('aria-label="Tìm kiếm"');
    // Status under child name should be "Đã đăng nhập", not "Thành công"
    expect(html).toContain("Đã đăng nhập");
    expect(html).not.toContain("Thành công");
  });

  it("ParentPrivacyScreen maps setting keys to Vietnamese titles for update messages", async () => {
    const { getPrivacyItemTitle } = await import("@/components/pages/parent-privacy-screen");
    expect(getPrivacyItemTitle("microphoneAccess")).toBe("Quyền truy cập Micro");
    expect(getPrivacyItemTitle("cameraAccess")).toBe("Quyền truy cập Camera");
    expect(getPrivacyItemTitle("visionAiAccess")).toBe("Phân tích AI Tầm nhìn");
  });

  it("TalkShell renders Vietnamese fallback when assistant message content is empty", () => {
    const html = renderToStaticMarkup(
      <TalkShell
        childId="child-1"
        initialSessionId="sess-123"
        initialMessages={[
          {
            id: "msg-assistant-empty",
            sessionId: "sess-123",
            role: "assistant",
            content: "   ",
            createdAt: "2026-10-09T08:00:00.000Z",
          },
        ]}
      />
    );
    // Should render Vietnamese fallback instead of an empty bubble
    expect(html).toContain("Trợ lý chưa trả lời được. Hãy thử lại nhé!");
  });

  it("TalkShell renders action buttons for Vietnamese breathing prompts", () => {
    const html = renderToStaticMarkup(
      <TalkShell
        childId="child-1"
        initialSessionId="sess-123"
        initialMessages={[
          {
            id: "msg-assistant-breathing",
            sessionId: "sess-123",
            role: "assistant",
            content: "Bạn có muốn cùng tập bài tập thở để thấy bình tĩnh hơn không?",
            createdAt: "2026-10-09T08:00:00.000Z",
          },
        ]}
      />
    );
    // Should render breathing action buttons
    expect(html).toContain("Được, cùng thử nào");
    expect(html).toContain("Kể cho mình nghe một câu chuyện nhẹ nhàng");
    expect(html).toContain("Mình cần thêm sự giúp đỡ");
  });
});

