import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { lessons, lessonSteps } from './schema/learning';

// Load .env in local CLI execution if available
try {
  process.loadEnvFile?.();
} catch {
  // Ignore if no .env file
}

export type CatalogLessonStep = {
  id: string;
  lessonId: string;
  stepOrder: number;
  stepType: 'intro' | 'question' | 'activity' | 'summary';
  prompt: string;
  correctAnswer: string | null;
  title?: string;
  instruction?: string;
  helper?: string;
  image?: string;
  options?: Array<{
    id: string;
    label: string;
    helper?: string;
    tone?: string;
    icon?: string;
  }>;
};

export type CatalogLessonEntry = {
  lesson: {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    estimatedMinutes: number;
    isPublished: boolean;
    content: string;
  };
  steps: CatalogLessonStep[];
};

// ── Deterministic UUID Generator / Constants ─────────────────────────────────
// Format: 00000000-0000-4000-a000-00000000XX00 for lesson, XX01..XX09 for steps
const createLessonId = (num: number) =>
  `00000000-0000-4000-a000-${num.toString(16).padStart(12, '0')}`;
const createStepId = (lessonNum: number, stepNum: number) =>
  `00000000-0000-4000-a000-${(lessonNum * 100 + stepNum).toString(16).padStart(12, '0')}`;

export const LESSON_CATALOG: CatalogLessonEntry[] = [
  // ── 1. The Magic Word Box: Letters & Sounds ───────────────────────────────
  {
    lesson: {
      id: createLessonId(1),
      title: 'The Magic Word Box: Letters and Sounds',
      subject: 'English',
      gradeLevel: 'K-1st',
      estimatedMinutes: 12,
      isPublished: true,
      content: JSON.stringify({
        subtitle: 'Letters and sounds adventure',
        description: 'Explore friendly letter sounds, beginning consonants, and rhyming words with AgentKid.',
        image: '/images/lesson-abc.png',
        accent: 'primary',
        rating: '4.9',
        steps: [
          {
            title: 'Welcome to the Word Box',
            instruction: 'Listen as AgentKid opens the magical word box.',
            prompt: 'Welcome! Today we are discovering how letters make gentle sounds.',
            helper: 'Take your time. We learn by listening closely together.',
            image: '/images/lesson-abc.png',
            options: [
              { id: 'ready-1', label: "I'm ready to listen!", helper: 'Let us begin.' },
            ],
          },
          {
            title: 'Find the Beginning Sound',
            instruction: 'Choose the letter that starts the word Bear.',
            prompt: "Which letter makes the bouncy /b/ sound in 'Bear'?",
            helper: "Say the word slowly: 'B-b-bear'.",
            image: '/images/lesson-abc.png',
            options: [
              { id: 'b-opt', label: 'Letter B', helper: '/b/ sound like Bear' },
              { id: 'd-opt', label: 'Letter D', helper: '/d/ sound like Duck' },
              { id: 'p-opt', label: 'Letter P', helper: '/p/ sound like Penguin' },
            ],
          },
          {
            title: 'Rhyme Time',
            instruction: 'Select the word that rhymes with Cat.',
            prompt: "Which word has the same ending sound as 'Cat'?",
            helper: "Listen to the end: 'c-at'. Does 'hat' sound the same?",
            image: '/images/lesson-abc.png',
            options: [
              { id: 'hat-opt', label: 'Hat', helper: 'Hat rhymes with Cat!' },
              { id: 'dog-opt', label: 'Dog', helper: 'Dog has a different ending sound.' },
              { id: 'sun-opt', label: 'Sun', helper: 'Sun has an /un/ sound.' },
            ],
          },
          {
            title: 'Star Word Collector',
            instruction: 'Great listening today!',
            prompt: 'You found the sounds and rhyming words! What did you like best?',
            helper: 'Every step you take builds reading confidence.',
            image: '/images/lesson-abc.png',
            options: [
              { id: 'sum-proud', label: 'I liked hearing the sounds!', helper: 'Wonderful job!' },
              { id: 'sum-calm', label: 'I feel calm and happy.', helper: 'That is wonderful.' },
            ],
          },
        ],
      }),
    },
    steps: [
      {
        id: createStepId(1, 1),
        lessonId: createLessonId(1),
        stepOrder: 1,
        stepType: 'intro',
        prompt: 'Welcome! Today we are discovering how letters make gentle sounds.',
        correctAnswer: null,
      },
      {
        id: createStepId(1, 2),
        lessonId: createLessonId(1),
        stepOrder: 2,
        stepType: 'question',
        prompt: "Which letter makes the bouncy /b/ sound in 'Bear'?",
        correctAnswer: 'b-opt',
      },
      {
        id: createStepId(1, 3),
        lessonId: createLessonId(1),
        stepOrder: 3,
        stepType: 'question',
        prompt: "Which word has the same ending sound as 'Cat'?",
        correctAnswer: 'hat-opt',
      },
      {
        id: createStepId(1, 4),
        lessonId: createLessonId(1),
        stepOrder: 4,
        stepType: 'summary',
        prompt: 'You found the sounds and rhyming words! Great effort today.',
        correctAnswer: null,
      },
    ],
  },

  // ── 2. Count with Baby Penguins ───────────────────────────────────────────
  {
    lesson: {
      id: createLessonId(2),
      title: 'Count with Baby Penguins',
      subject: 'Math',
      gradeLevel: '1st-2nd',
      estimatedMinutes: 10,
      isPublished: true,
      content: JSON.stringify({
        subtitle: 'Numbers and friendly counting',
        description: 'Practice gentle addition and grouping with penguins on the sparkling iceberg.',
        image: '/images/lesson-math.png',
        accent: 'aqua',
        rating: '4.9',
        steps: [
          {
            title: 'Penguin Island',
            instruction: 'Meet the penguin colony on the ice.',
            prompt: 'The penguins are gathering on the snow for lunch! Let us count together.',
            helper: 'Counting slowly helps us see patterns clearly.',
            image: '/images/lesson-math.png',
            options: [
              { id: 'peng-ready', label: 'Let us count penguins!', helper: 'Off we go!' },
            ],
          },
          {
            title: 'Adding Fish Together',
            instruction: 'Add the fish caught by Mama and Baby penguin.',
            prompt: 'Mama penguin has 3 fish. Baby penguin catches 2 more. How many fish in all?',
            helper: 'Start with 3, then count 2 more: 4, 5!',
            image: '/images/lesson-math.png',
            options: [
              { id: 'fish-4', label: '4 fish', helper: 'Close! Count one more.' },
              { id: 'fish-5', label: '5 fish', helper: '3 + 2 = 5! Exactly right.' },
              { id: 'fish-6', label: '6 fish', helper: 'Try counting 3 plus 2.' },
            ],
          },
          {
            title: 'Walking in Pairs',
            instruction: 'Group the penguins into walking pairs.',
            prompt: 'There are 6 friendly penguins walking in pairs of 2. How many pairs are there?',
            helper: 'Count by twos: 2, 4, 6. How many groups of two?',
            image: '/images/lesson-math.png',
            options: [
              { id: 'pair-2', label: '2 pairs', helper: '2 pairs make 4 penguins.' },
              { id: 'pair-3', label: '3 pairs', helper: '3 pairs of 2 make 6 penguins!' },
              { id: 'pair-4', label: '4 pairs', helper: '4 pairs would be 8.' },
            ],
          },
          {
            title: 'Iceberg Champion',
            instruction: 'High five for great math thinking!',
            prompt: 'You solved the penguin math questions calmly and carefully.',
            helper: 'Math is a skill that grows with every practice.',
            image: '/images/lesson-math.png',
            options: [
              { id: 'math-done', label: 'I did it!', helper: 'Super effort today!' },
            ],
          },
        ],
      }),
    },
    steps: [
      {
        id: createStepId(2, 1),
        lessonId: createLessonId(2),
        stepOrder: 1,
        stepType: 'intro',
        prompt: 'The penguins are gathering on the snow for lunch! Let us count together.',
        correctAnswer: null,
      },
      {
        id: createStepId(2, 2),
        lessonId: createLessonId(2),
        stepOrder: 2,
        stepType: 'question',
        prompt: 'Mama penguin has 3 fish. Baby penguin catches 2 more. How many fish in all?',
        correctAnswer: 'fish-5',
      },
      {
        id: createStepId(2, 3),
        lessonId: createLessonId(2),
        stepOrder: 3,
        stepType: 'activity',
        prompt: 'There are 6 friendly penguins walking in pairs of 2. How many pairs are there?',
        correctAnswer: 'pair-3',
      },
      {
        id: createStepId(2, 4),
        lessonId: createLessonId(2),
        stepOrder: 4,
        stepType: 'summary',
        prompt: 'You solved the penguin math questions calmly and carefully.',
        correctAnswer: null,
      },
    ],
  },

  // ── 3. The Brave Little Fox: Exploring Feelings ───────────────────────────
  {
    lesson: {
      id: createLessonId(3),
      title: 'The Brave Little Fox: Exploring Feelings',
      subject: 'Social-Emotional',
      gradeLevel: 'K-2nd',
      estimatedMinutes: 15,
      isPublished: true,
      content: JSON.stringify({
        subtitle: 'Kindness and emotional awareness',
        description: 'Follow Little Fox through a new day, naming feelings and trying calm breathing.',
        image: '/images/lesson-story.png',
        accent: 'peach',
        rating: '4.8',
        steps: [
          {
            title: "Little Fox's Morning",
            instruction: 'Meet Little Fox in the quiet forest.',
            prompt: 'Little Fox is starting a new activity and notices butterflies in their tummy.',
            helper: 'Everyone feels nervous sometimes. That is completely normal.',
            image: '/images/lesson-story.png',
            options: [
              { id: 'fox-ready', label: 'Let us see how Fox feels', helper: 'We are with you, Fox.' },
            ],
          },
          {
            title: 'Name the Feeling',
            instruction: 'Help Fox recognize what this feeling is called.',
            prompt: 'When your tummy feels fluttery before doing something new, what is that feeling?',
            helper: 'Giving feelings a name helps them feel smaller and manageable.',
            image: '/images/lesson-story.png',
            options: [
              { id: 'feel-worried', label: 'Feeling nervous or worried', helper: 'Yes, naming worry helps us understand it.' },
              { id: 'feel-angry', label: 'Feeling grumpy', helper: 'Grumpy usually feels hot or stiff.' },
              { id: 'feel-sleepy', label: 'Feeling tired', helper: 'Tired usually makes us want to rest.' },
            ],
          },
          {
            title: 'Calm Breathing Step',
            instruction: 'Practice a calming breath together with Little Fox.',
            prompt: 'What can Little Fox do right now to help their body feel safe and calm?',
            helper: 'Take a slow breath in like smelling a flower, then breathe out like blowing out a candle.',
            image: '/images/lesson-story.png',
            options: [
              { id: 'act-breath', label: 'Take three slow, deep breaths', helper: 'Deep breaths send a message of calm to our brain.' },
              { id: 'act-shout', label: 'Shout as loud as possible', helper: 'Shouting might make our body feel more upset.' },
              { id: 'act-run', label: 'Hide and never try', helper: 'Taking a breath first helps us find courage.' },
            ],
          },
          {
            title: 'Brave and Gentle Heart',
            instruction: 'Celebrate being brave today!',
            prompt: 'Being brave does not mean never feeling scared. It means being kind to yourself.',
            helper: 'You and Little Fox did wonderful work understanding big feelings today.',
            image: '/images/lesson-story.png',
            options: [
              { id: 'fox-summary', label: 'I can take deep breaths too!', helper: 'You are so thoughtful and brave.' },
            ],
          },
        ],
      }),
    },
    steps: [
      {
        id: createStepId(3, 1),
        lessonId: createLessonId(3),
        stepOrder: 1,
        stepType: 'intro',
        prompt: 'Little Fox is starting a new activity and notices butterflies in their tummy.',
        correctAnswer: null,
      },
      {
        id: createStepId(3, 2),
        lessonId: createLessonId(3),
        stepOrder: 2,
        stepType: 'question',
        prompt: 'When your tummy feels fluttery before doing something new, what is that feeling?',
        correctAnswer: 'feel-worried',
      },
      {
        id: createStepId(3, 3),
        lessonId: createLessonId(3),
        stepOrder: 3,
        stepType: 'activity',
        prompt: 'What can Little Fox do right now to help their body feel safe and calm?',
        correctAnswer: 'act-breath',
      },
      {
        id: createStepId(3, 4),
        lessonId: createLessonId(3),
        stepOrder: 4,
        stepType: 'summary',
        prompt: 'Being brave means taking gentle steps even when things feel new.',
        correctAnswer: null,
      },
    ],
  },

  // ── 4. Sharing is Caring: Playground Friends ──────────────────────────────
  {
    lesson: {
      id: createLessonId(4),
      title: 'Sharing is Caring: Playground Friends',
      subject: 'Social Skills',
      gradeLevel: '1st-3rd',
      estimatedMinutes: 10,
      isPublished: true,
      content: JSON.stringify({
        subtitle: 'Friendship and cooperation',
        description: 'Learn simple, respectful ways to take turns and invite friends into play.',
        image: '/images/lesson-social.png',
        accent: 'pink',
        rating: '4.7',
        steps: [
          {
            title: 'At the Swings',
            instruction: 'Two friends arrive at the playground swing at the same moment.',
            prompt: 'Maya and Leo both want to use the red tire swing at recess.',
            helper: 'When two people want the same thing, cooperation helps everyone have fun.',
            image: '/images/lesson-social.png',
            options: [
              { id: 'play-ready', label: 'Let us see how they solve it', helper: 'Good thinking!' },
            ],
          },
          {
            title: 'Fair Turn-Taking',
            instruction: 'Pick the fairest solution for both friends.',
            prompt: 'What is a kind and fair way for Maya and Leo to share the swing?',
            helper: 'A fair plan gives both friends equal time to enjoy the swing.',
            image: '/images/lesson-social.png',
            options: [
              { id: 'turn-timer', label: 'Take turns: 10 pushes each, or use a timer', helper: 'Fair turns keep play peaceful and fun!' },
              { id: 'turn-push', label: 'Push the other person off', helper: 'Pushing hurts people and is never safe.' },
              { id: 'turn-never', label: 'Neither person swings at all', helper: 'Taking turns is much better!' },
            ],
          },
          {
            title: 'Inviting Words',
            instruction: 'Choose gentle words to invite someone to join.',
            prompt: "What words can Leo say to invite another friend into the game?",
            helper: 'Kind words make others feel welcome and included.',
            image: '/images/lesson-social.png',
            options: [
              { id: 'words-join', label: "'Would you like to play with us?'", helper: 'Warm and welcoming!' },
              { id: 'words-go', label: "'Go away, we were here first.'", helper: 'That might hurt their feelings.' },
              { id: 'words-ignore', label: 'Pretend not to see them', helper: 'Saying hello is always kinder.' },
            ],
          },
          {
            title: 'Friendship Star',
            instruction: 'You earned the Friendship Star badge!',
            prompt: 'Taking turns and using kind words makes you a great friend to play with.',
            helper: 'When you share and cooperate, everybody wins.',
            image: '/images/lesson-social.png',
            options: [
              { id: 'friend-done', label: 'I know how to take turns!', helper: 'You are an awesome friend!' },
            ],
          },
        ],
      }),
    },
    steps: [
      {
        id: createStepId(4, 1),
        lessonId: createLessonId(4),
        stepOrder: 1,
        stepType: 'intro',
        prompt: 'Maya and Leo both want to use the red tire swing at recess.',
        correctAnswer: null,
      },
      {
        id: createStepId(4, 2),
        lessonId: createLessonId(4),
        stepOrder: 2,
        stepType: 'question',
        prompt: 'What is a kind and fair way for Maya and Leo to share the swing?',
        correctAnswer: 'turn-timer',
      },
      {
        id: createStepId(4, 3),
        lessonId: createLessonId(4),
        stepOrder: 3,
        stepType: 'question',
        prompt: "What words can Leo say to invite another friend into the game?",
        correctAnswer: 'words-join',
      },
      {
        id: createStepId(4, 4),
        lessonId: createLessonId(4),
        stepOrder: 4,
        stepType: 'summary',
        prompt: 'Taking turns and using kind words makes you a great friend to play with.',
        correctAnswer: null,
      },
    ],
  },
];

export type SeedResult = {
  lessonsSeeded: number;
  stepsSeeded: number;
  lessonIds: string[];
};

export async function seedLessonCatalog(options?: {
  db?: unknown;
  databaseUrl?: string;
  client?: postgres.Sql;
}): Promise<SeedResult> {
  const customDb = options?.db;
  let client: postgres.Sql | null = null;
  let targetDb = customDb;

  if (!targetDb) {
    const connectionString = options?.databaseUrl || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required to seed lesson catalog.');
    }
    client = options?.client || postgres(connectionString, { max: 1 });
    targetDb = drizzle(client, { schema });
  }

  try {
    const dbInstance = targetDb as {
      transaction: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
      insert: (table: unknown) => {
        values: (data: unknown) => {
          onConflictDoUpdate: (config: { target: unknown; set: unknown }) => Promise<unknown>;
        };
      };
    };

    const seededIds: string[] = [];
    let stepsCount = 0;

    await dbInstance.transaction(async (txInstance) => {
      const tx = txInstance as typeof dbInstance;

      for (const entry of LESSON_CATALOG) {
        await tx
          .insert(lessons)
          .values({
            id: entry.lesson.id,
            title: entry.lesson.title,
            subject: entry.lesson.subject,
            gradeLevel: entry.lesson.gradeLevel,
            estimatedMinutes: entry.lesson.estimatedMinutes,
            isPublished: entry.lesson.isPublished,
            content: entry.lesson.content,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: lessons.id,
            set: {
              title: entry.lesson.title,
              subject: entry.lesson.subject,
              gradeLevel: entry.lesson.gradeLevel,
              estimatedMinutes: entry.lesson.estimatedMinutes,
              isPublished: entry.lesson.isPublished,
              content: entry.lesson.content,
              updatedAt: new Date(),
            },
          });

        seededIds.push(entry.lesson.id);

        for (const step of entry.steps) {
          await tx
            .insert(lessonSteps)
            .values({
              id: step.id,
              lessonId: step.lessonId,
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              prompt: step.prompt,
              correctAnswer: step.correctAnswer,
            })
            .onConflictDoUpdate({
              target: lessonSteps.id,
              set: {
                lessonId: step.lessonId,
                stepOrder: step.stepOrder,
                stepType: step.stepType,
                prompt: step.prompt,
                correctAnswer: step.correctAnswer,
              },
            });
          stepsCount++;
        }
      }
    });

    return {
      lessonsSeeded: seededIds.length,
      stepsSeeded: stepsCount,
      lessonIds: seededIds,
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// ── Direct CLI Execution ───────────────────────────────────────────────────────
if (
  process.argv[1]?.endsWith('seed-lessons.ts') ||
  process.argv[1]?.endsWith('seed-lessons.js')
) {
  seedLessonCatalog()
    .then((result) => {
      console.log(
        `[seed-lessons] Successfully seeded ${result.lessonsSeeded} lessons and ${result.stepsSeeded} steps idempotently.`,
      );
    })
    .catch((err) => {
      console.error('[seed-lessons] Failed to seed lesson catalog:', err);
      process.exit(1);
    });
}
