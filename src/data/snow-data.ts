import {
  Activity,
  Bell,
  BellRing,
  BookOpen,
  Brain,
  CalendarCheck,
  FileCheck,
  GraduationCap,
  Heart,
  History,
  Home,
  MessageSquare,
  PhoneCall,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { LessonCardData, MoodOption, ParentInsight, SnowNavItem, ParentNavGroup } from "@/types/snow";

export const childSidebarItems: SnowNavItem[] = [
  { label: "Trang chủ", href: "/session/home", icon: Home, key: "home" },
  { label: "Bài học", href: "/session/lessons", icon: BookOpen, key: "lessons" },
  { label: "Trợ lý AI", href: "/mia", icon: Sparkles, key: "companion" },
  { label: "Hoạt động", href: "/session/activities", icon: Activity, key: "activities" },
  { label: "Lịch trình", href: "/session/routine", icon: CalendarCheck, key: "routine" },
  { label: "Cài đặt", href: "/session/settings", icon: Settings, key: "settings" },
];

export const topNavItems: SnowNavItem[] = [
  { label: "Trang chủ", href: "/session/home", icon: Home, key: "home" },
  { label: "Trợ lý", href: "/mia", icon: Sparkles, key: "companion" },
  { label: "Bài học", href: "/session/lessons", icon: BookOpen, key: "lessons" },
  { label: "Cảm xúc", href: "/session/activities", icon: Heart, key: "feelings" },
  { label: "Lịch trình", href: "/session/routine", icon: CalendarCheck, key: "routine" },
];

export const parentNavGroups: ParentNavGroup[] = [
  {
    group: "Chính",
    items: [
      { label: "Bảng điều khiển", href: "/parent", icon: Home, key: "dashboard" },
      { label: "Học sinh", href: "/parent/children", icon: User, key: "children" },
      { label: "Phiên học", href: "/parent/children/:childId/sessions", icon: History, key: "sessions" },
      { label: "Dòng thời gian hoạt động", href: "/parent/children/:childId/timeline", icon: Heart, key: "timeline" },
      { label: "Bản ghi trò chuyện", href: "/parent/children/:childId/transcripts", icon: MessageSquare, key: "transcripts" },
      { label: "Trọng tâm học tập", href: "/parent/children/:childId/learning", icon: GraduationCap, key: "learning" },
      { label: "Lịch trình & Thời gian", href: "/parent/children/:childId/routines", icon: CalendarCheck, key: "routines" },
    ],
  },
  {
    group: "An toàn",
    items: [
      { label: "Cảnh báo", href: "/parent/alerts", icon: Bell, key: "alerts" },
      { label: "Quyền riêng tư & Đồng ý", href: "/parent/privacy", icon: Shield, key: "privacy" },
      { label: "Đồng ý", href: "/parent/consent", icon: FileCheck, key: "consent" },
      { label: "Khẩn cấp", href: "/parent/settings/emergency", icon: PhoneCall, key: "emergency" },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { label: "Cài đặt", href: "/parent/settings", icon: Settings, key: "settings" },
      { label: "Thông báo", href: "/parent/settings/notifications", icon: BellRing, key: "notifications" },
    ],
  },
];

export const lessons: LessonCardData[] = [
  {
    id: "magic-word-box",
    title: "Hộp từ ngữ diệu kỳ",
    subtitle: "Chữ cái và âm thanh",
    subject: "Tiếng Anh",
    duration: "15 phút",
    rating: "4.8",
    image: "/images/lesson-abc.png",
    accent: "primary",
    progress: 72,
  },
  {
    id: "baby-penguins",
    title: "Đếm cùng chim cánh cụt",
    subtitle: "Các số từ 1 đến 10",
    subject: "Toán học",
    duration: "12 phút",
    rating: "4.9",
    image: "/images/lesson-math.png",
    accent: "aqua",
    progress: 46,
  },
  {
    id: "brave-little-fox",
    title: "Chú cáo nhỏ dũng cảm",
    subtitle: "Câu chuyện về lòng tốt",
    subject: "Kể chuyện",
    duration: "18 phút",
    rating: "4.8",
    image: "/images/lesson-story.png",
    accent: "peach",
    progress: 55,
  },
  {
    id: "sharing-caring",
    title: "Chia sẻ là yêu thương",
    subtitle: "Tình bạn diệu kỳ",
    subject: "Kỹ năng xã hội",
    duration: "10 phút",
    rating: "4.7",
    image: "/images/lesson-social.png",
    accent: "pink",
    progress: 30,
  },
];

export const moods: MoodOption[] = [
  { label: "Bình tĩnh", value: "calm", description: "Giọng nói êm dịu và nhịp độ chậm rãi" },
  { label: "Vui vẻ", value: "happy", description: "Sự khích lệ ấm áp" },
  { label: "Hào hứng", value: "excited", description: "Năng lượng học tập vui tươi" },
  { label: "Suy nghĩ", value: "thinking", description: "Thêm thời gian suy nghĩ để trả lời" },
  { label: "Khích lệ", value: "encouraging", description: "Thêm những lời động viên nâng đỡ" },
  { label: "Buồn ngủ", value: "sleepy", description: "Chế độ lịch trình êm dịu" },
];

export const parentInsights: ParentInsight[] = [
  {
    title: "Bộc lộ nhiều cảm xúc hơn",
    description: "AgentKid nhận thấy Minh đã dùng nhiều từ ngữ cảm xúc hơn trong các lựa chọn hình ảnh hôm nay.",
    metric: "+4 từ cảm xúc",
    tone: "success",
  },
  {
    title: "Phản hồi tốt với các lựa chọn hình ảnh",
    description: "Minh chọn câu trả lời thoải mái hơn khi các phương án có kèm hình ảnh.",
    metric: "8 phản hồi bình tĩnh",
    tone: "calm",
  },
  {
    title: "Cần thêm thời gian khi chuyển đổi hoạt động",
    description: "AgentKid đã cho Minh nhịp độ chậm rãi hơn trước khi chuyển từ truyện kể sang toán học.",
    metric: "2 lần tạm dừng nhẹ nhàng",
    tone: "warm",
  },
];

export const dailyTools = [
  { title: "Bài tập hít thở", subtitle: "2-5 phút", icon: Brain },
  { title: "Câu chuyện nhẹ nhàng", subtitle: "Thư giãn và lắng nghe", icon: BookOpen },
  { title: "Kiểm tra cảm xúc", subtitle: "Nói lên cảm xúc của bạn", icon: Heart },
  { title: "Nhờ người lớn giúp", subtitle: "Trò chuyện cùng người lớn", icon: ShieldCheck },
];

export const routeCards = [
  { href: "/mia", title: "Trò chuyện cùng AgentKid", subtitle: "Hỏi bất cứ điều gì hoặc cùng nhau luyện tập.", icon: Sparkles },
  { href: "/session/routine", title: "Lịch trình hôm nay", subtitle: "Xem kế hoạch, nhiệm vụ và mục tiêu của bạn.", icon: CalendarCheck },
  { href: "/session/lessons", title: "Cảm xúc và tâm trạng", subtitle: "Tìm hiểu về cảm xúc và những lựa chọn tử tế.", icon: Heart },
  { href: "/session/activities", title: "Kiểm tra cảm xúc", subtitle: "Cảm nhận ngày hôm nay và chọn bước tiếp theo thật nhẹ nhàng.", icon: Activity },
];
