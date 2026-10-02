import { Trophy, Star, Target, Flame, TrendingUp, Clock, Zap } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { ProgressStrip } from "@/components/ui/progress-strip";

export function ProgressScreen() {
  const stats = [
    { label: "Current Streak", value: "7 Days", icon: <Flame className="size-5 text-snow-warning" />, color: "bg-snow-warning/20 text-snow-warning" },
    { label: "Total Stars", value: "342", icon: <Star className="size-5 fill-snow-warning text-snow-warning" />, color: "bg-snow-warning/20 text-snow-warning" },
    { label: "Lessons Done", value: "28", icon: <Target className="size-5 text-snow-primary" />, color: "bg-snow-primary/20 text-snow-primary" },
    { label: "Time Learned", value: "12h", icon: <Clock className="size-5 text-snow-aqua" />, color: "bg-snow-aqua/20 text-snow-aqua" },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-4xl font-black text-snow-primary-dark mb-2">My Progress</h1>
        <p className="text-sm font-bold text-snow-muted">A calm look at your learning journey and achievements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <SnowCard key={i} className="p-5 flex flex-col justify-center items-center text-center">
            <div className={`size-12 rounded-2xl grid place-items-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-snow-primary-dark mb-1">{stat.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-snow-muted">{stat.label}</p>
          </SnowCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Activity Chart */}
        <SnowCard className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-snow-primary-dark flex items-center gap-2">
              <TrendingUp className="size-5 text-snow-primary" /> Weekly Activity
            </h2>
            <select className="bg-snow-ice text-xs font-bold text-snow-muted px-3 py-1.5 rounded-full border-none outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 px-2 h-48 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              <div className="w-full h-px border-b border-dashed border-snow-border"></div>
              <div className="w-full h-px border-b border-dashed border-snow-border"></div>
              <div className="w-full h-px border-b border-dashed border-snow-border"></div>
            </div>
            
            {/* Bars */}
            {[
              { day: "Mon", height: "40%", active: false },
              { day: "Tue", height: "70%", active: false },
              { day: "Wed", height: "50%", active: false },
              { day: "Thu", height: "90%", active: true },
              { day: "Fri", height: "60%", active: false },
              { day: "Sat", height: "30%", active: false },
              { day: "Sun", height: "80%", active: false },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center w-full relative z-10 group cursor-pointer h-full justify-end">
                <div 
                  className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ease-out ${
                    bar.active ? "bg-snow-primary" : "bg-snow-primary/20 group-hover:bg-snow-primary/40"
                  }`} 
                  style={{ height: bar.height }}
                ></div>
                <span className={`text-[10px] font-bold mt-3 ${bar.active ? "text-snow-primary-dark" : "text-snow-muted"}`}>
                  {bar.day}
                </span>
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-snow-primary-dark text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none">
                  {parseInt(bar.height) / 10}0 min
                </div>
              </div>
            ))}
          </div>
        </SnowCard>

        {/* Level & Goals */}
        <div className="flex flex-col gap-6">
          <SnowCard className="p-6 bg-gradient-to-br from-snow-lavender to-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-white rounded-full grid place-items-center shadow-sm">
                <Trophy className="size-6 text-snow-warning" />
              </div>
              <div>
                <h2 className="text-lg font-black text-snow-primary-dark">Level 3</h2>
                <p className="text-xs font-semibold text-snow-muted">Explorer</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-black text-snow-primary-dark">
                <span>Progress</span>
                <span>320 / 500 XP</span>
              </div>
              <ProgressStrip value={64} />
            </div>
            <p className="text-[10px] font-bold text-center text-snow-primary">180 XP to Level 4!</p>
          </SnowCard>

          <SnowCard className="p-6 flex-1">
            <h2 className="text-lg font-black text-snow-primary-dark mb-4 flex items-center gap-2">
              <Zap className="size-4 text-snow-warning" /> Weekly Goal
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative size-16 shrink-0 grid place-items-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="28" className="stroke-snow-surface-soft fill-none" strokeWidth="6" />
                  <circle cx="50%" cy="50%" r="28" className="stroke-snow-primary fill-none" strokeWidth="6" strokeLinecap="round" strokeDasharray="175.9" strokeDashoffset="44" />
                </svg>
                <span className="text-lg font-black text-snow-primary-dark">3<span className="text-xs text-snow-muted">/4</span></span>
              </div>
              <p className="text-sm font-semibold text-snow-muted">Complete 4 lessons this week to earn a Mystery Badge.</p>
            </div>
          </SnowCard>
        </div>

      </div>
    </div>
  );
}
