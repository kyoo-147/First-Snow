import { ArrowRight, CheckCircle2, LucideIcon, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "./site-chrome";

type DetailPageProps = {
  eyebrow: string;
  title: string;
  lead: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  highlights: Array<{
    icon: LucideIcon;
    title: string;
    copy: string;
  }>;
  sections: Array<{
    title: string;
    copy: string;
    bullets: string[];
  }>;
};

export function DetailPage({
  eyebrow,
  title,
  lead,
  primaryCta,
  secondaryCta,
  highlights,
  sections
}: DetailPageProps) {
  const firstHighlight = highlights[0];
  const secondHighlight = highlights[1] ?? highlights[0];
  const controlPoints = sections.flatMap((section) => section.bullets).slice(0, 5);

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="subpage-hero">
        <div className="subpage-hero-inner subpage-hero-grid">
          <div className="subpage-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{lead}</p>
            {(primaryCta || secondaryCta) && (
              <div className="cta-row subpage-cta">
                {primaryCta && (
                  <a className="button-primary" href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight size={18} />
                  </a>
                )}
                {secondaryCta && (
                  <a className="button-quiet" href={secondaryCta.href}>
                    {secondaryCta.label}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="subpage-visual" aria-label={`Minh họa ${eyebrow}`}>
            <div className="subpage-orbit-card main">
              <span className="badge">
                <Sparkles size={14} />
                AgentKid layer
              </span>
              <h2>{firstHighlight.title}</h2>
              <p>{firstHighlight.copy}</p>
            </div>
            <div className="subpage-orbit-card side">
              <strong>{secondHighlight.title}</strong>
              <span>{secondHighlight.copy}</span>
            </div>
            <div className="subpage-orbit-card mini">
              <span>Phụ huynh giữ quyền kiểm soát</span>
            </div>
          </div>
        </div>

        <div className="subpage-index" aria-label="Điểm chính của trang">
          {highlights.slice(0, 4).map((item) => (
            <a href={`#${slugify(item.title)}`} key={item.title}>
              {item.title}
            </a>
          ))}
        </div>
      </section>

      <section className="section subpage-feature-section">
        <div className="section-inner">
          <span className="section-kicker">Tổng quan</span>
          <h2>Những phần quan trọng cần hiểu trước khi triển khai.</h2>
          <div className="subpage-feature-grid">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article className="feature-card" id={slugify(item.title)} key={item.title}>
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

      <section className="section content-band">
        <div className="section-inner">
          <span className="section-kicker">Chi tiết thiết kế</span>
          <h2>Trang này không chỉ mô tả tính năng, mà còn chốt cách vận hành đúng.</h2>
          <div className="subpage-layout">
            {sections.map((section) => (
              <article className="content-card" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
                <ul className="detail-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>
                      <CheckCircle2 size={18} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section subpage-control-section">
        <div className="section-inner subpage-control-card">
          <div>
            <span className="section-kicker">Guardrails</span>
            <h2>Những điểm không được bỏ qua khi build.</h2>
            <p>
              Mỗi trang con đều gắn với một nhóm quyết định sản phẩm. Khi triển
              khai code sau này, các guardrails này giúp AI và engineer không đi
              lệch khỏi hướng an toàn, rõ ràng và có thể mở rộng.
            </p>
          </div>
          <ul className="control-list">
            {controlPoints.map((point) => (
              <li key={point}>
                <CheckCircle2 size={18} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section subpage-next-section">
        <div className="section-inner subpage-next-grid">
          <a className="next-card" href="/product">
            <span>Sản phẩm</span>
            <strong>Hiểu hệ thống AgentKid</strong>
          </a>
          <a className="next-card" href="/safety">
            <span>An toàn</span>
            <strong>Kiểm tra consent và privacy</strong>
          </a>
          <a className="next-card" href="/pilot">
            <span>Pilot</span>
            <strong>Xem tiêu chí sẵn sàng</strong>
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
