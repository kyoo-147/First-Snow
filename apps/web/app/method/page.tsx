import { BookOpenCheck, GitBranch, HeartHandshake, Sparkles } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function MethodPage() {
  return (
    <DetailPage
      eyebrow="Phương pháp"
      title="Bài học phải có cấu trúc, nhưng trải nghiệm phải mềm mại."
      lead="AgentKid dùng ABA, PECS và Social Stories như framework tham chiếu để tạo lesson nodes chạy được, duyệt được và giải thích được."
      primaryCta={{ label: "Xem lesson flow", href: "/product" }}
      secondaryCta={{ label: "Xem dashboard", href: "/parents" }}
      highlights={[
        {
          icon: HeartHandshake,
          title: "ABA-inspired",
          copy: "Chia nhỏ hành vi, phản hồi rõ, reinforce đúng lúc và tránh quá tải."
        },
        {
          icon: BookOpenCheck,
          title: "PECS-aware",
          copy: "Hỗ trợ lựa chọn bằng hình/nhãn, câu ngắn và ý định giao tiếp rõ ràng."
        },
        {
          icon: Sparkles,
          title: "Social Stories",
          copy: "Kể chuyện tình huống đời thường để trẻ tập dự đoán và diễn tập phản ứng."
        },
        {
          icon: GitBranch,
          title: "Node schema",
          copy: "Lesson được chạy bằng node có choices, fallback, feedback và difficulty adjust."
        }
      ]}
      sections={[
        {
          title: "Nguyên tắc lesson",
          copy: "AI có thể tạo gợi ý, nhưng sản phẩm cần giữ lesson được kiểm soát và review được.",
          bullets: [
            "Mỗi lesson có mục tiêu nhỏ và có thể quan sát",
            "Choices rõ ràng, không đưa trẻ vào tình huống mơ hồ",
            "Feedback ngắn, tích cực và gắn với hành vi cụ thể"
          ]
        },
        {
          title: "Giới hạn phương pháp",
          copy: "Framework trong AgentKid là tham chiếu implementation, không phải cam kết can thiệp lâm sàng.",
          bullets: [
            "Cần phụ huynh hoặc chuyên gia review nội dung quan trọng",
            "Không dùng lesson để chẩn đoán hay gắn nhãn trẻ",
            "Nếu trẻ căng thẳng, session cần có đường dừng an toàn"
          ]
        }
      ]}
    />
  );
}
