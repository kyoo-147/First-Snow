import { CalendarCheck, HeartHandshake, Mail, ShieldCheck } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function ContactPage() {
  return (
    <DetailPage
      eyebrow="Liên hệ"
      title="Nếu bạn đang xây pilot cho trẻ, hãy bắt đầu bằng một cuộc nói chuyện cẩn thận."
      lead="AgentKid phù hợp cho phụ huynh, chuyên gia giáo dục đặc biệt và đối tác muốn thử nghiệm AI companion có guardrails rõ ràng."
      primaryCta={{ label: "Gửi email", href: "mailto:hello@agentkid.io.vn" }}
      secondaryCta={{ label: "Xem pilot", href: "/pilot" }}
      highlights={[
        {
          icon: Mail,
          title: "Pilot waitlist",
          copy: "Đăng ký quan tâm, mô tả độ tuổi của trẻ và thiết bị dự kiến dùng tại nhà."
        },
        {
          icon: HeartHandshake,
          title: "Expert feedback",
          copy: "AgentKid cần phản hồi từ phụ huynh và chuyên gia để chỉnh lesson và safety language."
        },
        {
          icon: CalendarCheck,
          title: "Demo có giới hạn",
          copy: "Demo nên tập trung vào flow chính, không overpromise tính năng chưa được test."
        },
        {
          icon: ShieldCheck,
          title: "Privacy-first intake",
          copy: "Không yêu cầu thông tin nhạy cảm của trẻ trong bước liên hệ ban đầu."
        }
      ]}
      sections={[
        {
          title: "Nên gửi thông tin gì",
          copy: "Bước liên hệ nên nhẹ nhàng và tránh thu thập PII không cần thiết.",
          bullets: [
            "Mục tiêu bạn muốn AgentKid hỗ trợ",
            "Nhóm tuổi và thiết bị dự kiến dùng",
            "Bạn là phụ huynh, chuyên gia hay đối tác"
          ]
        },
        {
          title: "AgentKid sẽ phản hồi thế nào",
          copy: "Phản hồi nên tập trung vào fit pilot, expectation và điều kiện an toàn.",
          bullets: [
            "Làm rõ sản phẩm không thay thế trị liệu",
            "Thỏa thuận điều kiện consent trước khi test",
            "Chọn luồng demo phù hợp với trẻ và gia đình"
          ]
        }
      ]}
    />
  );
}
