import { LogIn, ShieldCheck, Sparkles } from "lucide-react";

const navItems = [
  ["Sản phẩm", "/product"],
  ["Cho phụ huynh", "/parents"],
  ["Phương pháp", "/method"],
  ["An toàn", "/safety"],
  ["Pilot", "/pilot"]
];

export function SiteHeader() {
  return (
    <nav className="nav" aria-label="Điều hướng chính">
      <a className="brand" href="/" aria-label="AgentKid home">
        <span className="brand-mark">
          <Sparkles size={18} strokeWidth={3} />
        </span>
        AgentKid
      </a>
      <div className="nav-links">
        {navItems.map(([label, href]) => (
          <a href={href} key={href}>
            {label}
          </a>
        ))}
      </div>
      <a className="nav-cta" href="/login">
        <LogIn size={17} />
        Đăng nhập
      </a>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
      <div>
        <a className="brand" href="/" aria-label="AgentKid home">
            <span className="brand-mark">
              <Sparkles size={18} strokeWidth={3} />
            </span>
            AgentKid
        </a>
        <p className="footer-note">
          Mia là bạn đồng hành AI, không thay thế trị liệu chuyên nghiệp.
        </p>
      </div>
        <div className="footer-links" aria-label="Duong dan chan trang">
          <a href="/safety">
            <ShieldCheck size={16} />
            Safety
          </a>
          <a href="/contact">Contact</a>
          <span>agentkid.io.vn</span>
        </div>
      </div>
    </footer>
  );
}
