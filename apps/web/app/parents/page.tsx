import { BarChart3, CheckSquare, FileText, Users } from "lucide-react";
import { DetailPage } from "../_components/detail-page";

export default function ParentsPage() {
  return (
    <DetailPage
      eyebrow="Cho phụ huynh"
      title="Phụ huynh không cần đoán. Mỗi buổi học có dấu vết để xem lại."
      lead="Dashboard được thiết kế để phụ huynh nắm được tiến bộ, duyệt bài học và điều chỉnh kỳ vọng mà không bị ngợp bởi số liệu."
      primaryCta={{ label: "Đăng ký pilot", href: "/pilot" }}
      secondaryCta={{ label: "Xem sản phẩm", href: "/product" }}
      highlights={[
        {
          icon: FileText,
          title: "Transcript dễ đọc",
          copy: "Tóm tắt nội dung buổi học, những câu nói nổi bật và AI notes được trình bày ngắn gọn."
        },
        {
          icon: BarChart3,
          title: "Tiến bộ theo thời gian",
          copy: "Emotion timeline, score và mức độ hoàn thành giúp phụ huynh thấy xu hướng."
        },
        {
          icon: CheckSquare,
          title: "Duyệt trước khi học",
          copy: "Bài học AI chỉ nên trở thành active sau khi phụ huynh kiểm tra và chấp nhận."
        },
        {
          icon: Users,
          title: "Đồng hành cùng trẻ",
          copy: "Ngôn ngữ dashboard rõ ràng, không quy kết, ưu tiên gợi ý hành động nhỏ."
        }
      ]}
      sections={[
        {
          title: "Dashboard nên trả lời câu hỏi nào",
          copy: "Thay vì đổ dữ liệu hàng loạt, dashboard cần giúp phụ huynh hiểu buổi học hôm nay.",
          bullets: [
            "Bé đã tương tác bao lâu và theo chủ đề nào",
            "Mia đã phản hồi như thế nào khi bé gặp khó",
            "Bài học tiếp theo nào đang chờ duyệt"
          ]
        },
        {
          title: "Nguyên tắc nói với phụ huynh",
          copy: "Copywriting cần ấm áp, thực tế và không tạo cảm giác phụ huynh đang bị chấm điểm.",
          bullets: [
            "Dùng ngôn ngữ Vietnamese-first, câu ngắn",
            "Ưu tiên insight có hành động, không dùng label nặng nề",
            "Luôn nhắc rõ giới hạn của AI khi liên quan an toàn"
          ]
        }
      ]}
    />
  );
}
