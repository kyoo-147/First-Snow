import { BellRing, LockKeyhole, ShieldCheck, VideoOff } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function SafetyPage() {
  return (
    <DetailPage
      eyebrow="Privacy và safety"
      title="Thiết kế cho trẻ em bắt đầu bằng việc biết điều gì không nên lưu."
      lead="AgentKid đặt baseline riêng tư rõ: consent trước media, không lưu raw video/audio trong MVP, cảnh báo có severity và audit trail."
      primaryCta={{ label: "Đọc product", href: "/product" }}
      secondaryCta={{ label: "Liên hệ pilot", href: "/contact" }}
      highlights={[
        {
          icon: ShieldCheck,
          title: "Consent by default",
          copy: "Mic, camera, profile và alerting đều cần permission rõ ràng theo ngữ cảnh."
        },
        {
          icon: VideoOff,
          title: "No raw media baseline",
          copy: "Video/audio thô không được lưu nếu chưa có architectural decision mới."
        },
        {
          icon: LockKeyhole,
          title: "Ownership chain",
          copy: "Mỗi child, session, lesson và alert cần được ràng buộc vào đúng parent account."
        },
        {
          icon: BellRing,
          title: "Escalation rules",
          copy: "Warning ưu tiên push; critical có thể mở rộng push, SMS và Zalo nếu available."
        }
      ]}
      sections={[
        {
          title: "Dữ liệu được phép lưu",
          copy: "Baseline MVP ưu tiên dữ liệu đã xử lý thay vì media thô.",
          bullets: [
            "Transcript, emotion events, score, AI notes",
            "Lesson metadata và approval state",
            "Alert history và delivery status cần thiết"
          ]
        },
        {
          title: "Boundary không được vượt",
          copy: "Mỗi tính năng mới cần review privacy trước khi thêm vào flow của trẻ.",
          bullets: [
            "Không ghi log PII hoặc nội dung nhạy cảm",
            "Không gửi alert với chi tiết vượt mức cần thiết",
            "Không biến AI thành người thay thế trị liệu"
          ]
        }
      ]}
    />
  );
}
