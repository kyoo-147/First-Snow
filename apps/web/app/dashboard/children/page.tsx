import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import { DashboardShell, StatCard } from "../_components/dashboard-shell";

const safeProfileFields = [
  ["Tên gọi trong phiên", "An"],
  ["Độ tuổi", "7 tuổi"],
  ["Condition", "ASD + chậm ngôn ngữ"],
  ["Nhịp phù hợp", "Câu ngắn, chờ 4-6 giây"],
  ["Sở thích", "Xe buýt, màu xanh lá, sticker"],
  ["Từ đang luyện", "chào hỏi, vui/buồn, xin nghỉ"]
];

const goals = [
  "Chào hỏi bằng một câu ngắn",
  "Gọi tên cảm xúc vui/buồn",
  "Biết xin nghỉ khi mệt"
];

export default function ChildrenPage() {
  return (
    <DashboardShell
      active="children"
      eyebrow="Child profile"
      title="Hồ sơ trẻ là trung tâm của mọi phiên học."
      description="Mỗi child profile thuộc về một parent profile. Session, lesson, memory và alert đều phải đi qua ownership chain này trước khi đọc hoặc ghi dữ liệu."
      actions={<a className="dash-button" href="/dashboard/settings">Xem consent</a>}
    >
      <section className="child-profile-layout">
        <article className="child-hero-card">
          <div>
            <span className="section-kicker">Active child</span>
            <h2>An, 7 tuổi</h2>
            <p>
              Hồ sơ prototype dùng để kiểm tra luồng cá nhân hóa, consent và entry point vào phiên học.
              Production CRUD sẽ nối sau khi API children và DB server sẵn sàng.
            </p>
          </div>
          <div className="child-avatar-card" aria-hidden="true">
            <span className="child-avatar-face">
              <span />
            </span>
            <strong>Mia nói chậm, ít chữ</strong>
          </div>
          <div className="child-action-row">
            <a className="dash-button dark" href="/session/demo-child">
              <Mic size={17} />
              Bắt đầu phiên của An
              <ChevronRight size={16} />
            </a>
            <a className="dash-button" href="/dashboard/lessons">
              <BookOpenCheck size={17} />
              Xem bài học chờ duyệt
            </a>
          </div>
        </article>

        <aside className="child-ownership-card">
          <span className="section-kicker">Ownership chain</span>
          <h3>auth subject → parent profile → child</h3>
          <div className="ownership-steps">
            <span><ShieldCheck size={16} /> prototype:parent@agentkid.local</span>
            <span><UserRound size={16} /> ParentProfile.users.id</span>
            <span><Sparkles size={16} /> children.id = demo-child</span>
          </div>
          <p>Không route nào được đọc session/lesson/alert nếu không chứng minh được child thuộc parent hiện tại.</p>
        </aside>
      </section>

      <section className="compact-dashboard-grid" aria-label="Child profile status">
        <StatCard label="Hồ sơ active" value="1" helper="An, 7 tuổi" tone="dark" />
        <StatCard label="Mục tiêu tuần" value="3" helper="Greeting, emotion, routine" tone="lime" />
        <StatCard label="Consent" value="OK" helper="Media cần xác nhận mỗi phiên" tone="mint" />
        <StatCard label="Memory facts" value="18" helper="Chờ runtime persistence" />
      </section>

      <section className="child-profile-grid">
        <article className="child-detail-panel">
          <div className="panel-heading">
            <div>
              <span>Safe personalization</span>
              <h2>Thông tin đủ dùng, không thu thập quá mức.</h2>
            </div>
          </div>
          <div className="profile-field-grid">
            {safeProfileFields.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="child-detail-panel">
          <div className="panel-heading">
            <div>
              <span>Weekly goals</span>
              <h2>Mục tiêu nhỏ để trẻ không bị quá tải.</h2>
            </div>
          </div>
          <div className="goal-stack">
            {goals.map((goal) => (
              <span key={goal}>
                <CheckCircle2 size={17} />
                {goal}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="child-safety-grid">
        <article>
          <LockKeyhole size={22} />
          <h3>Consent theo ngữ cảnh</h3>
          <p>Mic/camera vẫn phải được xác nhận trong phiên. Hồ sơ không tự động bật media.</p>
        </article>
        <article>
          <HeartHandshake size={22} />
          <h3>Child-facing tone</h3>
          <p>Mia dùng câu ngắn, khích lệ, không chẩn đoán và không tạo áp lực thành tích.</p>
        </article>
        <article>
          <CalendarDays size={22} />
          <h3>Routine nhẹ</h3>
          <p>Ưu tiên phiên ngắn 6-10 phút và cho phép dừng nhẹ nhàng khi trẻ mệt.</p>
        </article>
      </section>
    </DashboardShell>
  );
}
