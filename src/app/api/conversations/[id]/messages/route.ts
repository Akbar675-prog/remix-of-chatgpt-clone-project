import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid conversation ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const conversationId = parseInt(id);

    // Verify conversation exists and belongs to user
    const conversation = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role, content, timestamp } = body;

    // Validate role
    if (!role) {
      return NextResponse.json(
        { 
          error: 'Role is required',
          code: 'MISSING_ROLE'
        },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { 
          error: 'Role must be either "user" or "assistant"',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      );
    }

    // Validate content
    if (!content) {
      return NextResponse.json(
        { 
          error: 'Content is required',
          code: 'MISSING_CONTENT'
        },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { 
          error: 'Content cannot be empty',
          code: 'EMPTY_CONTENT'
        },
        { status: 400 }
      );
    }

    // Insert message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        role,
        content: trimmedContent,
        timestamp: timestamp ?? Date.now(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}