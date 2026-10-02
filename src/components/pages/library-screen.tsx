import Image from "next/image";
import { BookOpen, Star, Play, Heart, Clock, Search, Folder, ChevronRight, Bookmark, Calculator, Gamepad2, Wind } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";

export function LibraryScreen() {
  const favorites = [
    { id: 1, title: "The Brave Little Fox", type: "Story", time: "5 min", color: "text-snow-primary", bg: "bg-snow-primary/10", img: "/images/lesson-story.png" },
    { id: 2, title: "Deep Belly Breaths", type: "Calm", time: "3 min", color: "text-snow-aqua", bg: "bg-snow-aqua/10", img: "/images/lesson-story.png" },
    { id: 3, title: "Magic Numbers", type: "Math", time: "10 min", color: "text-snow-aqua", bg: "bg-snow-ice", img: "/images/lesson-story.png" },
  ];

  const recent = [
    { id: 1, title: "Counting Stars", date: "Yesterday", icon: <Star className="size-4" /> },
    { id: 2, title: "Feelings Check-in", date: "2 days ago", icon: <Heart className="size-4" /> },
    { id: 3, title: "Morning Stretch", date: "3 days ago", icon: <Clock className="size-4" /> },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-4xl font-black text-snow-primary-dark mb-2">My Library</h1>
          <p className="text-sm font-bold text-snow-muted">Your favorite stories and saved activities.</p>
        </div>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2 border-2 border-snow-border focus-within:border-snow-primary/50 transition-colors shadow-sm w-64">
          <Search className="size-4 text-snow-muted mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
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
                <Bookmark className="size-5 text-snow-warning fill-snow-warning" /> Favorites
              </h2>
              <button className="text-sm font-bold text-snow-primary flex items-center hover:opacity-80">
                See all <ChevronRight className="size-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.map(item => (
                <SnowCard key={item.id} className="p-4 flex flex-col group cursor-pointer border border-snow-border hover:border-snow-primary/40 transition-colors">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-snow-surface-soft mb-3">
                    <Image src={item.img} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
              <Folder className="size-5 text-snow-primary" /> Collections
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "Stories", icon: BookOpen, count: "12", bg: "bg-snow-lavender" },
                { title: "Calm", icon: Wind, count: "8", bg: "bg-snow-ice" },
                { title: "Math", icon: Calculator, count: "15", bg: "bg-snow-primary-soft" },
                { title: "Games", icon: Gamepad2, count: "6", bg: "bg-snow-cream" },
              ].map((cat, i) => {
                const Icon = cat.icon;

                return (
                <SnowCard key={i} className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform ${cat.bg} border-none`}>
                  <Icon className="mb-2 size-7 text-snow-primary" />
                  <h3 className="text-sm font-black text-snow-primary-dark">{cat.title}</h3>
                  <p className="text-[10px] font-bold text-snow-primary-dark/60 mt-1">{cat.count} items</p>
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
                Continue
              </span>
              <h3 className="text-xl font-black mb-2 leading-tight">The Magic Treehouse</h3>
              <p className="text-sm font-semibold text-white/80 mb-6">You stopped at Page 4. Want to keep reading?</p>
              <button className="w-full bg-white text-snow-primary-dark font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform">
                Resume <Play className="size-4" />
              </button>
            </div>
          </SnowCard>

          {/* Recently Viewed */}
          <SnowCard className="p-5 flex-1">
            <h2 className="text-sm font-black text-snow-primary-dark mb-4">Recently Viewed</h2>
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
