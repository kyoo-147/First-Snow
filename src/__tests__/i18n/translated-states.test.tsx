import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChildPinPad } from "@/components/auth/child-pin-pad";

import { AdminDashboardScreen } from "@/components/pages/admin-dashboard-screen";
import { DataExportDialog } from "@/components/safety/data-export-dialog";


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
    // Verify localized accessibility labels if any (or specific translated strings)
    expect(html).toContain("Về trang chủ Snow"); // component-owned aria-label
    expect(html).toContain("Người bạn đồng hành học tập an toàn, nhẹ nhàng"); // component-owned footer text
  });

  it("ChildPinPad uses translated strings", () => {
    const html = renderToStaticMarkup(
      <ChildPinPad child={{ id: "1", name: "An" }} onBack={vi.fn()} />
    );
    expect(html).toContain("Nhập mã PIN bí mật 4 số của bạn");
    // Verify localized labels including aria-labels
    expect(html).toContain('aria-label="Xóa"');
    expect(html).toContain('aria-label="Xóa lùi"');
    expect(html).toContain('aria-label="Số 0"');
  });

  it("AdminDashboardScreen uses translated loading/error and structural strings", () => {
    // Render initially in loading state (useEffect won't resolve instantly in renderToStaticMarkup)
    const htmlLoading = renderToStaticMarkup(<AdminDashboardScreen view="dashboard" />);
    // Loading strings from parent.json
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
