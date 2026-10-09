import Image from "next/image";
import { BookOpen, Star, Play, Heart, Clock, Search, Folder, ChevronRight, Bookmark, Calculator, Gamepad2, Wind } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function LibraryScreen() {
  const favorites = [
    { id: 1, title: "Chú cáo nhỏ dũng cảm", type: "Câu chuyện", time: "5 phút", color: "text-snow-primary", bg: "bg-snow-primary/10", img: "/images/lesson-story-v2.png" },
    { id: 2, title: "Hơi thở sâu êm dịu", type: "Thư giãn", time: "3 phút", color: "text-snow-aqua", bg: "bg-snow-aqua/10", img: "/images/lesson-social-v2.png" },
    { id: 3, title: "Những con số kỳ diệu", type: "Toán học", time: "10 phút", color: "text-snow-aqua", bg: "bg-snow-ice", img: "/images/lesson-math-v2.png" },
  ];

  const recent = [
    { id: 1, title: "Đếm những vì sao", date: "Hôm qua", icon: <Star className="size-4" /> },
    { id: 2, title: "Kiểm tra cảm xúc", date: "2 ngày trước", icon: <Heart className="size-4" /> },
    { id: 3, title: "Vươn vai buổi sáng", date: "3 ngày trước", icon: <Clock className="size-4" /> },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-4xl font-black text-snow-primary-dark mb-2">Thư viện của bé</h1>
          <p className="text-sm font-bold text-snow-muted">Những câu chuyện yêu thích và hoạt động đã lưu.</p>
        </div>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2 border-2 border-snow-border focus-within:border-snow-primary/50 transition-colors shadow-sm w-64">
          <Search className="size-4 text-snow-muted mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="bg-transparent border-none outline-none text-sm font-bold text-snow-primary-dark w-full placeholder:text-snow-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content (Favorites & Categories) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Favorites Horizontal List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-snow-primary-dark flex items-center gap-2">
                <Bookmark className="size-5 text-snow-warning fill-snow-warning" /> Yêu thích
              </h2>
              <button className="text-sm font-bold text-snow-primary flex items-center hover:opacity-80">
                Xem tất cả <ChevronRight className="size-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.map(item => (
                <SnowCard key={item.id} className="p-4 flex flex-col group cursor-pointer border border-snow-border hover:border-snow-primary/40 transition-colors">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-snow-surface-soft mb-3">
                    <Image src={item.img} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 size-8 bg-white/90 backdrop-blur-sm rounded-full grid place-items-center shadow-sm">
                      <Heart className="size-4 text-snow-peach fill-snow-peach" />
                    </div>
                  </div>
                  <div className={`inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-2 ${item.bg} ${item.color}`}>
                    {item.type}
                  </div>
                  <h3 className="text-sm font-black text-snow-primary-dark mb-1 leading-tight group-hover:text-snow-primary transition-colors">{item.title}</h3>
                  <p className="text-xs font-semibold text-snow-muted mt-auto flex items-center gap-1">
                    <Clock className="size-3" /> {item.time}
                  </p>
                </SnowCard>
              ))}
            </div>
          </section>

          {/* Collections Grid */}
          <section className="mt-4">
            <h2 className="text-xl font-black text-snow-primary-dark mb-4 flex items-center gap-2">
              <Folder className="size-5 text-snow-primary" /> Bộ sưu tập
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "Câu chuyện", icon: BookOpen, count: "12", bg: "bg-snow-lavender" },
                { title: "Thư giãn", icon: Wind, count: "8", bg: "bg-snow-ice" },
                { title: "Toán học", icon: Calculator, count: "15", bg: "bg-snow-primary-soft" },
                { title: "Trò chơi", icon: Gamepad2, count: "6", bg: "bg-snow-cream" },
              ].map((cat, i) => {
                const Icon = cat.icon;

                return (
                <SnowCard key={i} className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform ${cat.bg} border-none`}>
                  <Icon className="mb-2 size-7 text-snow-primary" />
                  <h3 className="text-sm font-black text-snow-primary-dark">{cat.title}</h3>
                  <p className="text-[10px] font-bold text-snow-primary-dark/60 mt-1">{cat.count} mục</p>
                </SnowCard>
              );
              })}
            </div>
          </section>
        </div>

        {/* Right Sidebar Area */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Continue Learning */}
          <SnowCard className="p-6 bg-snow-primary-dark text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen className="size-24" />
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider mb-3">
                Tiếp tục
              </span>
              <h3 className="text-xl font-black mb-2 leading-tight">Ngôi nhà trên cây kỳ diệu</h3>
              <p className="text-sm font-semibold text-white/80 mb-6">Bé đã dừng lại ở trang 4. Bé có muốn đọc tiếp không?</p>
              <button className="w-full bg-white text-snow-primary-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform">
                Đọc tiếp <Play className="size-4" />
              </button>
            </div>
          </SnowCard>

          {/* Recently Viewed */}
          <SnowCard className="p-5 flex-1">
            <h2 className="text-sm font-black text-snow-primary-dark mb-4">Xem gần đây</h2>
            <div className="space-y-3">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-snow-surface rounded-xl cursor-pointer transition-colors">
                  <div className="size-8 rounded-full bg-snow-ice grid place-items-center text-snow-primary border border-snow-border">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-snow-primary-dark">{item.title}</p>
                    <p className="text-[10px] font-semibold text-snow-muted">{item.date}</p>
                  </div>
                  <ChevronRight className="size-4 text-snow-muted" />
                </div>
              ))}
            </div>
          </SnowCard>
        </div>

      </div>
    </div>
  );
}
