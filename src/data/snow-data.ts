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
  { label: "Home", href: "/session/home", icon: Home, key: "home" },
  { label: "Lessons", href: "/session/lessons", icon: BookOpen, key: "lessons" },
  { label: "AI Companion", href: "/companion", icon: Sparkles, key: "companion" },
  { label: "Activities", href: "/session/activities", icon: Activity, key: "activities" },
  { label: "Routine", href: "/session/routine", icon: CalendarCheck, key: "routine" },
  { label: "Settings", href: "/session/settings", icon: Settings, key: "settings" },
];

export const topNavItems: SnowNavItem[] = [
  { label: "Home", href: "/session/home", icon: Home, key: "home" },
  { label: "Companion", href: "/companion", icon: Sparkles, key: "companion" },
  { label: "Lessons", href: "/session/lessons", icon: BookOpen, key: "lessons" },
  { label: "Feelings", href: "/session/activities", icon: Heart, key: "feelings" },
  { label: "Routine", href: "/session/routine", icon: CalendarCheck, key: "routine" },
];

export const parentNavGroups: ParentNavGroup[] = [
  {
    group: "Main",
    items: [
      { label: "Dashboard", href: "/parent", icon: Home, key: "dashboard" },
      { label: "My Child", href: "/parent/children", icon: User, key: "children" },
      { label: "Sessions", href: "/parent/children/:childId/sessions", icon: History, key: "sessions" },
      { label: "Activity", href: "/parent/children/:childId/timeline", icon: Heart, key: "timeline" },
      { label: "Transcripts", href: "/parent/children/:childId/transcripts", icon: MessageSquare, key: "transcripts" },
      { label: "Learning", href: "/parent/children/:childId/learning", icon: GraduationCap, key: "learning" },
      { label: "Routines", href: "/parent/children/:childId/routines", icon: CalendarCheck, key: "routines" },
    ],
  },
  {
    group: "Safety",
    items: [
      { label: "Alerts", href: "/parent/alerts", icon: Bell, key: "alerts" },
      { label: "Privacy", href: "/parent/privacy", icon: Shield, key: "privacy" },
      { label: "Consent", href: "/parent/consent", icon: FileCheck, key: "consent" },
      { label: "Emergency", href: "/parent/settings/emergency", icon: PhoneCall, key: "emergency" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Settings", href: "/parent/settings", icon: Settings, key: "settings" },
      { label: "Notifications", href: "/parent/settings/notifications", icon: BellRing, key: "notifications" },
    ],
  },
];

export const lessons: LessonCardData[] = [
  {
    id: "magic-word-box",
    title: "The Magic Word Box",
    subtitle: "Letters and sounds",
    subject: "English",
    duration: "15 min",
    rating: "4.8",
    image: "/images/lesson-abc.png",
    accent: "primary",
    progress: 72,
  },
  {
    id: "baby-penguins",
    title: "Count with Baby Penguins",
    subtitle: "Numbers 1-10",
    subject: "Math",
    duration: "12 min",
    rating: "4.9",
    image: "/images/lesson-math.png",
    accent: "aqua",
    progress: 46,
  },
  {
    id: "brave-little-fox",
    title: "The Brave Little Fox",
    subtitle: "Kindness story",
    subject: "Story Time",
    duration: "18 min",
    rating: "4.8",
    image: "/images/lesson-story.png",
    accent: "peach",
    progress: 55,
  },
  {
    id: "sharing-caring",
    title: "Sharing is Caring",
    subtitle: "Friendship",
    subject: "Social Skills",
    duration: "10 min",
    rating: "4.7",
    image: "/images/lesson-social.png",
    accent: "pink",
    progress: 30,
  },
];

export const moods: MoodOption[] = [
  { label: "Calm", value: "calm", description: "Soft voice and gentle pace" },
  { label: "Happy", value: "happy", description: "Warm encouragement" },
  { label: "Excited", value: "excited", description: "Playful learning energy" },
  { label: "Thinking", value: "thinking", description: "Extra time to answer" },
  { label: "Encouraging", value: "encouraging", description: "More supportive prompts" },
  { label: "Sleepy", value: "sleepy", description: "Quiet routine mode" },
];

export const parentInsights: ParentInsight[] = [
  {
    title: "Expressing more feelings",
    description: "AgentKid noticed Minh used more feeling words during picture choices today.",
    metric: "+4 feeling words",
    tone: "success",
  },
  {
    title: "Responded well to visual choices",
    description: "Minh selected answers more comfortably when choices included pictures.",
    metric: "8 calm responses",
    tone: "calm",
  },
  {
    title: "Needed extra time during transitions",
    description: "AgentKid gave Minh a slower pace before moving from stories to math.",
    metric: "2 gentle pauses",
    tone: "warm",
  },
];

export const dailyTools = [
  { title: "Breathing Exercise", subtitle: "2-5 min", icon: Brain },
  { title: "Calm Story", subtitle: "Relax and listen", icon: BookOpen },
  { title: "Feelings Check-in", subtitle: "Name how you feel", icon: Heart },
  { title: "Ask for Help", subtitle: "Talk to a grown-up", icon: ShieldCheck },
];

export const routeCards = [
  { href: "/companion", title: "Talk with AgentKid", subtitle: "Ask anything or practice together.", icon: Sparkles },
  { href: "/session/routine", title: "Today's Routine", subtitle: "See your plan, tasks, and goals.", icon: CalendarCheck },
  { href: "/session/lessons", title: "Feelings and Emotions", subtitle: "Learn about feelings and kind choices.", icon: Heart },
  { href: "/session/activities", title: "Feeling Check-in", subtitle: "Name how today feels and choose a calm next step.", icon: Activity },
];
