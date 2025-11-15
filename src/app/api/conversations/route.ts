import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Filter by userId
    const results = await db.select({
      id: conversations.id,
      title: conversations.title,
      userId: conversations.userId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title } = body;

    // Validate required fields
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return NextResponse.json(
        { error: 'Title cannot be empty', code: 'EMPTY_TITLE' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Automatically set userId from session
    const newConversation = await db.insert(conversations)
      .values({
        title: trimmedTitle,
        userId: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newConversation[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}