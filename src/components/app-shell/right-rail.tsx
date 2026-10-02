import Image from "next/image";
import { Flame, Star, Quote, Target, Clock, BookOpen, Sun, Moon, Download, RotateCcw, LogOut, ChevronRight, Check, Heart } from "lucide-react";
import { SnowCard } from "@/components/ui/snow-card";
import { ProgressStrip } from "@/components/ui/progress-strip";

export function HomeRightRail() {
  return (
    <div className="space-y-4">
      <SnowCard className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-snow-primary-dark">My Progress</h2>
          <button className="rounded-full border border-snow-border px-3 py-1.5 text-xs font-black text-snow-primary-dark">View all</button>
        </div>
        <div className="mt-5 flex items-center justify-between border-y border-snow-border py-4">
          <div>
            <p className="text-xs font-bold text-snow-muted">Learning Streak</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black text-snow-warning"><Flame className="size-6 fill-snow-warning" />7 days</p>
          </div>
          <Star className="size-12 fill-snow-warning text-snow-warning" />
        </div>
        <div className="mt-4">
          <div className="mb-3 flex justify-between text-sm font-black text-snow-primary-dark">
            <span>Level 3</span>
            <span>320 / 500 XP</span>
          </div>
          <ProgressStrip value={64} />
        </div>
      </SnowCard>

      <SnowCard className="relative overflow-hidden bg-snow-lavender p-4">
        <div className="relative z-10">
          <h2 className="text-base font-black text-snow-primary-dark">Need help?<br/>AgentKid can listen.</h2>
          <p className="mt-3 max-w-[185px] text-[13px] font-semibold leading-5 text-snow-primary-dark">Talk to AgentKid if you feel sad, worried, or just need someone to chat with.</p>
          <button className="mt-4 rounded-full bg-white px-4 py-2.5 text-sm font-black text-snow-primary shadow-sm">Open Safe Space</button>
        </div>
        <Image src="/images/snow-mascot-ui.png" alt="" width={118} height={118} className="absolute bottom-0 right-0 object-cover" />
      </SnowCard>

      <SnowCard className="bg-snow-surface-soft p-4">
        <h2 className="text-base font-black text-snow-primary-dark">AgentKid&apos;s Tip of the Day</h2>
        <div className="mt-4 flex gap-3 text-snow-primary-dark">
          <Quote className="size-6 shrink-0 text-snow-primary" />
          <p className="text-[13px] font-bold italic leading-5">It&apos;s okay to make mistakes. That&apos;s how our brains grow stronger!</p>
        </div>
        <div className="mt-4 flex justify-end">
            <Image src="/images/snow-avatar-ui.png" alt="" width={54} height={54} className="rounded-full object-cover" />
        </div>
      </SnowCard>
    </div>
  );
}

export function ExploreRightRail() {
  return (
    <div className="space-y-5">
      <SnowCard className="p-5">
        <h2 className="text-lg font-black text-snow-primary-dark">AgentKid Recommends</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface p-3">
             <div className="size-10 rounded-md bg-snow-ice"></div>
             <div className="flex-1">
               <p className="text-sm font-black text-snow-primary-dark">Practice sight words</p>
               <p className="text-xs font-semibold text-snow-muted">5 min - English</p>
             </div>
             <button className="rounded-full bg-snow-primary px-3 py-1.5 text-xs font-black text-white">Start</button>
          </div>
           <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface p-3">
             <div className="size-10 rounded-md bg-snow-lavender"></div>
             <div className="flex-1">
               <p className="text-sm font-black text-snow-primary-dark">Math: Add with 10</p>
               <p className="text-xs font-semibold text-snow-muted">10 min - Math</p>
             </div>
             <button className="rounded-full bg-snow-primary px-3 py-1.5 text-xs font-black text-white">Start</button>
          </div>
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-snow-border bg-snow-surface p-3">
             <div className="size-10 rounded-md bg-snow-pink/20"></div>
             <div className="flex-1">
               <p className="text-sm font-black text-snow-primary-dark">Kindness Challenge</p>
               <p className="text-xs font-semibold text-snow-muted">7 min - Social Skills</p>
             </div>
             <button className="rounded-full bg-snow-primary px-3 py-1.5 text-xs font-black text-white">Start</button>
          </div>
        </div>
        <button className="mt-4 w-full rounded-full border border-snow-border py-3 text-sm font-black text-snow-primary">See all recommendations</button>
      </SnowCard>

      <SnowCard className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><Target className="size-5 text-snow-primary" /> Daily Exploration Goal</h2>
        <p className="mt-3 text-sm font-bold text-snow-primary-dark">Great job staying curious!</p>
        <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-black text-snow-primary-dark">25 <span className="text-lg text-snow-muted">/ 30 min</span></span>
            <div className="ml-auto size-12 rounded-full bg-snow-warning"></div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-snow-surface-soft">
             <div className="h-full w-[83%] rounded-full bg-snow-primary"></div>
        </div>
        <p className="mt-3 text-center text-xs font-bold text-snow-muted">Keep it up!</p>
      </SnowCard>

      <SnowCard className="flex items-center justify-between bg-snow-lavender p-5">
        <div>
          <p className="font-black text-snow-primary-dark">New this week!</p>
          <p className="mt-2 text-xs font-bold text-snow-primary-dark">3 new stories</p>
          <p className="mt-1 text-xs font-bold text-snow-primary-dark">2 new games</p>
        </div>
        <Image src="/images/snow-avatar-ui.png" alt="" width={56} height={56} className="rounded-full object-cover" />
      </SnowCard>
    </div>
  );
}

// Temporary alias to fix broken imports in other routes
export { HomeRightRail as ChildRightRail };

export function LessonRightRail() {
  return (
    <div className="flex h-full flex-col gap-4 p-5 pl-0">
      <SnowCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-snow-primary-dark">Lesson Progress</h3>
          <span className="text-xs font-bold text-snow-primary">View all</span>
        </div>
        <p className="text-xs font-semibold text-snow-muted mb-2">This lesson</p>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 flex-1 rounded-full bg-snow-ice overflow-hidden">
            <div className="h-full bg-snow-primary w-2/5 rounded-full" />
          </div>
          <span className="text-xs font-black text-snow-primary-dark">2 / 5 steps</span>
        </div>
        <p className="text-xs font-semibold text-snow-muted mb-2">Stars earned</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="size-6 text-snow-warning fill-snow-warning" />
            <span className="text-2xl font-black text-snow-warning">12</span>
          </div>
          <Image src="/images/snow-mascot.png" alt="" width={40} height={40} className="drop-shadow-sm" />
        </div>
      </SnowCard>

      <SnowCard className="relative overflow-hidden bg-gradient-to-br from-snow-primary to-snow-primary-dark p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-black text-white mb-1 relative z-10">Great job, Minh!</h3>
        <p className="text-xs font-semibold text-white/90 relative z-10">You picked the right feeling.<br/>Keep it up!</p>
        <Image src="/images/snow-mascot.png" alt="" width={80} height={80} className="absolute -bottom-4 -right-4 drop-shadow-md z-0" />
      </SnowCard>

      <SnowCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="size-5 text-snow-warning fill-snow-warning" />
          <h3 className="font-black text-snow-primary-dark">Learning Streak</h3>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-black text-snow-warning">7</span>
          <span className="text-sm font-black text-snow-primary-dark">days</span>
        </div>
        <div className="flex justify-between items-center gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-snow-muted">{day}</span>
              <div className={`grid size-5 place-items-center rounded-full ${i === 6 ? 'border border-snow-primary text-snow-primary bg-white' : 'bg-snow-primary text-white'}`}>
                {i !== 6 && <Check className="size-3" />}
              </div>
            </div>
          ))}
        </div>
      </SnowCard>

      <SnowCard className="p-5 relative overflow-hidden bg-gradient-to-br from-snow-lavender to-snow-ice border-snow-primary/20">
        <h3 className="font-black text-snow-primary-dark mb-1">Need a break?</h3>
        <p className="text-xs font-semibold text-snow-muted mb-4 max-w-[140px]">Take a calm break with AgentKid.</p>
        <button className="rounded-full bg-white px-4 py-2 text-xs font-bold text-snow-primary shadow-sm hover:shadow transition-shadow">
          Calm Break <Heart className="inline size-3 ml-1 fill-snow-primary" />
        </button>
        <Image src="/images/snow-mascot.png" alt="" width={70} height={70} className="absolute -bottom-2 -right-4 drop-shadow-md opacity-80" />
      </SnowCard>

      <div className="grid grid-cols-2 gap-4">
        <SnowCard className="p-4 flex flex-col items-center text-center cursor-pointer hover:bg-snow-surface transition-colors">
          <div className="grid size-8 place-items-center rounded-full bg-snow-ice border border-snow-border mb-2">
            <span className="text-snow-primary font-black">?</span>
          </div>
          <p className="text-xs font-black text-snow-primary-dark">Hint</p>
          <p className="text-[10px] font-semibold text-snow-muted">What can help?</p>
        </SnowCard>
        <SnowCard className="p-4 flex flex-col items-center text-center cursor-pointer hover:bg-snow-surface transition-colors">
          <div className="grid size-8 place-items-center rounded-full bg-snow-ice border border-snow-border mb-2">
            <span className="text-snow-primary font-black">!</span>
          </div>
          <p className="text-xs font-black text-snow-primary-dark">I&apos;m not sure</p>
          <p className="text-[10px] font-semibold text-snow-muted">Help me out</p>
        </SnowCard>
      </div>
    </div>
  );
}

export function SettingsRightRail() {
  return (
    <div className="space-y-5">
      <SnowCard className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><Star className="size-5 fill-snow-warning text-snow-warning" /> Today&apos;s Insights</h2>
        
        <div className="mt-6 flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-full bg-snow-surface-soft">
            <Clock className="size-5 text-snow-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-snow-muted">Screen Time</p>
            <p className="mt-1 text-lg font-black text-snow-primary-dark">45 min</p>
            <p className="text-xs font-semibold text-snow-muted">of 1h daily limit</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-snow-surface-soft">
              <div className="h-full rounded-full bg-snow-primary" style={{ width: "75%" }} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-snow-border pt-6">
          <div className="flex items-start gap-4">
            <div className="grid size-10 place-items-center rounded-full bg-snow-warning/10">
              <Flame className="size-5 fill-snow-warning text-snow-warning" />
            </div>
            <div>
              <p className="text-xs font-bold text-snow-muted">Learning Streak</p>
              <p className="mt-1 text-lg font-black text-snow-warning">7 days</p>
            </div>
          </div>
          <Star className="size-10 fill-snow-warning text-snow-warning opacity-80" />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-snow-border pt-6">
          <div className="flex items-start gap-4">
            <div className="grid size-10 place-items-center rounded-full bg-snow-primary-soft">
              <BookOpen className="size-5 text-snow-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-snow-muted">Lessons Completed</p>
              <p className="mt-1 text-lg font-black text-snow-primary-dark">3</p>
              <p className="text-xs font-semibold text-snow-muted">Great job!</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-md)] bg-snow-lavender p-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-snow-primary text-white">
             <Star className="size-4" />
          </div>
          <div>
            <p className="text-sm font-black text-snow-primary-dark">Minh is doing amazing!</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-snow-primary-dark">Keep supporting their learning journey.</p>
          </div>
          <Image src="/images/snow-avatar-final.png" alt="" width={48} height={48} className="shrink-0 rounded-full object-cover" />
        </div>
      </SnowCard>

      <SnowCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-snow-primary-dark">Routine Schedule</h2>
          <button className="rounded-full border border-snow-border px-3 py-1.5 text-xs font-black text-snow-primary">Edit</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Sun className="mt-0.5 size-5 text-snow-warning" />
              <div>
                <p className="text-sm font-black text-snow-primary-dark">After School</p>
                <p className="text-xs font-semibold text-snow-muted">Mon, Tue, Wed, Thu, Fri</p>
                <p className="text-xs font-semibold text-snow-muted">4:00 - 4:30 PM</p>
              </div>
            </div>
            <div className="relative h-6 w-11 rounded-full bg-snow-success"><div className="absolute right-1 top-1 size-4 rounded-full bg-white"></div></div>
          </div>
          <div className="flex items-center justify-between border-t border-snow-border pt-4">
            <div className="flex gap-3">
              <Moon className="mt-0.5 size-5 text-snow-primary" />
              <div>
                <p className="text-sm font-black text-snow-primary-dark">Bedtime Wind-down</p>
                <p className="text-xs font-semibold text-snow-muted">Mon, Tue, Wed, Thu, Fri</p>
                <p className="text-xs font-semibold text-snow-muted">8:00 - 8:20 PM</p>
              </div>
            </div>
            <div className="relative h-6 w-11 rounded-full bg-snow-success"><div className="absolute right-1 top-1 size-4 rounded-full bg-white"></div></div>
          </div>
        </div>
      </SnowCard>

      <SnowCard className="p-5">
        <h2 className="mb-4 text-lg font-black text-snow-primary-dark">Quick Actions</h2>
        <div className="space-y-1">
          <button className="flex w-full items-center justify-between py-2 text-left">
            <span className="flex items-center gap-3 text-sm font-bold text-snow-primary-dark"><Download className="size-4 text-snow-primary" /> Download Progress Report</span>
            <ChevronRight className="size-4 text-snow-muted" />
          </button>
          <button className="flex w-full items-center justify-between border-t border-snow-border py-2 text-left">
            <span className="flex items-center gap-3 text-sm font-bold text-snow-primary-dark"><RotateCcw className="size-4 text-snow-primary" /> Reset Learning Preferences</span>
            <ChevronRight className="size-4 text-snow-muted" />
          </button>
          <button className="flex w-full items-center justify-between border-t border-snow-border py-2 text-left">
            <span className="flex items-center gap-3 text-sm font-bold text-snow-primary-dark"><LogOut className="size-4 text-snow-primary" /> Log Out of All Devices</span>
            <ChevronRight className="size-4 text-snow-muted" />
          </button>
        </div>
      </SnowCard>
    </div>
  );
}

export function TalkRightRail() {
  return (
    <div className="space-y-5">
      <SnowCard className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-black text-snow-primary-dark"><Flame className="size-5 fill-snow-warning text-snow-warning" /> Your Calm Journey</h2>
        <p className="mt-3 text-sm font-bold text-snow-primary-dark">3 days in a row!</p>
        <div className="mt-4 flex justify-between items-center gap-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-snow-muted">{day}</span>
              <div className={`grid size-5 place-items-center rounded-full ${i > 2 ? 'border border-snow-primary text-snow-primary bg-white' : 'bg-snow-primary text-white'}`}>
                {i <= 2 && <Check className="size-3" />}
              </div>
            </div>
          ))}
        </div>
      </SnowCard>

      <SnowCard className="p-5">
        <h2 className="text-lg font-black text-snow-primary-dark mb-4">Take a Moment</h2>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between bg-snow-surface-soft p-3 rounded-xl hover:bg-snow-primary/10 transition-colors">
             <span className="text-sm font-black text-snow-primary-dark">Breathing Exercise</span>
             <ChevronRight className="size-4 text-snow-primary" />
          </button>
          <button className="w-full flex items-center justify-between bg-snow-surface-soft p-3 rounded-xl hover:bg-snow-primary/10 transition-colors">
             <span className="text-sm font-black text-snow-primary-dark">Calm Story</span>
             <ChevronRight className="size-4 text-snow-primary" />
          </button>
          <button className="w-full flex items-center justify-between bg-snow-surface-soft p-3 rounded-xl hover:bg-snow-primary/10 transition-colors">
             <span className="text-sm font-black text-snow-primary-dark">Gratitude Jar</span>
             <ChevronRight className="size-4 text-snow-primary" />
          </button>
        </div>
      </SnowCard>

      <SnowCard className="bg-snow-peach/10 border border-snow-peach/20 p-5 flex flex-col items-center text-center">
        <Heart className="size-8 text-snow-peach mb-3" />
        <h2 className="text-lg font-black text-snow-primary-dark mb-2">Need more help?</h2>
        <p className="text-xs font-semibold text-snow-muted mb-4">If you feel very sad or worried, it&apos;s best to talk to a grown-up.</p>
        <button className="w-full rounded-full bg-snow-peach text-white font-bold py-3 text-sm shadow-sm">Talk to a Grown-up</button>
      </SnowCard>
    </div>
  );
}
