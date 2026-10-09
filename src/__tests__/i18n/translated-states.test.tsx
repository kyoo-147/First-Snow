import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChildPinPad } from "@/components/auth/child-pin-pad";
import AuthError from "@/app/(auth)/error";
import AuthLoading from "@/app/(auth)/loading";
import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";
import {
  DataExportDialog,
  SafetyLoadingSkeleton,
  SafetyErrorBanner,
  CapturePolicyBanner,
  ConsentScopeCard,
  ReauthModal,
  EmergencyContactDialog,
} from "@/components/safety";
import { parentNavGroups, parentInsights } from "@/data/snow-data";

// Mock next/image and next/link so they don't break in server render
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>
}));
// Mock useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

describe("Translated States", () => {
  it("AuthShell uses translated strings", () => {
    const html = renderToStaticMarkup(
      <AuthShell title="Tiêu đề thử nghiệm" mode="neutral">
        <div>Content</div>
      </AuthShell>
    );
    expect(html).toContain("Tiêu đề thử nghiệm");
    expect(html).toContain("Về trang chủ Snow");
    expect(html).toContain("Người bạn đồng hành học tập an toàn, nhẹ nhàng");
  });

  it("ChildPinPad uses translated strings", () => {
    const html = renderToStaticMarkup(
      <ChildPinPad child={{ id: "1", name: "An" }} onBack={vi.fn()} />
    );
    expect(html).toContain("Nhập mã PIN bí mật 4 số của bạn");
    expect(html).toContain('aria-label="Xóa"');
    expect(html).toContain('aria-label="Xóa lùi"');
    expect(html).toContain('aria-label="Số 0"');
  });

  it("AuthError renders localized headings, messages and actions", () => {
    const html = renderToStaticMarkup(
      <AuthError error={new Error("Test failure")} reset={vi.fn()} />
    );
    expect(html).toContain("Đã xảy ra lỗi");
    expect(html).toContain("Chúng tôi gặp sự cố khi tải trang xác thực này. Snow khuyên bạn nên thử lại.");
    expect(html).toContain("Thử lại");
    expect(html).toContain("Về trang chủ");
  });

  it("AuthLoading renders localized preparation text and image alt", () => {
    const html = renderToStaticMarkup(<AuthLoading />);
    expect(html).toContain('alt="Snow đang chuẩn bị"');
    expect(html).toContain("Đang kết nối với Snow...");
    expect(html).toContain("Đang thiết lập không gian an toàn và bình tĩnh của bạn.");
  });

  it("SafetyLoadingSkeleton and SafetyErrorBanner render localized defaults", () => {
    const skeletonHtml = renderToStaticMarkup(<SafetyLoadingSkeleton />);
    expect(skeletonHtml).toContain("Đang tải cài đặt an toàn...");

    const bannerHtml = renderToStaticMarkup(
      <SafetyErrorBanner message="Kết nối bị gián đoạn" onRetry={vi.fn()} />
    );
    expect(bannerHtml).toContain("Không thể tải các kiểm soát an toàn");
    expect(bannerHtml).toContain("Kết nối bị gián đoạn");
    expect(bannerHtml).toContain("Thử lại");
  });

  it("CapturePolicyBanner renders Vietnamese governance policies", () => {
    const html = renderToStaticMarkup(<CapturePolicyBanner />);
    expect(html).toContain("Chính sách Thu thập Thiết bị &amp; Quyền riêng tư");
    expect(html).toContain("Mục tiêu chính sách: tính năng thu thập nhạy cảm sẽ không khả dụng cho đến khi việc thực thi đồng ý/cấp quyền từ phía máy chủ được xác minh.");
    expect(html).toContain("Xem xét quản trị thu thập");
  });

  it("ConsentScopeCard renders localized scope labels, status badges, and action buttons", () => {
    const html = renderToStaticMarkup(
      <ConsentScopeCard
        scope="microphone"
        record={{ id: "c1", scope: "microphone", status: "granted", granted: true, policyVersion: "v1.2" }}
        onToggleConsent={vi.fn()}
      />
    );
    expect(html).toContain("Truy cập Giọng nói Micrô");
    expect(html).toContain("Đồng ý Đang hoạt động");
    expect(html).toContain("Quy tắc quản trị:");
    expect(html).toContain("Thu hồi sự đồng ý");
  });

  it("ReauthModal renders Vietnamese dialog titles, labels, and actions", () => {
    const html = renderToStaticMarkup(
      <ReauthModal isOpen={true} onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    expect(html).toContain("Yêu cầu Xác thực lại Quyền Phụ huynh");
    expect(html).toContain("Mật khẩu Phụ huynh");
    expect(html).toContain("Xác nhận Ủy quyền");
    expect(html).toContain("Hủy");
  });

  it("EmergencyContactDialog renders Vietnamese titles, fields, and notices", () => {
    const html = renderToStaticMarkup(
      <EmergencyContactDialog isOpen={true} onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(html).toContain("Thêm Người liên hệ Khẩn cấp");
    expect(html).toContain("Họ và tên");
    expect(html).toContain("Mối quan hệ");
    expect(html).toContain("Số điện thoại");
    expect(html).toContain("Đặt làm liên hệ chính");
    expect(html).toContain("Lưu Liên hệ");
  });

  it("snow-data shared parent navigation and insights are localized in Vietnamese", () => {
    expect(parentNavGroups.map((g) => g.group)).toEqual(["Chính", "An toàn", "Hệ thống"]);
    const dashboardItem = parentNavGroups[0].items.find((i) => i.key === "dashboard");
    expect(dashboardItem?.label).toBe("Bảng điều khiển");

    expect(parentInsights[0].title).toBe("Bộc lộ nhiều cảm xúc hơn");
    expect(parentInsights[0].metric).toBe("+4 từ cảm xúc");
  });

  it("AdminDashboardScreen uses translated loading/error and structural strings", () => {
    const htmlLoading = renderToStaticMarkup(<AdminDashboardScreen view="dashboard" />);
    expect(htmlLoading).toContain("Đang tải dữ liệu quản trị");
    expect(htmlLoading).toContain("Đang xác minh quyền truy cập và đọc hồ sơ đã lưu");
    expect(htmlLoading).toContain("Tổng quan hệ thống");
  });

  it("DataExportDialog uses translated accessibility and guardian wording", () => {
    const html = renderToStaticMarkup(
      <DataExportDialog isOpen={true} onClose={vi.fn()} childId="123" />
    );
    expect(html).toContain("Xuất dữ liệu của trẻ");
    expect(html).toContain("Đóng hộp thoại xuất");
    expect(html).toContain("Nhập mật khẩu phụ huynh để ủy quyền xuất");
  });
});
