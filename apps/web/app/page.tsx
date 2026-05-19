import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  Brain,
  Camera,
  CheckCircle2,
  HeartHandshake,
  LockKeyhole,
  Mic,
  PauseCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { SiteFooter, SiteHeader } from "./_components/site-chrome";

const trustPoints = [
  "Không lưu raw video/audio trong baseline MVP",
  "Bài học AI cần phụ huynh duyệt trước",
  "Thiết kế Vietnamese-first cho trẻ 6-10 tuổi",
  "Không thay thế trị liệu chuyên nghiệp"
];

const productFlow = [
  {
    icon: Mic,
    title: "Bé nói với Mia",
    copy: "Giao diện ít chữ, nút lớn, câu hỏi ngắn và nhịp tương tác đủ chậm để trẻ không bị quá tải."
  },
  {
    icon: Brain,
    title: "Mia phản hồi theo ngữ cảnh",
    copy: "AI dùng transcript, trạng thái cảm xúc và mục tiêu bài học để trả lời ngắn, ấm và có cấu trúc."
  },
  {
    icon: TrendingUp,
    title: "Phụ huynh xem lại tiến bộ",
    copy: "Dashboard gom transcript, timeline cảm xúc, điểm buổi học, AI notes và gợi ý bước tiếp theo."
  }
];

const modules = [
  {
    icon: HeartHandshake,
    title: "Companion tiếng Việt",
    copy: "Mia nói bằng câu ngắn, khen đúng lúc và luôn giữ giọng điệu khích lệ cho trẻ."
  },
  {
    icon: Camera,
    title: "Emotion insight riêng tư",
    copy: "Camera chỉ phục vụ suy luận cảm xúc tại thời điểm học; baseline không lưu video thô."
  },
  {
    icon: BookOpenCheck,
    title: "Lesson engine có duyệt",
    copy: "AI gợi ý bài học theo ABA, PECS và Social Stories, nhưng phụ huynh là người bật bài học."
  },
  {
    icon: BellRing,
    title: "Guardian alerts",
    copy: "Tín hiệu rủi ro được phân loại warning/critical và gửi qua kênh phù hợp khi đã cấu hình."
  }
];

const pages = [
  ["/product", "Sản phẩm", "Voice session, memory, lesson engine và guardian layer"],
  ["/parents", "Cho phụ huynh", "Dashboard, báo cáo, duyệt bài học và theo dõi tiến bộ"],
  ["/safety", "An toàn", "Consent, privacy, alerting và no raw media storage"],
  ["/method", "Phương pháp", "ABA, PECS, Social Stories và giới hạn sản phẩm"],
  ["/pilot", "Pilot", "Lộ trình MVP, thiết bị test và tiêu chí sẵn sàng"],
  ["/contact", "Liên hệ", "Danh sách pilot và trao đổi với đối tác chuyên môn"]
];

const faqs = [
  [
    "AgentKid có thay thế chuyên gia trị liệu không?",
    "Không. AgentKid là công cụ hỗ trợ luyện tập tại nhà, giúp phụ huynh có thêm dữ liệu và hoạt động có cấu trúc."
  ],
  [
    "Mia có lưu video hoặc audio của trẻ không?",
    "Baseline MVP không lưu raw video/audio. Hệ thống chỉ lưu transcript, emotion events, score, AI notes và metadata cần thiết."
  ],
  [
    "Bài học AI có tự chạy ngay không?",
    "Không nên. Bài học được AI gợi ý nhưng cần phụ huynh duyệt trước khi chuyển sang trạng thái active."
  ],
  [
    "Trang này dành cho ai?",
    "Phụ huynh, chuyên gia giáo dục đặc biệt và đối tác muốn hiểu hướng sản phẩm trước giai đoạn pilot."
  ]
];

function MiaCard() {
  return (
    <div className="hero-card hero-card-primary" aria-label="Minh họa phiên học với Mia">
      <div className="panel-top">
        <span>Phiên học của bé</span>
        <span className="badge">
          <Mic size={14} />
          Đang nghe
        </span>
      </div>
      <div className="mia-avatar" aria-hidden="true">
        <div className="mia-hair" />
        <div className="mia-eyes">
          <span />
          <span />
        </div>
        <div className="mia-smile" />
      </div>
      <div className="speech-bubble">
        "Mình thử nói chậm lại nhé. Con đang làm rất tốt."
      </div>
      <div className="soft-meter">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ParentCard() {
  return (
    <div className="hero-card hero-card-secondary" aria-label="Minh họa dashboard phụ huynh">
      <div className="panel-top">
        <span>Dashboard phụ huynh</span>
        <span className="badge">
          <ShieldCheck size={14} />
          Consent
        </span>
      </div>
      <div className="dashboard-lines">
        <div>
          <strong>Transcript</strong>
          <span>8 phút luyện tập</span>
        </div>
        <div>
          <strong>Cảm xúc</strong>
          <span>ổn định hơn cuối phiên</span>
        </div>
        <div>
          <strong>Bài học</strong>
          <span>2 gợi ý chờ duyệt</span>
        </div>
      </div>
    </div>
  );
}

function RobotCompanion() {
  return (
    <div className="robot-companion" aria-label="Animated robot companion">
      <div className="robot-antenna" />
      <div className="robot-head">
        <span className="robot-eye" />
        <span className="robot-eye" />
        <span className="robot-mouth" />
      </div>
      <div className="robot-body">
        <span />
        <span />
      </div>
      <div className="robot-shadow" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy-block">
            <span className="eyebrow">AI companion tiếng Việt cho luyện tập tại nhà</span>
            <h1>Mia giúp bé tập giao tiếp trong một không gian an toàn.</h1>
            <p className="hero-lead">
              AgentKid kết hợp voice AI, bài học có cấu trúc và dashboard cho
              phụ huynh để hỗ trợ trẻ ASD hoặc chậm ngôn ngữ từ 6-10 tuổi.
            </p>
            <div className="cta-row">
              <a className="button-primary" href="/pilot">
                Đăng ký pilot
                <ArrowRight size={18} />
              </a>
              <a className="button-quiet" href="/safety">
                <ShieldCheck size={18} />
                Xem lớp an toàn
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <RobotCompanion />
            <MiaCard />
            <ParentCard />
            <div className="privacy-note">
              <LockKeyhole size={18} />
              <span>Không lưu raw media. Phụ huynh luôn giữ quyền kiểm soát.</span>
            </div>
          </div>
        </div>

        <div className="trust-strip" aria-label="Cam kết cốt lõi">
          {trustPoints.map((point) => (
            <div className="trust-pill" key={point}>
              <CheckCircle2 size={18} />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section problem-section">
        <div className="section-inner two-column">
          <div>
            <span className="section-kicker">Vấn đề thật</span>
            <h2>Ở nhà, phụ huynh cần một cách luyện tập nhẹ nhàng hơn.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Nhiều trẻ cần lặp lại những tình huống giao tiếp nhỏ mỗi ngày,
              nhưng phụ huynh thường thiếu công cụ có cấu trúc, có ghi nhận tiến
              bộ và không tạo thêm áp lực cho trẻ.
            </p>
            <p>
              AgentKid không cố biến AI thành chuyên gia trị liệu. Sản phẩm tập
              trung vào một phạm vi rõ: luyện tập giao tiếp ngắn, quan sát an
              toàn và giúp phụ huynh hiểu buổi học vừa diễn ra.
            </p>
          </div>
        </div>
      </section>

      <section className="section story-band">
        <div className="section-inner">
          <span className="section-kicker">Product flow</span>
          <h2>Một buổi học được thiết kế để trẻ không bị quá tải.</h2>
          <div className="journey">
            {productFlow.map((item, index) => {
              const Icon = item.icon;
              return (
                <article className="journey-card" key={item.title}>
                  <span className="step-number">0{index + 1}</span>
                  <div className="card-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-copy">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <span className="section-kicker">Core modules</span>
          <h2>Không chỉ là chat. Đây là hệ thống học và quan sát có kiểm soát.</h2>
          <p className="section-lead">
            Kiến trúc sản phẩm được chia theo domain để dễ scale: conversation,
            emotion, memory, lesson, alerting và reporting.
          </p>
          <div className="feature-grid">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <article className="feature-card" key={item.title}>
                  <div className="card-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-copy">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section parent-child-section">
        <div className="section-inner split-showcase">
          <article className="showcase-card child-card">
            <span className="section-kicker">Cho trẻ</span>
            <h2>Một người bạn nhỏ biết chờ, biết khen và biết dừng.</h2>
            <p>
              Child-facing UI dùng ít lựa chọn, không ép trẻ đọc nhiều và luôn
              có đường dừng khi trẻ mệt hoặc mất tập trung.
            </p>
            <ul className="detail-list">
              <li><PauseCircle size={18} /> Phiên học có trạng thái active, completed, interrupted.</li>
              <li><Sparkles size={18} /> Phản hồi ngắn, tích cực và có nhịp.</li>
              <li><ShieldCheck size={18} /> Tránh nội dung gây sợ, gây xấu hổ hoặc quá tải.</li>
            </ul>
          </article>

          <article className="showcase-card parent-card">
            <span className="section-kicker">Cho phụ huynh</span>
            <h2>Dashboard nói bằng insight, không ném số liệu vào mặt người dùng.</h2>
            <p>
              Phụ huynh cần biết hôm nay bé đã tương tác ra sao, điều gì nên thử
              tiếp và bài học nào cần duyệt.
            </p>
            <ul className="detail-list">
              <li><TrendingUp size={18} /> Timeline cảm xúc và score sau phiên.</li>
              <li><BookOpenCheck size={18} /> Lesson approval trước khi trẻ học.</li>
              <li><BellRing size={18} /> Alert có severity và lịch sử gửi.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section method-section">
        <div className="section-inner two-column">
          <div>
            <span className="section-kicker">Phương pháp</span>
            <h2>Bài học có cấu trúc, nhưng trải nghiệm phải mềm mại.</h2>
          </div>
          <div className="method-list">
            <article>
              <strong>ABA-inspired</strong>
              <span>Chia nhỏ hành vi, reinforcement đúng lúc, mục tiêu quan sát được.</span>
            </article>
            <article>
              <strong>PECS-aware</strong>
              <span>Hỗ trợ lựa chọn rõ ràng, câu ngắn và ý định giao tiếp cụ thể.</span>
            </article>
            <article>
              <strong>Social Stories</strong>
              <span>Dùng tình huống đời thường để trẻ tập dự đoán và diễn tập phản ứng.</span>
            </article>
          </div>
        </div>
      </section>

      <section className="section safety-section">
        <div className="section-inner safety-layout">
          <div>
            <span className="section-kicker">Safety first</span>
            <h2>Dữ liệu của trẻ cần được thiết kế bằng sự tiết chế.</h2>
            <p className="section-lead">
              Baseline riêng tư của AgentKid ưu tiên consent, dữ liệu tối thiểu
              và ranh giới rõ giữa hỗ trợ tại nhà với trị liệu chuyên nghiệp.
            </p>
          </div>
          <ul className="safety-list">
            <li>Consent trước khi dùng mic và camera</li>
            <li>Không lưu raw video/audio trong MVP</li>
            <li>Bài học AI phải được phụ huynh duyệt</li>
            <li>Cảnh báo có severity và audit trail</li>
          </ul>
        </div>
      </section>

      <section className="section page-map">
        <div className="section-inner">
          <span className="section-kicker">Site map</span>
          <h2>Các trang con đã được tổ chức theo hành trình tìm hiểu sản phẩm.</h2>
          <div className="page-grid">
            {pages.map(([href, title, copy]) => (
              <a className="page-card" href={href} key={href}>
                <h3 className="card-title">{title}</h3>
                <p className="card-copy">{copy}</p>
                <span className="badge">Mở trang</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section pilot-section">
        <div className="section-inner pilot-card">
          <div>
            <span className="section-kicker">Pilot readiness</span>
            <h2>Trước khi pilot, sản phẩm phải chứng minh được sự an toàn và dễ hiểu.</h2>
          </div>
          <div className="pilot-checks">
            <span>Browser/device matrix</span>
            <span>Latency budget cho voice loop</span>
            <span>Manual validation cho consent</span>
            <span>Fallback khi provider lỗi</span>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-inner">
          <span className="section-kicker">FAQ</span>
          <h2>Những câu hỏi cần trả lời trước khi phụ huynh tin dùng.</h2>
          <div className="faq-grid">
            {faqs.map(([question, answer]) => (
              <article className="faq-card" key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="section-inner final-cta-inner">
          <span className="eyebrow">Xây dựng AI cho trẻ em phải chậm, chắc và tử tế.</span>
          <h2>Bắt đầu bằng một pilot nhỏ, có phụ huynh đồng hành và guardrails rõ ràng.</h2>
          <div className="cta-row">
            <a className="button-primary" href="mailto:hello@agentkid.io.vn">
              Liên hệ tham gia pilot
              <ArrowRight size={18} />
            </a>
            <a className="button-secondary" href="/product">
              Xem sản phẩm
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
