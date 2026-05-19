import { BellRing, BookOpenCheck, Brain, Mic } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function ProductPage() {
  return (
    <DetailPage
      eyebrow="Sản phẩm"
      title="Một assistant nhỏ, một hệ thống học lớn phía sau."
      lead="AgentKid kết hợp voice session, memory, lesson engine và guardian alerts để tạo ra môi trường luyện tập tiếng Việt an toàn cho trẻ."
      primaryCta={{ label: "Xem pilot", href: "/pilot" }}
      secondaryCta={{ label: "Đọc về an toàn", href: "/safety" }}
      highlights={[
        {
          icon: Mic,
          title: "Voice-first session",
          copy: "Trẻ nói với Mia bằng tiếng Việt; giao diện giảm chữ, nút lớn, phản hồi ngắn."
        },
        {
          icon: Brain,
          title: "Memory có kiểm soát",
          copy: "Session message là short-term; facts được trích xuất async sau buổi học nếu được phép."
        },
        {
          icon: BookOpenCheck,
          title: "Lesson engine",
          copy: "Bài học được gợi ý theo ABA, PECS, Social Stories và cần được phụ huynh duyệt."
        },
        {
          icon: BellRing,
          title: "Guardian alerts",
          copy: "Rủi ro được phân loại warning hoặc critical, rồi gửi qua kênh phù hợp."
        }
      ]}
      sections={[
        {
          title: "AgentKid làm gì",
          copy: "Sản phẩm là lớp hỗ trợ luyện tập tại nhà, không thay thế nhà chuyên môn hay trị liệu.",
          bullets: [
            "Hỗ trợ luyện giao tiếp ngắn, lặp lại và thân thiện",
            "Ghi nhận transcript, emotion events, score và AI notes",
            "Trả lại dashboard rõ ràng để phụ huynh xem lại"
          ]
        },
        {
          title: "AgentKid không làm gì",
          copy: "MVP cần đặt kỳ vọng đúng để tránh overclaim và tránh rủi ro về trẻ em.",
          bullets: [
            "Không chẩn đoán hay đưa kết luận y khoa",
            "Không lưu raw video/audio trong baseline hiện tại",
            "Không kích hoạt bài học AI nếu chưa có parent approval"
          ]
        }
      ]}
    />
  );
}
