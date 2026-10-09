import Image from "next/image";
import { ChevronRight, Play, Puzzle, Flame, Check } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function ActivitiesScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-snow-primary-dark mb-2">Hoạt động hôm nay</h1>
        <p className="text-base font-bold text-snow-muted">Nhiệm vụ, trò chơi và giải lao giúp bé năng động!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Missions - Spans 2 columns */}
        <SnowCard className="md:col-span-2 bg-gradient-to-br from-snow-ice to-white p-6 relative overflow-visible border-snow-primary/20 flex flex-col justify-between min-h-[300px]">
          {/* 3D Mascot Overflow - Owl and AgentKid */}
          <div className="absolute -top-10 right-0 lg:right-10 w-48 h-48 hidden sm:block z-10 pointer-events-none">
            <Image src="/images/snow-mascot.png" alt="AgentKid and Owl" fill className="object-contain drop-shadow-xl" />
          </div>

          <div className="relative z-20 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-snow-primary/10 rounded-full mb-4">
              <Flame className="size-4 text-snow-primary" />
              <span className="text-xs font-black text-snow-primary uppercase tracking-wider">Mục tiêu ngày</span>
            </div>
            <h2 className="text-3xl font-black text-snow-primary-dark mb-3">Nhiệm vụ</h2>
            <p className="text-sm font-semibold text-snow-muted mb-6 leading-relaxed">
              Hoàn thành 3 nhiệm vụ mỗi ngày để nhận huy hiệu đặc biệt!
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm">
                <div className="grid size-8 place-items-center rounded-full bg-snow-success text-white">
                  <Check className="size-4" />
                </div>
                <p className="text-sm font-bold text-snow-primary-dark flex-1 line-through opacity-70">Đọc một câu chuyện nhẹ nhàng</p>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-snow-primary/30 ring-1 ring-snow-primary/10">
                <div className="grid size-8 place-items-center rounded-full bg-snow-surface border-2 border-snow-primary text-snow-primary">
                  2
                </div>
                <p className="text-sm font-bold text-snow-primary-dark flex-1">Nối cảm xúc phù hợp</p>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm opacity-60">
                <div className="grid size-8 place-items-center rounded-full bg-snow-surface border-2 border-snow-border text-snow-muted">
                  3
                </div>
                <p className="text-sm font-bold text-snow-muted flex-1">Hít một hơi thật sâu</p>
              </div>
            </div>

            <button className="flex items-center justify-center gap-2 bg-snow-primary text-white px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              Bắt đầu nhiệm vụ 2 <Play className="size-4 fill-white" />
            </button>
          </div>
        </SnowCard>

        {/* Quick Activities */}
        <div className="flex flex-col gap-6">
          <SnowCard className="p-6 bg-white border border-snow-border flex-1 flex flex-col justify-center items-center text-center group cursor-pointer hover:border-snow-primary/50 transition-colors">
            <div className="grid size-16 place-items-center rounded-full bg-snow-aqua/20 mb-4 group-hover:scale-110 transition-transform">
              <Puzzle className="size-8 text-snow-aqua" />
            </div>
            <h3 className="text-xl font-black text-snow-primary-dark mb-2">Hoạt động nhanh</h3>
            <p className="text-sm font-semibold text-snow-muted mb-4">Trò chơi ngắn cho trí óc bận rộn</p>
            <div className="mt-auto text-snow-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Xem tất cả <ChevronRight className="size-4" />
            </div>
          </SnowCard>
          
          {/* Movement Breaks */}
          <SnowCard className="p-6 bg-gradient-to-br from-snow-peach/20 to-white border-snow-peach/30 flex-1 flex flex-col justify-center items-center text-center group cursor-pointer hover:shadow-md transition-shadow">
            <div className="grid size-16 place-items-center rounded-full bg-white shadow-sm mb-4">
              <span className="text-3xl">🏃‍♂️</span>
            </div>
            <h3 className="text-xl font-black text-snow-peach mb-2">Nghỉ vận động</h3>
            <p className="text-sm font-semibold text-snow-muted mb-4">Lắc lư, vươn vai và nhảy nhót!</p>
            <button className="mt-auto bg-snow-peach text-white px-5 py-2 rounded-full font-bold text-sm shadow-sm group-hover:bg-opacity-90 transition-opacity">
              Bắt đầu nào
            </button>
          </SnowCard>
        </div>

        {/* Matching Game - Full Width Row */}
        <SnowCard className="md:col-span-3 bg-snow-primary-dark text-white p-0 overflow-hidden relative mt-2 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-snow-primary-dark via-snow-primary-dark/90 to-transparent z-10 pointer-events-none"></div>
          
          {/* Background Pattern / Illustration */}
          <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 z-0 opacity-80 mix-blend-screen overflow-hidden">
             <div className="relative w-full h-full transform translate-x-10 scale-110">
               <Image src="/images/lesson-story.png" alt="Matching Game BG" fill className="object-cover object-left-bottom" />
             </div>
          </div>

          <div className="relative z-20 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-3 backdrop-blur-sm">
                <span className="text-lg">🦊</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Trò chơi nổi bật</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 text-white">Nối đôi bạn động vật</h2>
              <p className="text-sm font-semibold text-white/80 mb-6 leading-relaxed">
                Bé có thể nối các bạn động vật với món ăn yêu thích không? Trò chơi logic thú vị giúp rèn luyện tập trung.
              </p>
              <button className="flex items-center justify-center gap-2 bg-white text-snow-primary-dark px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                Chơi ngay <Play className="size-4 fill-snow-primary-dark" />
              </button>
            </div>
            
            {/* Visual Indicator of matching */}
            <div className="hidden lg:flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20">
              <div className="bg-white p-3 rounded-2xl shadow-lg transform -rotate-6">
                <span className="text-4xl">🐰</span>
              </div>
              <div className="h-1 w-12 bg-snow-warning/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-snow-warning w-full animate-pulse"></div>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-lg transform rotate-3">
                <span className="text-4xl">🥕</span>
              </div>
            </div>
          </div>
        </SnowCard>

      </div>
    </div>
  );
}
