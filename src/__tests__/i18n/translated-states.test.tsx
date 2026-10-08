import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ChildPinPad } from "@/components/auth/child-pin-pad";

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
});
