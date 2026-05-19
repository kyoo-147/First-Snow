import {
  BellRing,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Camera,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  LockKeyhole,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DashboardShellProps = {
  active: string;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: "dark" | "lime" | "mint" | "soft";
};

type FeaturePageProps = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  stats: StatCardProps[];
  hero: {
    title: string;
    copy: string;
    checklist: string[];
    ctaHref?: string;
    ctaLabel?: string;
  };
  panels: Array<{
    icon: LucideIcon;
    title: string;
    copy: string;
    meta: string;
  }>;
};

const navItems = [
  { href: "/dashboard", label: "Mia chat", id: "overview", icon: Sparkles },
  { href: "/dashboard/children", label: "Hồ sơ trẻ", id: "children", icon: Users },
  { href: "/dashboard/session", label: "Phiên học", id: "session", icon: Mic },
  { href: "/dashboard/lessons", label: "Bài học", id: "lessons", icon: BookOpenCheck },
  { href: "/dashboard/reports", label: "Báo cáo", id: "reports", icon: ChartNoAxesColumnIncreasing },
  { href: "/dashboard/alerts", label: "Cảnh báo", id: "alerts", icon: BellRing },
  { href: "/dashboard/settings", label: "Cài đặt", id: "settings", icon: Settings }
];

const sessionRows = [
  ["Hôm nay", "8 phút", "completed", "Mia giữ nhịp tốt, trẻ phản hồi 11 lượt."],
  ["Hôm qua", "6 phút", "interrupted", "Dừng sớm sau tín hiệu mệt, không có critical alert."],
  ["Thứ hai", "10 phút", "completed", "Hoàn thành lesson cảm xúc vui/buồn."]
];

export function DashboardShell({
  active,
  children,
  eyebrow = "Parent workspace",
  title,
  description,
  actions
}: DashboardShellProps) {
  return (
    <main className="dashboard-shell">
      <input
        aria-label="Thu gọn menu dashboard"
        className="sidebar-collapse-input"
        id="dashboard-sidebar-collapse"
        type="checkbox"
      />
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="dashboard-sidebar-top">
          <a className="dashboard-brand" href="/dashboard">
            <span className="brand-mark">
              <Sparkles size={18} strokeWidth={3} />
            </span>
            <span className="dashboard-brand-text">AgentKid</span>
          </a>
          <label
            aria-label="Thu gọn hoặc mở rộng menu"
            className="sidebar-toggle"
            htmlFor="dashboard-sidebar-collapse"
            role="button"
            tabIndex={0}
          >
            <PanelLeftClose className="collapse-close-icon" size={17} />
            <PanelLeftOpen className="collapse-open-icon" size={17} />
          </label>
        </div>
        <nav className="dashboard-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a className={active === item.id ? "active" : ""} href={item.href} key={item.id}>
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={18} />
          <span>Không lưu raw media. Consent luôn là bước bắt buộc.</span>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="dashboard-actions">
            {actions}
            <a className="dash-button dark" href="/session/demo-child">
              Bắt đầu phiên học
              <ChevronRight size={17} />
            </a>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function StatCard({ label, value, helper, tone = "soft" }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

export function DashboardOverview() {
  return (
    <DashboardShell
      active="overview"
      eyebrow="Mia companion"
      title="Bắt đầu với Mia."
      description="Không gian trò chuyện chính cho phụ huynh và trẻ: nhẹ, rõ nhịp, có kiểm soát consent và luôn ưu tiên an toàn trước automation."
      actions={<a className="dash-button" href="/dashboard/children">Quản lý hồ sơ</a>}
    >
      <section className="chat-first-layout" aria-label="Không gian trò chuyện với Mia">
        <article className="ai-chat-stage">
          <div className="chat-stage-copy">
            <span className="section-kicker">AI session room</span>
            <h2>Mia đang sẵn sàng trò chuyện cùng bé.</h2>
            <p>
              Bắt đầu bằng câu ngắn, giọng chậm và một mục tiêu nhỏ. Phụ huynh vẫn nhìn được
              transcript, tín hiệu cảm xúc và các cảnh báo cần chú ý.
            </p>
          </div>

          <div className="chat-bot-scene" aria-label="Mia bot animation">
            <div className="bot-orbit one" />
            <div className="bot-orbit two" />
            <div className="mia-bot" aria-hidden="true">
              <div className="bot-antenna"><span /></div>
              <div className="bot-head">
                <span className="bot-eye" />
                <span className="bot-eye" />
                <span className="bot-mouth" />
              </div>
              <div className="bot-body">
                <span />
                <span />
              </div>
            </div>
            <div className="bot-shadow" />
          </div>

          <div className="chat-message-stack">
            <div className="chat-bubble mia">
              <span>Mia</span>
              <p>“Mình thử nói chậm lại nhé. Con đang làm rất tốt.”</p>
            </div>
            <div className="chat-bubble parent">
              <span>Phụ huynh</span>
              <p>Hôm nay mình luyện chào hỏi trong 8 phút.</p>
            </div>
          </div>

          <div className="chat-input-shell">
            <Mic size={18} />
            <span>Nhấn để nói với Mia...</span>
            <a href="/session/demo-child">
              Bắt đầu
              <ChevronRight size={16} />
            </a>
          </div>
        </article>

        <aside className="chat-side-rail" aria-label="Điều khiển phiên học">
          <article className="session-status-card">
            <span className="section-kicker">Ready check</span>
            <h3>Phiên hôm nay</h3>
            <div className="status-list">
              <span><CheckCircle2 size={15} /> Mic sẵn sàng</span>
              <span><ShieldCheck size={15} /> Consent active</span>
              <span><LockKeyhole size={15} /> Không lưu raw media</span>
            </div>
          </article>

          <article className="quiet-card">
            <span>Gợi ý nhịp</span>
            <strong>3 bước nhỏ</strong>
            <p>Chào hỏi, gọi tên cảm xúc, rồi chọn một phản hồi phù hợp.</p>
          </article>

          <article className="guardian-mini-card">
            <span>Guardian layer</span>
            <strong>0 critical</strong>
            <p>Warning gửi push. Critical sẽ mở rộng kênh khi đã cấu hình.</p>
          </article>
        </aside>
      </section>

      <section className="compact-dashboard-grid" aria-label="Tổng quan nhanh">
        <StatCard label="Phiên tuần này" value="12" helper="+3 so với tuần trước" tone="dark" />
        <StatCard label="Luyện tập" value="84p" helper="Trung bình 8 phút/phiên" tone="lime" />
        <StatCard label="Bài chờ duyệt" value="4" helper="2 emotion, 1 routine, 1 social" tone="mint" />
        <StatCard label="Critical alerts" value="0" helper="7 ngày gần nhất an toàn" />
      </section>

      <section className="dashboard-split">
        <article className="dashboard-panel large">
          <div className="panel-heading">
            <div>
              <span>Session timeline</span>
              <h2>Tiến bộ gần đây</h2>
            </div>
            <a href="/dashboard/reports">Xem báo cáo</a>
          </div>
          <div className="timeline-chart" aria-label="Progress chart">
            <span style={{ height: "42%" }} />
            <span style={{ height: "66%" }} />
            <span style={{ height: "51%" }} />
            <span style={{ height: "82%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "92%" }} />
            <span style={{ height: "76%" }} />
          </div>
          <div className="session-list">
            {sessionRows.map(([day, length, status, note]) => (
              <div className="session-row" key={day}>
                <strong>{day}</strong>
                <span>{length}</span>
                <em>{status}</em>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel guardian-card">
          <span className="section-kicker">Guardian layer</span>
          <h2>An toàn trước, automation sau.</h2>
          <p>
            Warning gửi push. Critical sẽ mở rộng push + SMS + Zalo nếu đã cấu hình.
          </p>
          <div className="guardian-stack">
            <span><CheckCircle2 size={16} /> Consent active</span>
            <span><CheckCircle2 size={16} /> No raw media</span>
            <span><CircleAlert size={16} /> 1 warning cần xem</span>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}

export function FeatureDashboardPage({
  active,
  eyebrow,
  title,
  description,
  stats,
  hero,
  panels
}: FeaturePageProps) {
  return (
    <DashboardShell active={active} eyebrow={eyebrow} title={title} description={description}>
      <section className="dashboard-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="feature-workspace">
        <article className="workspace-hero">
          <span className="section-kicker">Workspace</span>
          <h2>{hero.title}</h2>
          <p>{hero.copy}</p>
          {hero.ctaHref ? (
            <a className="dash-button dark workspace-cta" href={hero.ctaHref}>
              {hero.ctaLabel ?? "Mở prototype"}
              <ChevronRight size={16} />
            </a>
          ) : null}
          <ul className="workspace-checklist">
            {hero.checklist.map((item) => (
              <li key={item}>
                <CheckCircle2 size={17} />
                {item}
              </li>
            ))}
          </ul>
        </article>
        <div className="workspace-panels">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <article className="mini-panel" key={panel.title}>
                <Icon size={22} />
                <h3>{panel.title}</h3>
                <p>{panel.copy}</p>
                <span>{panel.meta}</span>
              </article>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}

export const dashboardPages = {
  children: {
    active: "children",
    eyebrow: "Child profile",
    title: "Hồ sơ trẻ và cá nhân hóa.",
    description: "Quản lý thông tin, routine, consent và mục tiêu luyện tập cho từng trẻ.",
    stats: [
      { label: "Hồ sơ active", value: "1", helper: "An, 7 tuổi", tone: "dark" as const },
      { label: "Mục tiêu tuần", value: "3", helper: "Emotion, greeting, routine", tone: "lime" as const },
      { label: "Consent", value: "OK", helper: "Mic/camera được duyệt", tone: "mint" as const },
      { label: "Memory facts", value: "18", helper: "Đã trích xuất dài hạn" }
    ],
    hero: {
      title: "Một hồ sơ đủ rõ để Mia nói đúng, nhưng không thu thập quá mức.",
      copy: "Parent profile sở hữu child profile. Mọi session, lesson, memory và alert phải đi qua ownership chain.",
      checklist: ["Routine buổi tối", "Từ vựng đang luyện", "Consent theo thiết bị", "Không lưu raw media"]
    },
    panels: [
      { icon: UserRound, title: "Thông tin trẻ", copy: "Tên gọi, tuổi, condition và sở thích giao tiếp.", meta: "Cập nhật 2 ngày trước" },
      { icon: CalendarDays, title: "Routine", copy: "Lịch luyện tập nhẹ nhàng theo ngày.", meta: "4 slot/tuần" },
      { icon: LockKeyhole, title: "Consent", copy: "Mic, camera, alerting và data retention.", meta: "Đang active" },
      { icon: Brain, title: "Personalization", copy: "Facts dài hạn giúp Mia phản hồi gần gũi hơn.", meta: "18 facts" }
    ]
  },
  session: {
    active: "session",
    eyebrow: "Child session runtime",
    title: "Phiên học voice-first với Mia.",
    description: "Màn hình cho buổi học: mic, camera, emotion signal, transcript và trạng thái session.",
    stats: [
      { label: "Trạng thái", value: "Ready", helper: "Chưa bắt đầu", tone: "dark" as const },
      { label: "Latency target", value: "<3s", helper: "Voice loop MVP", tone: "lime" as const },
      { label: "Camera", value: "Local", helper: "Emotion inference on-device", tone: "mint" as const },
      { label: "Session state", value: "active", helper: "active/completed/interrupted" }
    ],
    hero: {
      title: "Giao diện ít chữ, rõ trạng thái và luôn có đường dừng an toàn.",
      copy: "Session messages là short-term memory; extraction sang long-term chạy async sau khi session kết thúc.",
      checklist: ["Bắt đầu bằng consent", "Mic lớn, dễ bấm", "Transcript live", "Dừng phiên không gây áp lực"],
      ctaHref: "/session/demo-child",
      ctaLabel: "Mở session prototype"
    },
    panels: [
      { icon: Mic, title: "Voice control", copy: "STT, chat và TTS theo lượt ngắn.", meta: "POST /api/conversation/*" },
      { icon: Camera, title: "Emotion events", copy: "Ghi nhận happy/sad/neutral theo thời điểm.", meta: "No raw video" },
      { icon: Clock3, title: "Session timer", copy: "Theo dõi thời lượng và trạng thái kết thúc.", meta: "8 phút target" },
      { icon: FileText, title: "Transcript", copy: "Lưu transcript sau phiên để phụ huynh xem.", meta: "Short-term" }
    ]
  },
  lessons: {
    active: "lessons",
    eyebrow: "Lesson approval",
    title: "Bài học AI cần được phụ huynh duyệt.",
    description: "Tạo, xem, chỉnh, duyệt hoặc từ chối lesson trước khi trẻ học.",
    stats: [
      { label: "Suggested", value: "4", helper: "Đang chờ duyệt", tone: "dark" as const },
      { label: "Approved", value: "9", helper: "Có thể active", tone: "lime" as const },
      { label: "Frameworks", value: "3", helper: "ABA, PECS, Social Stories", tone: "mint" as const },
      { label: "Completed", value: "21", helper: "Từ đầu pilot" }
    ],
    hero: {
      title: "Lesson node chạy được, review được và giải thích được.",
      copy: "Mỗi lesson có nodes, choices, defaultNextNodeId, feedback, emotionTrigger và difficultyAdjust khi cần.",
      checklist: ["Parent approval", "Framework mapping", "Node schema v1", "Không overclaim lâm sàng"]
    },
    panels: [
      { icon: BookOpenCheck, title: "Emotion lesson", copy: "Nhận diện vui/buồn qua tình huống nhỏ.", meta: "suggested" },
      { icon: ShieldCheck, title: "Approval gate", copy: "Phụ huynh chỉnh trước khi active.", meta: "required" },
      { icon: Brain, title: "Generation prompt", copy: "Prompt có giới hạn safety và tone Mia.", meta: "reviewed" },
      { icon: ChartNoAxesColumnIncreasing, title: "Difficulty", copy: "Điều chỉnh theo phản hồi phiên trước.", meta: "adaptive" }
    ]
  },
  reports: {
    active: "reports",
    eyebrow: "Reporting",
    title: "Báo cáo tiến bộ dễ đọc.",
    description: "Tổng hợp session, emotion timeline, score, transcript và AI notes cho phụ huynh.",
    stats: [
      { label: "Engagement", value: "76%", helper: "7 ngày gần nhất", tone: "dark" as const },
      { label: "Neutral/happy", value: "68%", helper: "Emotion trend", tone: "lime" as const },
      { label: "Avg session", value: "8m", helper: "Không quá tải", tone: "mint" as const },
      { label: "Notes", value: "14", helper: "AI summaries" }
    ],
    hero: {
      title: "Dashboard nói bằng insight, không ném số liệu vào mặt phụ huynh.",
      copy: "Báo cáo ưu tiên câu hỏi: hôm nay bé đã tương tác ra sao, điều gì nên thử tiếp, và có rủi ro nào không.",
      checklist: ["Transcript summary", "Emotion timeline", "Progress score", "Next action nhỏ"]
    },
    panels: [
      { icon: ChartNoAxesColumnIncreasing, title: "Progress graph", copy: "Trend theo tuần, không dùng label nặng nề.", meta: "weekly" },
      { icon: FileText, title: "AI notes", copy: "Tóm tắt ngắn sau mỗi session.", meta: "parent-facing" },
      { icon: BellRing, title: "Alert summary", copy: "Warning/critical theo lịch sử.", meta: "auditable" },
      { icon: CalendarDays, title: "Routine streak", copy: "Theo dõi thói quen luyện tập.", meta: "gentle" }
    ]
  },
  alerts: {
    active: "alerts",
    eyebrow: "Alerting",
    title: "Guardian alerts có severity rõ ràng.",
    description: "Theo dõi warning/critical, kênh gửi và trạng thái acknowledge.",
    stats: [
      { label: "Warning", value: "1", helper: "Cần xem hôm nay", tone: "dark" as const },
      { label: "Critical", value: "0", helper: "7 ngày gần nhất", tone: "lime" as const },
      { label: "Channels", value: "3", helper: "Push, SMS, Zalo", tone: "mint" as const },
      { label: "Ack rate", value: "100%", helper: "Pilot parent" }
    ],
    hero: {
      title: "Cảnh báo phải đủ nhanh, đủ ít và không tiết lộ quá mức.",
      copy: "Warning ưu tiên push. Critical có thể mở rộng push + SMS + Zalo nếu provider và consent available.",
      checklist: ["Severity rules", "Delivery status", "Acknowledge flow", "PII tối thiểu"]
    },
    panels: [
      { icon: CircleAlert, title: "Warning event", copy: "Trẻ dừng sớm sau tín hiệu mệt.", meta: "push only" },
      { icon: BellRing, title: "Escalation", copy: "Critical route kiểm tra provider fallback.", meta: "push + SMS" },
      { icon: ShieldCheck, title: "Audit trail", copy: "Ai nhận, khi nào, kênh nào.", meta: "required" },
      { icon: LockKeyhole, title: "PII guard", copy: "Alert không chứa transcript nhạy cảm.", meta: "privacy" }
    ]
  },
  settings: {
    active: "settings",
    eyebrow: "Settings & privacy",
    title: "Cài đặt consent, dữ liệu và provider.",
    description: "Quản lý privacy baseline, thông báo, thiết bị và thông tin tài khoản phụ huynh.",
    stats: [
      { label: "Raw media", value: "Off", helper: "Baseline MVP", tone: "dark" as const },
      { label: "Push", value: "On", helper: "Warning channel", tone: "lime" as const },
      { label: "SMS/Zalo", value: "Draft", helper: "Chưa bật pilot", tone: "mint" as const },
      { label: "Data export", value: "Ready", helper: "Parent request" }
    ],
    hero: {
      title: "Privacy không nằm trong footer. Nó là một phần của workflow.",
      copy: "Mọi thay đổi liên quan media, alert, retention hoặc provider cần được thể hiện rõ trong settings.",
      checklist: ["Consent review", "No raw media", "Provider secrets hidden", "Parent data export"]
    },
    panels: [
      { icon: LockKeyhole, title: "Data retention", copy: "Transcript, events, score và metadata.", meta: "baseline" },
      { icon: BellRing, title: "Notifications", copy: "Kênh warning/critical theo consent.", meta: "configurable" },
      { icon: Camera, title: "Device permissions", copy: "Mic/camera theo thiết bị.", meta: "browser-bound" },
      { icon: Settings, title: "Provider status", copy: "Google, SMS, Zalo, Web Push.", meta: "ops" }
    ]
  }
};
