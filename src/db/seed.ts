import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { seedLessonCatalog } from './seed-lessons';

const SEED_SALT_ROUNDS = 12;

async function hashSeedCredential(value: string): Promise<string> {
  return bcrypt.hash(value, SEED_SALT_ROUNDS);
}

export async function runSeed(databaseUrl?: string) {
  const connectionString = databaseUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required to seed database.');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('[seed] Seeding database...');

  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_DATA !== '1') {
    console.log('[seed] Production mode: skipping demo users, household, and children.');
    const lessonResult = await seedLessonCatalog({ db });
    console.log(
      `[seed] Seeded ${lessonResult.lessonsSeeded} lessons and ${lessonResult.stepsSeeded} steps.`,
    );
    console.log('[seed] Seeding complete.');
    await client.end();
    return;
  }

  // 1. System Admin user
  const adminPasswordHash = await hashSeedCredential('Admin@Password1!');
  const [admin] = await db
    .insert(schema.users)
    .values({
      email: 'admin@agentkid.example',
      displayName: 'System Admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
    } as unknown as typeof schema.users.$inferInsert)
    .onConflictDoNothing()
    .returning({ id: schema.users.id });

  if (admin) {
    console.log(`[seed] Created admin: ${admin.id}`);
  }

  // 2. Test Parent user
  const parentPasswordHash = await hashSeedCredential('Parent@Password1!');
  const [parent] = await db
    .insert(schema.users)
    .values({
      email: 'parent@agentkid.example',
      displayName: 'Test Parent',
      passwordHash: parentPasswordHash,
      role: 'parent',
    } as unknown as typeof schema.users.$inferInsert)
    .onConflictDoNothing()
    .returning({ id: schema.users.id });

  let householdId: string | undefined;

  if (parent) {
    console.log(`[seed] Created parent: ${parent.id}`);

    // 3. Household owned by parent
    const [household] = await db
      .insert(schema.households)
      .values({
        name: 'Snow Family',
        ownerId: parent.id,
      } as unknown as typeof schema.households.$inferInsert)
      .onConflictDoNothing()
      .returning({ id: schema.households.id });

    householdId = household?.id;

    if (householdId) {
      console.log(`[seed] Created household: ${householdId}`);

      // 4. Household membership (owner)
      await db
        .insert(schema.householdMembers)
        .values({
          householdId,
          userId: parent.id,
          role: 'owner',
        } as unknown as typeof schema.householdMembers.$inferInsert)
        .onConflictDoNothing();

      // 5. Seed 2 children (Alice & Bob)
      const child1PinHash = await hashSeedCredential('1234');
      const child2PinHash = await hashSeedCredential('5678');

      await db
        .insert(schema.children)
        .values([
          {
            householdId,
            displayName: 'Alice',
            pinHash: child1PinHash,
            gradeLevel: '3rd',
            age: 8,
          },
          {
            householdId,
            displayName: 'Bob',
            pinHash: child2PinHash,
            gradeLevel: '1st',
            age: 6,
          },
        ] as unknown as (typeof schema.children.$inferInsert)[])
        .onConflictDoNothing();

      console.log('[seed] Created 2 children: Alice and Bob');
    }
  }

  // 6. Lesson catalog (idempotent upserts on deterministic ids)
  const lessonResult = await seedLessonCatalog({ db });
  console.log(
    `[seed] Seeded ${lessonResult.lessonsSeeded} lessons and ${lessonResult.stepsSeeded} steps.`,
  );

  console.log('[seed] Seeding complete.');
  await client.end();
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}
