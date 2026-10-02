import { db } from '@/db/client';
import { children } from '@/db/schema';
import { hashPin } from '@/lib/auth/child-auth';
import { requireParentSession, getParentHousehold } from '@/server/auth';
import { CreateChildSchema } from '@/server/contracts/auth';
import { ERRORS } from '@/lib/api/errors';
import { type NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

// GET /api/children
// List all active children in the authenticated parent's household
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) {
      return session as NextResponse;
    }

    const household = await getParentHousehold(session.sub);
    if (!household) {
      return ERRORS.notFound('Household not found for parent.');
    }

    const householdChildren = await db
      .select({
        id: children.id,
        displayName: children.displayName,
        age: children.age,
        gradeLevel: children.gradeLevel,
        avatarUrl: children.avatarUrl,
        isActive: children.isActive,
        createdAt: children.createdAt,
      })
      .from(children)
      .where(and(eq(children.householdId, household.id), eq(children.isActive, true)));

    return NextResponse.json({
      children: householdChildren.map((c) => ({
        ...c,
        name: c.displayName,
        grade: c.gradeLevel,
      })),
    });
  } catch (err) {
    console.error('[children/GET] Error:', err);
    return ERRORS.internal();
  }
}

// POST /api/children
// Create a new child in the authenticated parent's household
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) {
      return session as NextResponse;
    }

    const household = await getParentHousehold(session.sub);
    if (!household) {
      return ERRORS.notFound('Household not found for parent.');
    }

    const body = await req.json();
    const parsed = CreateChildSchema.safeParse(body);

    if (!parsed.success) {
      return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const resolvedName = (parsed.data.name ?? parsed.data.displayName)!.trim();
    const { pin, age, grade, gradeLevel } = parsed.data;

    const pinHash = await hashPin(pin);

    const [child] = await db
      .insert(children)
      .values({
        householdId: household.id,
        displayName: resolvedName,
        pinHash,
        age: age ?? null,
        gradeLevel: (gradeLevel ?? grade)?.trim() ?? null,
      } as any)
      .returning({
        id: children.id,
        displayName: children.displayName,
        age: children.age,
        gradeLevel: children.gradeLevel,
        avatarUrl: children.avatarUrl,
        isActive: children.isActive,
        createdAt: children.createdAt,
      });

    if (!child) {
      return ERRORS.internal('Failed to create child profile.');
    }

    return NextResponse.json(
      {
        child: {
          id: child.id,
          name: child.displayName,
          displayName: child.displayName,
          age: child.age,
          gradeLevel: child.gradeLevel,
          grade: child.gradeLevel,
          avatarUrl: child.avatarUrl,
          isActive: child.isActive,
          createdAt: child.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[children/POST] Error:', err);
    return ERRORS.internal();
  }
}
