import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { getAppHref } from "../../src/lib/site-hosts";

export default function LoginPage() {
  const appDashboardHref = getAppHref("/dashboard");

  return (
    <main className="login-shell">
      <a className="dashboard-brand login-brand" href="/">
        <span className="brand-mark">
          <Sparkles size={18} strokeWidth={3} />
        </span>
        AgentKid
      </a>

      <section className="login-layout">
        <div className="login-story">
          <span className="eyebrow">Parent access</span>
          <h1>Đăng nhập để quản lý hành trình học của bé.</h1>
          <p>
            Dashboard là nơi phụ huynh quản lý hồ sơ trẻ, bắt đầu phiên học với Mia,
            duyệt bài học, xem báo cáo và kiểm tra cảnh báo an toàn.
          </p>
          <p>
            Landing page và đăng nhập dùng domain agentkid.io.vn. Sau khi vào workspace,
            phụ huynh sẽ được chuyển qua app.agentkid.io.vn.
          </p>
          <div className="login-preview-card">
            <div className="mini-robot" aria-hidden="true">
              <span />
              <span />
            </div>
            <div>
              <strong>Mia đã sẵn sàng</strong>
              <span>Không lưu raw media. Consent active.</span>
            </div>
          </div>
        </div>

        <section className="login-card" aria-label="Đăng nhập phụ huynh">
          <span className="section-kicker">Secure sign in</span>
          <h2>Chào mừng quay lại</h2>
          <label>
            Email phụ huynh
            <input type="email" name="email" defaultValue="parent@agentkid.local" />
          </label>
          <label>
            Mật khẩu
            <input type="password" name="password" defaultValue="agentkid-demo" />
          </label>
          <a className="button-primary" href={appDashboardHref}>
            Vào dashboard
            <ArrowRight size={18} />
          </a>
          <p className="login-disclaimer">
            <LockKeyhole size={16} />
            Đây là UI prototype. API identity hiện đã có contract nền; production persistence sẽ nối sau khi DB server sẵn sàng.
          </p>
          <a className="login-safe-link" href="/safety">
            <ShieldCheck size={16} />
            Xem nguyên tắc privacy
          </a>
        </section>
      </section>
    </main>
  );
}
