/**
 * Development seed data for AgentKid.
 *
 * Populates the database with realistic demo records for local development.
 * Run with: npm run db:seed (from packages/database)
 *
 * Requirements:
 * - DATABASE_URL must be set (SSH tunnel to server or direct connection)
 * - Schema must be applied first (npm run db:push)
 */

import { createDatabaseClient } from "../src/connection";
import {
  users,
  children,
  sessions,
  messages,
  emotionEvents,
  lessons,
  memories,
  alerts,
} from "../src/schema";

async function seed() {
  console.log("🌱 Starting AgentKid dev seed...\n");

  const db = createDatabaseClient();

  // 1. Parent profile
  const [parent] = await db
    .insert(users)
    .values({
      authSubjectId: "dev-auth-subject-001",
      email: "parent@agentkid.local",
      displayName: "Phụ huynh Demo",
      phone: "+84901234567",
      alertChannels: ["push"],
    })
    .returning();

  console.log(`✅ Parent: ${parent.displayName} (${parent.id})`);

  // 2. Child profile
  const [child] = await db
    .insert(children)
    .values({
      userId: parent.id,
      displayName: "An",
      dateOfBirth: "2019-03-15",
      condition: "both",
      communicationPreferences: {
        preferredTopics: ["animals", "colors"],
        pacePreference: "slow",
      },
      goals: ["Greeting practice", "Emotion naming", "Simple routines"],
    })
    .returning();

  console.log(`✅ Child: ${child.displayName} (${child.id})`);

  // 3. Sessions
  const [session1] = await db
    .insert(sessions)
    .values({
      childId: child.id,
      status: "completed",
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000),
      durationSeconds: 480,
      score: 7.5,
      aiNotes: "An phản hồi tốt trong phần chào hỏi. Cần thêm luyện tập gọi tên cảm xúc.",
    })
    .returning();

  const [session2] = await db
    .insert(sessions)
    .values({
      childId: child.id,
      status: "interrupted",
      startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // yesterday
      endedAt: new Date(Date.now() - 26 * 60 * 60 * 1000 + 6 * 60 * 1000),
      durationSeconds: 360,
      aiNotes: "Dừng sớm sau tín hiệu mệt. Không có critical alert.",
    })
    .returning();

  const [session3] = await db
    .insert(sessions)
    .values({
      childId: child.id,
      status: "completed",
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      durationSeconds: 600,
      score: 8.2,
      aiNotes: "Hoàn thành lesson cảm xúc vui/buồn. Tiến bộ rõ rệt.",
    })
    .returning();

  console.log(`✅ Sessions: 3 created (completed, interrupted, completed)`);

  // 4. Messages
  await db.insert(messages).values([
    {
      sessionId: session1.id,
      role: "assistant",
      content: "Chào An! Hôm nay mình luyện chào hỏi nhé. Con sẵn sàng chưa?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      sessionId: session1.id,
      role: "user",
      content: "Con sẵn sàng rồi.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000),
    },
    {
      sessionId: session1.id,
      role: "assistant",
      content: "Tuyệt vời! Khi gặp ai đó, con nói gì đầu tiên?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20000),
    },
    {
      sessionId: session1.id,
      role: "user",
      content: "Xin chào.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
    },
    {
      sessionId: session1.id,
      role: "assistant",
      content: "Giỏi quá! \"Xin chào\" là câu chào rất đúng. Mình thử nói chậm lại nhé. Con đang làm rất tốt.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 35000),
    },
  ]);

  console.log(`✅ Messages: 5 created for session 1`);

  // 5. Emotion events
  await db.insert(emotionEvents).values([
    {
      sessionId: session1.id,
      emotion: "neutral",
      confidence: 0.82,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000),
    },
    {
      sessionId: session1.id,
      emotion: "happy",
      confidence: 0.91,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 35000),
    },
    {
      sessionId: session1.id,
      emotion: "neutral",
      confidence: 0.75,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 120000),
    },
    {
      sessionId: session2.id,
      emotion: "sad",
      confidence: 0.68,
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000 + 300000),
    },
  ]);

  console.log(`✅ Emotion events: 4 created`);

  // 6. Lessons
  await db.insert(lessons).values([
    {
      childId: child.id,
      framework: "ABA",
      category: "emotion",
      title: "Nhận diện vui và buồn",
      status: "approved",
      nodes: [
        {
          id: "node-1",
          type: "prompt",
          text: "Hôm nay mình tìm hiểu về cảm xúc vui và buồn nhé!",
          defaultNextNodeId: "node-2",
        },
        {
          id: "node-2",
          type: "question",
          text: "Khi con được tặng quà, con cảm thấy thế nào?",
          choices: [
            { keywords: ["vui", "thích", "happy"], nextNodeId: "node-3", feedback: "Đúng rồi! Được tặng quà thì vui lắm!" },
            { keywords: ["buồn", "sad"], nextNodeId: "node-4", feedback: "Hmm, thường thì được quà sẽ vui đấy." },
          ],
          defaultNextNodeId: "node-3",
        },
        {
          id: "node-3",
          type: "feedback",
          text: "Con giỏi quá! Con biết nhận ra cảm xúc vui rồi đấy.",
          defaultNextNodeId: "node-5",
        },
        {
          id: "node-4",
          type: "feedback",
          text: "Không sao, mỗi người có cảm xúc khác nhau. Mình thử thêm nhé!",
          defaultNextNodeId: "node-5",
        },
        {
          id: "node-5",
          type: "end",
          text: "Bài học hôm nay xong rồi! Con đã làm rất tốt. Hẹn gặp lại nhé!",
        },
      ],
    },
    {
      childId: child.id,
      framework: "SocialStories",
      category: "social",
      title: "Chào hỏi khi gặp người quen",
      status: "suggested",
      nodes: [
        {
          id: "node-1",
          type: "prompt",
          text: "Khi gặp cô giáo ở trường, con có thể nói: \"Chào cô ạ!\"",
          defaultNextNodeId: "node-2",
        },
        {
          id: "node-2",
          type: "question",
          text: "Nếu gặp bạn ở công viên, con sẽ nói gì?",
          choices: [
            { keywords: ["chào", "hello", "xin chào"], nextNodeId: "node-3" },
          ],
          defaultNextNodeId: "node-3",
        },
        {
          id: "node-3",
          type: "end",
          text: "Tuyệt vời! Con đã biết cách chào hỏi rồi!",
        },
      ],
    },
  ]);

  console.log(`✅ Lessons: 2 created (1 approved, 1 suggested)`);

  // 7. Memories
  await db.insert(memories).values([
    {
      childId: child.id,
      fact: "An thích nói về động vật, đặc biệt là mèo và chó.",
      sourceSessionId: session3.id,
      confidence: 0.82,
    },
    {
      childId: child.id,
      fact: "An phản hồi tốt hơn khi Mia dùng câu ngắn, chậm và có khen.",
      sourceSessionId: session1.id,
      confidence: 0.88,
    },
    {
      childId: child.id,
      fact: "An thường mệt sau khoảng 7-8 phút luyện tập.",
      sourceSessionId: session2.id,
      confidence: 0.76,
    },
  ]);

  console.log(`✅ Memories: 3 extracted facts`);

  // 8. Alert
  await db.insert(alerts).values({
    sessionId: session2.id,
    severity: "warning",
    triggerType: "emotion",
    message: "Trẻ thể hiện tín hiệu mệt liên tục trong 2 phút cuối phiên.",
    emotionHistory: [
      { emotion: "sad", confidence: 0.68 },
      { emotion: "sad", confidence: 0.72 },
      { emotion: "neutral", confidence: 0.55 },
    ],
    channels: ["push"],
    status: "sent",
  });

  console.log(`✅ Alerts: 1 warning created`);

  console.log("\n🎉 Dev seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
