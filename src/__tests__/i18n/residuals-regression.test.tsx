import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressStrip } from "@/components/ui/progress-strip";
import NotFound from "@/app/not-found";
import { ChildProfileSelector } from "@/components/auth/child-profile-selector";
import { ParentPrivacyScreen } from "@/components/pages/parent-privacy-screen";
import { ParentTimelineScreen } from "@/components/pages/parent-timeline-screen";
import { SimpleParentScreen } from "@/components/pages/simple-parent-screen";

// Mock next/image and next/link
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock safety-client for ParentPrivacyScreen
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
  updatePrivacySettings: vi.fn().mockResolvedValue({}),
  SafetyApiError: class SafetyApiError extends Error {
    code = "SAFETY_ERROR";
    requestId = "req-123";
  },
}));

// Mock dashboard-client for ParentTimelineScreen
vi.mock("@/lib/dashboard-client", () => ({
  fetchHouseholdChildren: vi.fn().mockResolvedValue([
    { id: "child-1", name: "Minh", grade: "Grade 1", active: true },
  ]),
  fetchDashboardAttempts: vi.fn().mockResolvedValue([]),
  fetchDashboardAlerts: vi.fn().mockResolvedValue([]),
  getErrorMessage: (e: any) => e?.message ?? "Error",
}));

describe("Vietnamese-first Residual Regression Tests", () => {
  it("ErrorState renders Vietnamese default title, description and retry button", () => {
    const html = renderToStaticMarkup(<ErrorState onRetry={vi.fn()} />);
    expect(html).toContain("Đã xảy ra lỗi ngoài ý muốn");
    expect(html).toContain("AgentKid gặp chút sự cố khi tải trang này. Hãy thử lại nhé.");
    expect(html).toContain("Thử lại");
  });

  it("ProgressStrip renders progressbar role and default aria-label in Vietnamese", () => {
    const html = renderToStaticMarkup(<ProgressStrip value={65} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Tiến độ"');
    expect(html).toContain('style="width:65%"');
  });

  it("Root NotFound page renders Vietnamese copy and return button", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("Không tìm thấy trang");
    expect(html).toContain("Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.");
    expect(html).toContain("Về trang chủ");
  });

  it("ChildProfileSelector renders guardian requirement notice in Vietnamese", () => {
    const html = renderToStaticMarkup(
      <ChildProfileSelector
        childrenList={[]}
        onSelectChild={vi.fn()}
        authRequired={true}
      />
    );
    expect(html).toContain("Vui lòng đăng nhập tài khoản phụ huynh để xem hồ sơ và mã PIN của các bạn nhỏ.");
    expect(html).toContain("Đăng nhập với tư cách Phụ huynh");
  });

  it("ParentPrivacyScreen renders localized safety controls and toggle aria-labels", () => {
    const html = renderToStaticMarkup(<ParentPrivacyScreen />);
    expect(html).toContain("Quyền riêng tư &amp; Quản lý dữ liệu");
    expect(html).toContain("An toàn &amp; Quản trị");
    expect(html).toContain("Đồng bộ trạng thái");
    expect(html).toContain("Xem trước camera");
    expect(html).toContain("AI Tầm nhìn");
    expect(html).toContain("Quyền đang hoạt động");
    expect(html).toContain("Xuất dữ liệu của trẻ");
    expect(html).toContain("Yêu cầu xóa dữ liệu");
    expect(html).toContain("Quy tắc sao chép điềm tĩnh");
    expect(html).toContain("AgentKid ghi lại các quan sát");
  });

  it("ParentTimelineScreen renders Vietnamese activity status tiles", () => {
    const html = renderToStaticMarkup(<ParentTimelineScreen childId="child-1" />);
    expect(html).toContain("Hoạt động đã ghi");
    expect(html).toContain("Bài học đã hoàn thành");
    expect(html).toContain("Đánh giá an toàn");
    expect(html).toContain("Cần xem xét");
  });

  it("SimpleParentScreen renders localized rows and metrics", () => {
    const html = renderToStaticMarkup(<SimpleParentScreen title="Cài đặt gia đình" />);
    expect(html).toContain("Tùy chọn thông báo");
    expect(html).toContain("Xác thực phụ huynh");
    expect(html).toContain("Lịch trình sinh hoạt");
    expect(html).toContain("Chia sẻ với người chăm sóc");
    expect(html).toContain("Thời gian màn hình");
    expect(html).toContain("45 phút");
    expect(html).toContain("Đang hoạt động");
    expect(html).toContain("2 người lớn");
  });
});
