import { Gauge, Laptop, ListChecks, Users } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function PilotPage() {
  return (
    <DetailPage
      eyebrow="Pilot readiness"
      title="Pilot chỉ nên bắt đầu khi sản phẩm dễ hiểu, an toàn và có thể đo được."
      lead="Giai đoạn pilot của AgentKid tập trung vào chất lượng session, mức độ trẻ chấp nhận Mia và việc dashboard có thật sự hữu ích với phụ huynh không."
      primaryCta={{ label: "Liên hệ tham gia", href: "/contact" }}
      secondaryCta={{ label: "Xem safety", href: "/safety" }}
      highlights={[
        {
          icon: Users,
          title: "Nhóm dùng thử nhỏ",
          copy: "Phụ huynh và trẻ 6-10 tuổi trong phạm vi có thể hỗ trợ sát, không mở rộng đại trà quá sớm."
        },
        {
          icon: Laptop,
          title: "Device matrix",
          copy: "Cần test desktop, tablet và iOS Safari vì media permission là rủi ro lớn."
        },
        {
          icon: Gauge,
          title: "Latency budget",
          copy: "Voice loop cần đủ nhanh để trẻ không mất tập trung; việc nặng nên đưa sang worker."
        },
        {
          icon: ListChecks,
          title: "Manual validation",
          copy: "Mỗi build pilot cần có checklist về consent, alert, lesson approval và fallback."
        }
      ]}
      sections={[
        {
          title: "Tiêu chí sẵn sàng",
          copy: "Pilot readiness không chỉ là chạy được; nó phải đủ an toàn để phụ huynh tin dùng.",
          bullets: [
            "Session create, active, completed, interrupted hoạt động rõ",
            "Dashboard hiện transcript và insight sau session",
            "Không có luồng nào lưu raw media ngoài baseline"
          ]
        },
        {
          title: "Rủi ro cần theo dõi",
          copy: "Các rủi ro này nên được nói thẳng với stakeholder để tránh kỳ vọng sai.",
          bullets: [
            "iOS Safari media permission và audio playback",
            "Face emotion inference phụ thuộc ánh sáng",
            "Zalo approval và provider delivery reliability"
          ]
        }
      ]}
    />
  );
}
